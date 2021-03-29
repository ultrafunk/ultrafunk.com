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
import * as playerPlaylist  from './player-playlist.js';
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
  autoplayToggleId:  'footer-autoplay-toggle',
  crossfadeToggleId: 'footer-crossfade-toggle',
  doubleClickDelay:  500,
};

const mElements = {
  playbackControls: { details: null, thumbnail: null, timer: null, statePlaying: false },
  autoplayToggle:   null,
  crossfadeToggle:  null,
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
    updateAutoplayDOM(mSettings.user.autoplay);
    updateCrossfadeDOM(mSettings.user.autoCrossfade);
  }
  else if (document.getElementById('player-playlist'))
  {
    mElements.autoplayToggle  = document.getElementById(mConfig.autoplayToggleId);
    mElements.crossfadeToggle = document.getElementById(mConfig.crossfadeToggleId);
    updateAutoplayDOM(mSettings.user.autoplay);

    playerPlaylist.init(mSettings, autoplayToggle);
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

  utils.fullscreenElement.init();
  utils.keyboardShortcuts.init(mSettings.user);

  mElements.playbackControls.details   = document.getElementById('playback-controls').querySelector('.details-control');
  mElements.playbackControls.thumbnail = document.getElementById('playback-controls').querySelector('.thumbnail-control');
  mElements.playbackControls.timer     = document.getElementById('playback-controls').querySelector('.timer-control');
  mElements.autoplayToggle             = document.getElementById(mConfig.autoplayToggleId);
  mElements.crossfadeToggle            = document.getElementById(mConfig.crossfadeToggleId);

  /* eslint-disable */
  utils.addEventListeners('i.nav-bar-arrow-back',                'click', prevNextNavTo, navigationUrls.prev);
  utils.addEventListeners('i.nav-bar-arrow-fwd',                 'click', prevNextNavTo, navigationUrls.next);
  utils.addEventListeners('nav.post-navigation .nav-previous a', 'click', prevNextNavTo, navigationUrls.prev);
  utils.addEventListeners('nav.post-navigation .nav-next a',     'click', prevNextNavTo, navigationUrls.next);
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
        if (event.shiftKey === true)
        {
          prevNextNavTo(event, navigationUrls.prev); // eslint-disable-line no-undef
        }
        break;

      case 'ArrowRight':
        if (event.shiftKey === true)
        {
          prevNextNavTo(event, navigationUrls.next); // eslint-disable-line no-undef
        }
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
  mElements.playbackControls.details.addEventListener('click', playbackDetailsClick);
  mElements.playbackControls.thumbnail.addEventListener('click', playbackDetailsClick);
  mElements.playbackControls.timer.addEventListener('click', autoplayToggle);
  mElements.autoplayToggle.addEventListener('click', autoplayToggle);
  mElements.crossfadeToggle.addEventListener('click', crossfadeToggle);
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
    if (mSettings.user.autoResumePlayback && mElements.playbackControls.statePlaying)
    {
      if (playback.getStatus().isPlaying === false)
        playback.togglePlayPause();
    }

    /*
    if (settings.user.keepMobileScreenOn && mElements.playbackControls.statePlaying)
      screenWakeLock.stateVisible();
    */
    
    if (mSettings.user.keepMobileScreenOn)
      screenWakeLock.stateVisible();
  }
  else if (document.visibilityState === 'hidden')
  {
    if (mSettings.user.autoResumePlayback && playback.getStatus().isPlaying)
      mElements.playbackControls.statePlaying = true;
    else
      mElements.playbackControls.statePlaying = false;

  //debug.log('documentEventVisibilityChange() - statePlaying: ' + mElements.playbackControls.statePlaying);
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
// Autoplay UI toggle and DOM update
// ************************************************************************************************

function autoplayToggle(event)
{
  event.preventDefault();
  mSettings.user.autoplay = (mSettings.user.autoplay === true) ? false : true;
  showSnackbar(mSettings.user.autoplay ? 'Autoplay enabled (<b>Shift</b> + <b>A</b> to disable)' : 'Autoplay disabled (<b>Shift</b> + <b>A</b> to enable)', 5);
  updateAutoplayDOM(mSettings.user.autoplay);
}

function updateAutoplayDOM(autoplay)
{
  debug.log(`updateAutoplayDOM() - autoplay: ${autoplay}`);
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
  updateCrossfadeDOM(mSettings.user.autoCrossfade);
}

function updateCrossfadeDOM(autoCrossfade)
{
  debug.log(`updateCrossfadeDOM() - autoCrossfade: ${autoCrossfade}`);
  mElements.crossfadeToggle.querySelector('.crossfade-on-off').textContent = autoCrossfade ? 'ON' : 'OFF';
}
