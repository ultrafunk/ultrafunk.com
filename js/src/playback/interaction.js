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
import { showSnackbar }     from '../shared/snackbar.js';
import { playbackSettings } from '../shared/settings.js';

import {
  KEY,
  readWriteSettingsProxy,
} from '../shared/storage.js';


/*************************************************************************************************/


const debug              = debugLogger.newInstance('playback-interaction');
const eventLog           = new eventLogger.Interaction(10);
let mSettings            = {};
let useKeyboardShortcuts = false;
let isPlaybackReady      = false;

const mConfig = {
  autoplayToggleId:            'footer-autoplay-toggle',
  crossfadeToggleId:           'footer-crossfade-toggle',
  allowKeyboardShortcutsEvent: 'allowKeyboardShortcuts',
  denyKeyboardShortcutsEvent:  'denyKeyboardShortcuts',
  fullscreenTrackEvent:        new Event('fullscreenTrack'),
  doubleClickDelay:            500,
};

const mElements = {
  playbackControls: { details: null, thumbnail: null, timer: null, statePlaying: false },
  fullscreenTarget: null,
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
});

document.addEventListener('fullscreenchange',       documentEventFullscreenChange);
document.addEventListener('webkitfullscreenchange', documentEventFullscreenChange);

// Listen for triggered events to toggle keyboard capture = allow other input elements to use shortcut keys
document.addEventListener(mConfig.allowKeyboardShortcutsEvent, () => { if (mSettings.user.keyboardShortcuts) useKeyboardShortcuts = true;  });
document.addEventListener(mConfig.denyKeyboardShortcutsEvent,  () => { if (mSettings.user.keyboardShortcuts) useKeyboardShortcuts = false; });

window.addEventListener('blur',    windowEventBlur);
//window.addEventListener('storage', windowEventStorage);
//window.addEventListener('focus',   windowEventFocus);
 

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

  useKeyboardShortcuts                 = mSettings.user.keyboardShortcuts;
  mElements.playbackControls.details   = document.getElementById('playback-controls').querySelector('.details-control');
  mElements.playbackControls.thumbnail = document.getElementById('playback-controls').querySelector('.thumbnail-control');
  mElements.playbackControls.timer     = document.getElementById('playback-controls').querySelector('.timer-control');
  mElements.autoplayToggle             = document.getElementById(mConfig.autoplayToggleId);
  mElements.crossfadeToggle            = document.getElementById(mConfig.crossfadeToggleId);

  /* eslint-disable */
  utils.addEventListeners('i.nav-bar-arrow-back',                'click', paginationNavClick, navigationVars.prevUrl);
  utils.addEventListeners('i.nav-bar-arrow-fwd',                 'click', paginationNavClick, navigationVars.nextUrl);
  utils.addEventListeners('nav.post-navigation .nav-previous a', 'click', paginationNavClick, navigationVars.prevUrl);
  utils.addEventListeners('nav.post-navigation .nav-next a',     'click', paginationNavClick, navigationVars.nextUrl);
  /* eslint-enable */
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

document.addEventListener('keydown', (event) =>
{
  if (isPlaybackReady && useKeyboardShortcuts && (event.ctrlKey === false) && (event.altKey === false))
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
        arrowLeftKey(event);
        break;

      case 'ArrowRight':
        arrowRightKey(event);
        break;

      case 'A':
        autoplayToggle(event);
        break;

      case 'f':
      case 'F':
        fullscreenTrackToggle(event);
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
});

function fullscreenTrackToggle(event)
{
  event.preventDefault();

  if (mElements.fullscreenTarget === null)
    enterFullscreenTrack();
  else
    exitFullscreenTrack();
}

function arrowLeftKey(event)
{
  event.preventDefault();

  if (event.shiftKey === true)
  {
    paginationNavClick(event, navigationVars.prevUrl); // eslint-disable-line no-undef
  }
  else
  {
    eventLog.add(eventLogger.SOURCE.KEYBOARD, eventLogger.EVENT.KEY_ARROW_LEFT, null);

    if (!doubleTapNavPrev(navigationVars.prevUrl, playback.getStatus())) // eslint-disable-line no-undef
      playback.prevClick(event);
  }
}

function doubleTapNavPrev(prevUrl, playbackStatus)
{
  if (prevUrl !== null)
  {
    if ((playbackStatus.currentTrack === 1) && (playbackStatus.isPlaying === false))
    {
      showInteractionHint('showLeftArrowHint', '<b>Tip:</b> Double click the Left Arrow key to go to the previous page');

      if (eventLog.doubleClicked(eventLogger.SOURCE.KEYBOARD, eventLogger.EVENT.KEY_ARROW_LEFT, mConfig.doubleClickDelay))
      {
        playbackEvents.navigateTo(prevUrl, false);
        return true;
      }
    }
  }
  
  return false;
}

function arrowRightKey(event)
{
  event.preventDefault();

  if (event.shiftKey === true)
  {
    paginationNavClick(event, navigationVars.nextUrl); // eslint-disable-line no-undef
  }
  else
  {
    eventLog.add(eventLogger.SOURCE.KEYBOARD, eventLogger.EVENT.KEY_ARROW_RIGHT, null);

    if (!doubleTapNavNext(navigationVars.nextUrl, playback.getStatus())) // eslint-disable-line no-undef
      playback.nextClick(event);
  }
}

function doubleTapNavNext(nextUrl, playbackStatus)
{
  if (nextUrl !== null)
  {
    if (playbackStatus.currentTrack === playbackStatus.numTracks) // && (playbackStatus.isPlaying === false))
    {
      showInteractionHint('showRightArrowHint', '<b>Tip:</b> Double click the Right Arrow key to go to the next page');

      if (eventLog.doubleClicked(eventLogger.SOURCE.KEYBOARD, eventLogger.EVENT.KEY_ARROW_RIGHT, mConfig.doubleClickDelay))
      {
        playbackEvents.navigateTo(nextUrl, playbackStatus.isPlaying);
        return true;
      }
    }
  }
  
  return false;
}

function showInteractionHint(hintKey, hintText, snackbarTimeout = 0)
{
  if (mSettings.priv.tips[hintKey])
  {
    showSnackbar(hintText, snackbarTimeout);
    mSettings.priv.tips[hintKey] = false;
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
    exitFullscreenTrack();
}

function playbackEventMediaTimeRemaining(playbackEvent)
{
  if (mSettings.user.autoExitFsOnWarning && (playbackEvent.data.timeRemainingSeconds <= mSettings.user.timeRemainingSeconds))
    exitFullscreenTrack();
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
    else // normal window blur (lost focus)
    {
      /*
      if ((mSettings.user.autoplay === false) && mSettings.user.blurFocusBgChange)
        document.body.classList.add('blurred');
      */
    }
  }, 0);
}

/*
function windowEventFocus()
{
  if ((mSettings.user.autoplay === false) && mSettings.user.blurFocusBgChange)
    document.body.classList.remove('blurred');
}
*/

/*
function windowEventStorage(event)
{
  if (mSettings.priv.storageChangeSync)
  {
    const oldSettings = parseEventData(event, KEY.UF_PLAYBACK_SETTINGS);

    if (oldSettings !== null)
    {
      debug.log(`windowEventStorage(): ${event.key}`);
  
      // Stored settings have changed, read updated settings from storage
      readSettings();
  
      // Check what has changed (old settings vs. new settings) and update data / UI where needed
      if (settings.user.autoplay !== oldSettings.user.autoplay)
        updateAutoplayData(settings.user.autoplay);
    }
  }
}
*/

function documentEventFullscreenChange()
{
  mElements.fullscreenTarget = (document.fullscreenElement !== null) ? document.fullscreenElement.id : null;
  mConfig.fullscreenTrackEvent.fullscreenTarget = mElements.fullscreenTarget;
  document.dispatchEvent(mConfig.fullscreenTrackEvent);
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
    showInteractionHint('showTrackImageHint', '<b>Tip:</b> Double click or double tap on the Track Thumbnail for full screen');
  else
    showInteractionHint('showDetailsHint', '<b>Tip:</b> Double click or double tap on Artist &amp; Title for full screen');

  if (eventLog.doubleClicked(eventLogger.SOURCE.MOUSE, eventLogger.EVENT.MOUSE_CLICK, mConfig.doubleClickDelay))
    enterFullscreenTrack();
}

function paginationNavClick(event, destUrl)
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

function enterFullscreenTrack()
{
  const element = document.getElementById(playback.getStatus().iframeId);
  element.requestFullscreen();
}

function exitFullscreenTrack()
{
  if (mElements.fullscreenTarget !== null)
  {
    document.exitFullscreen();
    mElements.fullscreenTarget = null;
  }
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

  /*
  if (autoplay)
  {
    document.body.classList.remove('blurred');
  }
  else
  {
    if ((document.hasFocus() === false) && mSettings.user.blurFocusBgChange)
      document.body.classList.add('blurred');
  }
  */
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
