//
// Browser interaction and media playback handler
//
// https://ultrafunk.com
//


import * as debugLogger     from '../shared/debuglogger.js';
import * as eventLogger     from './eventlogger.js';
import * as galleryPlayer   from './gallery-player.js';
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


const debug    = debugLogger.newInstance('playback-interaction');
const eventLog = new eventLogger.Interaction(10);

const m = {
  settings:        {},
  isPlaybackReady: false,
  statePlaying:    false,
};

const config = {
  doubleClickDelay: 500,
};

const elements = {
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

  if (galleryPlayer.hasEmbeddedPlayers())
  {
    initInteraction();
    initPlayback();
    initShared();
  }
  else if (document.getElementById('list-player-container') !== null)
  {
    initShared();
    listPlayer.init(m.settings, elements.autoplayToggle);
  }
});


// ************************************************************************************************
// Read settings and interaction init
// ************************************************************************************************

function readSettings()
{
  debug.log('readSettings()');
  m.settings = readWriteSettingsProxy(KEY.UF_PLAYBACK_SETTINGS, playbackSettings, true);
  debug.log(m.settings);
}

function initInteraction()
{
  debug.log('initInteraction()');

  /* eslint-disable */
  utils.addListenerAll('span.nav-bar-arrow-back',          'click', prevNextNavTo, navigationVars.prev);
  utils.addListenerAll('span.nav-bar-arrow-fwd',           'click', prevNextNavTo, navigationVars.next);
  utils.addListener('nav.post-navigation .nav-previous a', 'click', prevNextNavTo, navigationVars.prev);
  utils.addListener('nav.post-navigation .nav-next a',     'click', prevNextNavTo, navigationVars.next);
  /* eslint-enable */
  
  document.addEventListener('keydown', documentEventKeyDown);
  window.addEventListener('blur', windowEventBlur);
}

function initPlayback()
{
  galleryPlayer.init(m.settings);
  playbackEvents.addListener(playbackEvents.EVENT.READY,                playbackEventReady);
  playbackEvents.addListener(playbackEvents.EVENT.MEDIA_SHOW,           playbackEventMediaEnded);
  playbackEvents.addListener(playbackEvents.EVENT.MEDIA_ENDED,          playbackEventMediaEnded);
  playbackEvents.addListener(playbackEvents.EVENT.MEDIA_TIME_REMAINING, playbackEventMediaTimeRemaining);
}

function initShared()
{
  utils.fullscreenElement.init();
  utils.keyboardShortcuts.init(m.settings.user);

  elements.playerToggle    = new PlayerToggle('footer-player-toggle');
  elements.crossfadeToggle = new CrossfadeToggle('footer-crossfade-toggle');
  elements.autoplayToggle  = new AutoplayToggle('footer-autoplay-toggle');

  utils.addListener('.playback-shuffle-control', 'click', utils.shuffleClick);
}


// ************************************************************************************************
// Keyboard events handler and functions
// ************************************************************************************************

function documentEventKeyDown(event)
{
  if (m.isPlaybackReady               &&
      utils.keyboardShortcuts.allow() &&
      (event.repeat  === false)       &&
      (event.ctrlKey === false)       &&
      (event.altKey  === false))
  {
    switch(event.code)
    {
      case 'Backquote':
        event.preventDefault();
        playbackEvents.scrollToId(galleryPlayer.getStatus().trackId);
        break;
    }

    switch (event.key)
    {
      case ' ':
        event.preventDefault();
        galleryPlayer.togglePlayPause();
        break;

      case 'ArrowLeft':
        event.preventDefault();
        (event.shiftKey === true) ? prevNextNavTo(null, navigationVars.prev) : galleryPlayer.prevClick(event); // eslint-disable-line no-undef
        break;

      case 'ArrowRight':
        event.preventDefault();
        (event.shiftKey === true) ? prevNextNavTo(null, navigationVars.next) : galleryPlayer.nextClick(event); // eslint-disable-line no-undef
        break;

      case 'A':
        elements.autoplayToggle.toggle(event);
        break;

      case 'f':
      case 'F':
        event.preventDefault();
        utils.fullscreenElement.toggle(document.getElementById(galleryPlayer.getStatus().iframeId));
        break;

      case 'm':
      case 'M':
        event.preventDefault();
        galleryPlayer.toggleMute();
        showSnackbar(m.settings.user.masterMute ? 'Volume is muted (<b>m</b> to unmute)' : 'Volume is unmuted (<b>m</b> to mute)', 3);
        break;

      /*
      case 'P':
        playerToggle(event);
        break;
      */

      case 'x':
      case 'X':
        if (elements.crossfadeToggle.classList.contains('disabled') === false)
        {
          elements.crossfadeToggle.toggle(event);
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
  utils.addListener('.playback-details-control',   'click', playbackDetailsClick);
  utils.addListener('.playback-thumbnail-control', 'click', playbackDetailsClick);
  utils.addListener('.playback-timer-control',     'click', (event) => elements.autoplayToggle.toggle(event));
  document.addEventListener('visibilitychange', documentEventVisibilityChange);

  if (m.settings.user.keepMobileScreenOn)
    screenWakeLock.enable(m.settings);

  m.isPlaybackReady = true;
}

function playbackEventMediaEnded()
{
  if (m.settings.user.autoExitFullscreen)
    utils.fullscreenElement.exit();
}

function playbackEventMediaTimeRemaining(playbackEvent)
{
  if (m.settings.user.autoExitFsOnWarning && (playbackEvent.data.timeRemainingSeconds <= m.settings.user.timeRemainingSeconds))
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
    if (m.settings.user.autoResumePlayback && m.statePlaying)
    {
      if (galleryPlayer.getStatus().isPlaying === false)
        galleryPlayer.togglePlayPause();
    }

    /*
    if (settings.user.keepMobileScreenOn && m.statePlaying)
      screenWakeLock.stateVisible();
    */
    
    if (m.settings.user.keepMobileScreenOn)
      screenWakeLock.stateVisible();
  }
  else if (document.visibilityState === 'hidden')
  {
    if (m.settings.user.autoResumePlayback && galleryPlayer.getStatus().isPlaying)
      m.statePlaying = true;
    else
      m.statePlaying = false;

  //debug.log('documentEventVisibilityChange() - statePlaying: ' + m.statePlaying);
  }
}


// ************************************************************************************************
// Click event handlers
// ************************************************************************************************

function playbackDetailsClick(event)
{
  playbackEvents.scrollToId(galleryPlayer.getStatus().trackId);
  eventLog.add(eventLogger.SOURCE.MOUSE, eventLogger.EVENT.MOUSE_CLICK, null);

  if (event.target.tagName.toLowerCase() === 'img')
    showInteractionHint('showTrackImageHint', '<b>Tip:</b> Double click or tap on the Track Thumbnail for full screen');
  else
    showInteractionHint('showDetailsHint', '<b>Tip:</b> Double click or tap on Artist &amp; Title for full screen');

  if (eventLog.doubleClicked(eventLogger.SOURCE.MOUSE, eventLogger.EVENT.MOUSE_CLICK, config.doubleClickDelay))
    utils.fullscreenElement.enter(document.getElementById(galleryPlayer.getStatus().iframeId));
}

function showInteractionHint(hintKey, hintText, snackbarTimeout = 0)
{
  if (m.settings.priv.tips[hintKey])
  {
    showSnackbar(hintText, snackbarTimeout);
    m.settings.priv.tips[hintKey] = false;
  }
}

function prevNextNavTo(event, destUrl)
{
  event?.preventDefault();
  playbackEvents.navigateTo(destUrl, galleryPlayer.getStatus().isPlaying);
}


// ************************************************************************************************
// Footer player selection toggle: Gallery or List
// ************************************************************************************************

class PlayerToggle extends utils.ToggleElement
{
  constructor(elementId) { super(elementId); }

  toggle()
  {
    const isListPlayer = document.body.classList.contains('list-player');
    const destData     = this.getDestData(isListPlayer);
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

  update()
  {
    this.textContent = document.body.classList.contains('list-player') ? 'List' : 'Gallery';
  }
  
  getDestData(isListPlayer)
  {
    const urlParts          = window.location.href.split('/');
    const pageIndex         = urlParts.findIndex(part => (part.toLowerCase() === 'page'));
    const currentPage       = (pageIndex !== -1) ? parseInt(urlParts[pageIndex + 1]) : 1;
    const trackData         = isListPlayer ? listPlayer.getStatus()             : galleryPlayer.getStatus();
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
}


// ************************************************************************************************
// Footer autoplay and crossfade toggles
// ************************************************************************************************

class AutoplayToggle extends utils.ToggleElement
{
  constructor(elementId) { super(elementId); }

  toggle()
  {
    m.settings.user.autoplay = (m.settings.user.autoplay === true) ? false : true;
    showSnackbar(m.settings.user.autoplay ? 'Autoplay enabled (<b>Shift</b> + <b>A</b> to disable)' : 'Autoplay disabled (<b>Shift</b> + <b>A</b> to enable)', 5);
    this.update();
  }

  update()
  {
    this.textContent = m.settings.user.autoplay ? 'ON' : 'OFF';
    m.settings.user.autoplay ? utils.replaceClass(document.body, 'autoplay-off', 'autoplay-on') : utils.replaceClass(document.body, 'autoplay-on', 'autoplay-off');
    m.settings.user.autoplay ? elements.crossfadeToggle.classList.remove('disabled')            : elements.crossfadeToggle.classList.add('disabled');
  }
}

class CrossfadeToggle extends utils.ToggleElement
{
  constructor(elementId) { super(elementId); }

  toggle()
  {
    m.settings.user.autoCrossfade = (m.settings.user.autoCrossfade === true) ? false : true;
    showSnackbar(m.settings.user.autoCrossfade ? 'Auto Crossfade enabled (<b>x</b> to disable)' : 'Auto Crossfade disabled (<b>x</b> to enable)', 5);
    this.update();
  }

  update()
  {
    this.textContent = m.settings.user.autoCrossfade ? 'ON' : 'OFF';
  }
}
