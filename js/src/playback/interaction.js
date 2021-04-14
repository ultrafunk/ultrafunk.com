//
// Browser interaction and media playback handler
//
// https://ultrafunk.com
//


import * as debugLogger     from '../shared/debuglogger.js';
import * as eventLogger     from './eventlogger.js';
import * as playback        from './playback.js';
import * as playbackEvents  from './playback-events.js';
import * as screenWakeLock  from './screen-wakelock.js';
import * as utils           from '../shared/utils.js';
import * as listPlayer      from './list-player.js';
import { showSnackbar }     from '../shared/snackbar.js';
import { playbackSettings } from '../shared/settings.js';

import {
  KEY,
  readWriteSettingsProxy,
} from '../shared/storage.js';


/*************************************************************************************************/


const debug         = debugLogger.newInstance('playback-interaction');
const eventLog      = new eventLogger.Interaction(10);
let mSettings       = {};
let isPlaybackReady = false;

const mConfig = {
  doubleClickDelay: 500,
};

const mElements = {
  controls:        { details: null, thumbnail: null, timer: null, statePlaying: false },
  playerToggle:    null,
  autoplayToggle:  null,
  crossfadeToggle: null,
};


// ************************************************************************************************
// Document ready and document / window event listeners
// ************************************************************************************************

document.addEventListener('DOMContentLoaded', () =>
{ 
  debug.log('DOMContentLoaded');

  readSettings();

  if (playback.hasEmbeddedPlayers())
  {
    initInteraction();
    initPlayback();
    initShared();
  }
  else if (document.getElementById('list-player-container') !== null)
  {
    initShared();
    listPlayer.init(mSettings, autoplayToggle);
  }
});


// ************************************************************************************************
// Read settings and interaction init
// ************************************************************************************************

function readSettings()
{
  debug.log('readSettings()');
  mSettings = readWriteSettingsProxy(KEY.UF_PLAYBACK_SETTINGS, playbackSettings, true);
  debug.log(mSettings);
}

function initInteraction()
{
  debug.log('initInteraction()');

  mElements.controls.details   = document.querySelector('.playback-details-control');
  mElements.controls.thumbnail = document.querySelector('.playback-thumbnail-control');
  mElements.controls.timer     = document.querySelector('.playback-timer-control');

  /* eslint-disable */
  utils.addListenerAll('i.nav-bar-arrow-back',             'click', prevNextNavTo, navigationVars.prev);
  utils.addListenerAll('i.nav-bar-arrow-fwd',              'click', prevNextNavTo, navigationVars.next);
  utils.addListener('nav.post-navigation .nav-previous a', 'click', prevNextNavTo, navigationVars.prev);
  utils.addListener('nav.post-navigation .nav-next a',     'click', prevNextNavTo, navigationVars.next);
  /* eslint-enable */
  
  document.addEventListener('keydown', documentEventKeyDown);
  window.addEventListener('blur', windowEventBlur);
}

function initPlayback()
{
  playback.init(mSettings);
  playbackEvents.addListener(playbackEvents.EVENT.READY,                playbackEventReady);
  playbackEvents.addListener(playbackEvents.EVENT.MEDIA_SHOW,           playbackEventMediaEnded);
  playbackEvents.addListener(playbackEvents.EVENT.MEDIA_ENDED,          playbackEventMediaEnded);
  playbackEvents.addListener(playbackEvents.EVENT.MEDIA_TIME_REMAINING, playbackEventMediaTimeRemaining);
}

function initShared()
{
  utils.fullscreenElement.init();
  utils.keyboardShortcuts.init(mSettings.user);

  mElements.playerToggle    = document.getElementById('footer-player-toggle');
  mElements.autoplayToggle  = document.getElementById('footer-autoplay-toggle');
  mElements.crossfadeToggle = document.getElementById('footer-crossfade-toggle');

  utils.addListener('.playback-shuffle-control', 'click', utils.shuffleClick);
  utils.addListener('#footer-player-toggle',     'click', playerToggle);
  utils.addListener('#footer-autoplay-toggle',   'click', autoplayToggle);
  utils.addListener('#footer-crossfade-toggle',  'click', crossfadeToggle);

  mElements.playerToggle.querySelector('span').textContent = document.body.classList.contains('list-player') ? 'List' : 'Gallery';
  updateAutoplayToggle(mSettings.user.autoplay);
  updateCrossfadeToggle(mSettings.user.autoCrossfade);
}


// ************************************************************************************************
// Keyboard events handler and functions
// ************************************************************************************************

function documentEventKeyDown(event)
{
  if (isPlaybackReady && utils.keyboardShortcuts.allow() && (event.repeat === false) && (event.ctrlKey === false) && (event.altKey === false))
  {
    switch(event.code)
    {
      case 'Backquote':
        showCurrentTrack(event);
        break;
    }

    switch (event.key)
    {
      case ' ':
        event.preventDefault();
        playback.togglePlayPause();
        break;

      case 'ArrowLeft':
        event.preventDefault();
        (event.shiftKey === true) ? prevNextNavTo(event, navigationVars.prev) : playback.prevClick(event); // eslint-disable-line no-undef
        break;

      case 'ArrowRight':
        event.preventDefault();
        (event.shiftKey === true) ? prevNextNavTo(event, navigationVars.next) : playback.nextClick(event); // eslint-disable-line no-undef
        break;

      case 'A':
        autoplayToggle(event);
        break;

      case 'f':
      case 'F':
        event.preventDefault();
        utils.fullscreenElement.toggle(document.getElementById(playback.getStatus().iframeId));
        break;

      case 'm':
      case 'M':
        event.preventDefault();
        playback.toggleMute();
        showSnackbar(mSettings.user.masterMute ? 'Volume is muted (<b>m</b> to unmute)' : 'Volume is unmuted (<b>m</b> to mute)', 3);
        break;

      /*
      case 'P':
        playerToggle(event);
        break;
      */

      case 'x':
      case 'X':
        if (mElements.crossfadeToggle.classList.contains('disabled') === false)
        {
          crossfadeToggle(event);
        }
        break;
    }
  }
}


// ************************************************************************************************
// playbackEvent listeners
// ************************************************************************************************

function playbackEventReady()
{
  mElements.controls.details.addEventListener('click', playbackDetailsClick);
  mElements.controls.thumbnail.addEventListener('click', playbackDetailsClick);
  mElements.controls.timer.addEventListener('click', autoplayToggle);
  document.addEventListener('visibilitychange', documentEventVisibilityChange);

  if (mSettings.user.keepMobileScreenOn)
    screenWakeLock.enable(mSettings);

  isPlaybackReady = true;
}

function playbackEventMediaEnded()
{
  if (mSettings.user.autoExitFullscreen)
    utils.fullscreenElement.exit();
}

function playbackEventMediaTimeRemaining(playbackEvent)
{
  if (mSettings.user.autoExitFsOnWarning && (playbackEvent.data.timeRemainingSeconds <= mSettings.user.timeRemainingSeconds))
    utils.fullscreenElement.exit();
}


// ************************************************************************************************
// Window and document event handlers
// ************************************************************************************************

function windowEventBlur()
{
  // setTimeout(0) = Yield
  setTimeout(() =>
  {
    // document (page) iframe was focused
    if (document.activeElement instanceof HTMLIFrameElement)
    {
      setTimeout(() =>
      {
        document.activeElement.blur();
        
        // Needed to get Firefox to behave like Chrome
        if (document.activeElement instanceof HTMLIFrameElement)
          document.activeElement.blur();
      }, 250);
    }
  }, 0);
}

function documentEventVisibilityChange()
{
//debug.log(`documentEventVisibilityChange(): ${document.visibilityState}`);

  if (document.visibilityState === 'visible')
  {
    if (mSettings.user.autoResumePlayback && mElements.controls.statePlaying)
    {
      if (playback.getStatus().isPlaying === false)
        playback.togglePlayPause();
    }

    /*
    if (settings.user.keepMobileScreenOn && mElements.controls.statePlaying)
      screenWakeLock.stateVisible();
    */
    
    if (mSettings.user.keepMobileScreenOn)
      screenWakeLock.stateVisible();
  }
  else if (document.visibilityState === 'hidden')
  {
    if (mSettings.user.autoResumePlayback && playback.getStatus().isPlaying)
      mElements.controls.statePlaying = true;
    else
      mElements.controls.statePlaying = false;

  //debug.log('documentEventVisibilityChange() - statePlaying: ' + mElements.controls.statePlaying);
  }
}


// ************************************************************************************************
// Click event handlers
// ************************************************************************************************

function playbackDetailsClick(event)
{
  showCurrentTrack(event);
  eventLog.add(eventLogger.SOURCE.MOUSE, eventLogger.EVENT.MOUSE_CLICK, null);

  if (event.target.tagName.toLowerCase() === 'img')
    showInteractionHint('showTrackImageHint', '<b>Tip:</b> Double click or tap on the Track Thumbnail for full screen');
  else
    showInteractionHint('showDetailsHint', '<b>Tip:</b> Double click or tap on Artist &amp; Title for full screen');

  if (eventLog.doubleClicked(eventLogger.SOURCE.MOUSE, eventLogger.EVENT.MOUSE_CLICK, mConfig.doubleClickDelay))
    utils.fullscreenElement.enter(document.getElementById(playback.getStatus().iframeId));
}

function showInteractionHint(hintKey, hintText, snackbarTimeout = 0)
{
  if (mSettings.priv.tips[hintKey])
  {
    showSnackbar(hintText, snackbarTimeout);
    mSettings.priv.tips[hintKey] = false;
  }
}

function prevNextNavTo(event, destUrl)
{
  if ((event !== null) && (destUrl !== null))
  {
    event.preventDefault();
    playbackEvents.navigateTo(destUrl, playback.getStatus().isPlaying);
  }
}

function showCurrentTrack(event)
{
  event.preventDefault();
  playbackEvents.scrollToId(playback.getStatus().trackId);
}


// ************************************************************************************************
// Player = Gallery / List selection toggle
// ************************************************************************************************

function playerToggle(event)
{
  event.preventDefault();

  const isListPlayer = document.body.classList.contains('list-player');
  const destData     = getDestData(isListPlayer);
  let   destUrl      = window.location.href.replace(/\/page\/(?!0)\d{1,6}/, ''); // Strip off any pagination

  // Add new destination pagination if needed
  if (destData.pageNum > 1)
    destUrl = `${destUrl}page/${destData.pageNum}/`;

  sessionStorage.setItem(KEY.UF_AUTOPLAY, JSON.stringify(destData.trackData));

  if (isListPlayer)
    window.location.href = destUrl.replace(/list\//, '');
  else
    window.location.href = destUrl.replace(/ultrafunk\.com\//, 'ultrafunk.com/list/');
}

function getDestData(isListPlayer)
{
  const urlParts          = window.location.href.split('/');
  const pageIndex         = urlParts.findIndex(part => (part.toLowerCase() === 'page'));
  const currentPage       = (pageIndex !== -1) ? parseInt(urlParts[pageIndex + 1]) : 1;
  const trackData         = isListPlayer ? listPlayer.getStatus()             : playback.getStatus();
  const tracksPerPageFrom = isListPlayer ? navigationVars.listItemsPerPage    : navigationVars.galleryItemsPerPage; // eslint-disable-line no-undef
  const tracksPerPageTo   = isListPlayer ? navigationVars.galleryItemsPerPage : navigationVars.listItemsPerPage; // eslint-disable-line no-undef
  const trackOffset       = trackData.currentTrack + ((currentPage - 1) * tracksPerPageFrom);

  return {
    pageNum: Math.ceil(trackOffset / tracksPerPageTo),
    trackData: {
      autoplay: trackData?.isPlaying,
      trackId:  trackData?.trackId,
      position: trackData?.position,
    }
  };
}


// ************************************************************************************************
// Autoplay UI toggle and DOM update
// ************************************************************************************************

function autoplayToggle(event)
{
  event.preventDefault();
  mSettings.user.autoplay = (mSettings.user.autoplay === true) ? false : true;
  showSnackbar(mSettings.user.autoplay ? 'Autoplay enabled (<b>Shift</b> + <b>A</b> to disable)' : 'Autoplay disabled (<b>Shift</b> + <b>A</b> to enable)', 5);
  updateAutoplayToggle(mSettings.user.autoplay);
}

function updateAutoplayToggle(autoplay)
{
  debug.log(`updateAutoplayToggle() - autoplay: ${autoplay}`);
  mElements.autoplayToggle.querySelector('.autoplay-on-off').textContent = autoplay ? 'ON' : 'OFF';
  autoplay ? utils.replaceClass(document.body, 'autoplay-off', 'autoplay-on') : utils.replaceClass(document.body, 'autoplay-on', 'autoplay-off');
  autoplay ? mElements.crossfadeToggle.classList.remove('disabled')           : mElements.crossfadeToggle.classList.add('disabled');
}


// ************************************************************************************************
// Crossfade UI toggle and DOM update
// ************************************************************************************************

function crossfadeToggle(event)
{
  event.preventDefault();
  mSettings.user.autoCrossfade = (mSettings.user.autoCrossfade === true) ? false : true;
  showSnackbar(mSettings.user.autoCrossfade ? 'Auto Crossfade enabled (<b>x</b> to disable)' : 'Auto Crossfade disabled (<b>x</b> to enable)', 5);
  updateCrossfadeToggle(mSettings.user.autoCrossfade);
}

function updateCrossfadeToggle(autoCrossfade)
{
  debug.log(`updateCrossfadeToggle() - autoCrossfade: ${autoCrossfade}`);
  mElements.crossfadeToggle.querySelector('.crossfade-on-off').textContent = autoCrossfade ? 'ON' : 'OFF';
}
