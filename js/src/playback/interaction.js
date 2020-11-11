//
// Browser interaction and media playback handler
//
// https://ultrafunk.com
//


import * as debugLogger    from '../shared/debuglogger.js';
import * as eventLogger    from './eventlogger.js';
import * as playback       from './playback.js';
import * as playbackEvents from './playback-events.js';
import * as utils          from '../shared/utils.js';
import { showSnackbar }    from '../shared/snackbar.js';

import {
  playbackSettings,
  playbackUserSchema,
  playbackPrivSchema,
  validateSettings,
} from '../shared/settings.js';

import {
  KEY,
  readWriteSettingsProxy,
  parseEventData,
} from '../shared/storage.js';


/*************************************************************************************************/


const debug              = debugLogger.getInstance('playback-interaction');
const eventLog           = new eventLogger.Interaction(10);
let mSettings            = {};
let useKeyboardShortcuts = false;
let isPlaybackReady      = false;

const mConfig = {
  autoPlayToggleId:            'footer-autoplay-toggle',
  crossfadeToggleId:           'footer-crossfade-toggle',
  allowKeyboardShortcutsEvent: 'allowKeyboardShortcuts',
  denyKeyboardShortcutsEvent:  'denyKeyboardShortcuts',
  fullscreenTrackEvent:        new Event('fullscreenTrack'),
  doubleClickDelay:            500,
};

const mElements = {
  playbackControls: { details: null, thumbnail: null, statePlaying: false },
  fullscreenTarget: null,
  autoPlayToggle:   null,
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
    updateAutoPlayDOM(mSettings.user.autoPlay);
    updateCrossfadeDOM(mSettings.user.autoCrossfade);
  }
});

// Listen for triggered events to toggle keyboard capture = allow other input elements to use shortcut keys
document.addEventListener(mConfig.allowKeyboardShortcutsEvent, () => { if (mSettings.user.keyboardShortcuts) useKeyboardShortcuts = true;  });
document.addEventListener(mConfig.denyKeyboardShortcutsEvent,  () => { if (mSettings.user.keyboardShortcuts) useKeyboardShortcuts = false; });


// ************************************************************************************************
// Read settings and interaction init
// ************************************************************************************************

function readSettings()
{
  debug.log('readSettings()');
  mSettings = readWriteSettingsProxy(KEY.UF_PLAYBACK_SETTINGS, playbackSettings, true);
  validateSettings(mSettings.user, playbackUserSchema);
  validateSettings(mSettings.priv, playbackPrivSchema);
  debug.log(mSettings);
}

function initInteraction()
{
  debug.log('initInteraction()');

  useKeyboardShortcuts                 = mSettings.user.keyboardShortcuts;
  mElements.playbackControls.details   = document.getElementById('playback-controls').querySelector('.details-control');
  mElements.playbackControls.thumbnail = document.getElementById('playback-controls').querySelector('.thumbnail-control');
  mElements.autoPlayToggle             = document.getElementById(mConfig.autoPlayToggleId);
  mElements.crossfadeToggle            = document.getElementById(mConfig.crossfadeToggleId);

  window.addEventListener('blur',    windowEventBlur);
//window.addEventListener('focus',   windowEventFocus);
  window.addEventListener('storage', windowEventStorage);
  
  document.addEventListener('fullscreenchange',       documentEventFullscreenChange);
  document.addEventListener('webkitfullscreenchange', documentEventFullscreenChange);
  
  utils.addEventListeners('i.nav-bar-arrow-back', 'click', subPaginationClick, navigationVars.prevUrl); // eslint-disable-line no-undef
  utils.addEventListeners('i.nav-bar-arrow-fwd',  'click', subPaginationClick, navigationVars.nextUrl); // eslint-disable-line no-undef
}

function initPlayback()
{
  playback.init(mSettings);
  playbackEvents.addListener(playbackEvents.EVENT.READY,                playbackEventReady);
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
        autoPlayToggle(event);
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
  exitFullscreenTrack();

  if (event.shiftKey === true)
  {
    subPaginationClick(event, navigationVars.prevUrl); // eslint-disable-line no-undef
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
  exitFullscreenTrack();

  if (event.shiftKey === true)
  {
    subPaginationClick(event, navigationVars.nextUrl); // eslint-disable-line no-undef
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

function showInteractionHint(hintProperty, hintText, snackbarTimeout = 0)
{
  if (mSettings.priv[hintProperty])
  {
    showSnackbar(hintText, snackbarTimeout);
    mSettings.priv[hintProperty] = false;
  }
}


// ************************************************************************************************
// Experimental Screen Wake Lock API support: https://web.dev/wakelock/
// ************************************************************************************************

const screenWakeLock = (() =>
{
  let wakeLock = null;

  return {
    enable,
  //disable,
    stateVisible,
  };

  function isSupported()
  {
    return (('wakeLock' in navigator) && ('request' in navigator.wakeLock));
  }
 
  async function enable()
  {
    if (isSupported())
    {
      if (document.visibilityState === 'visible')
      {
        /*
        if (wakeLock !== null)
          wakeLock.release();
        */

        if (await request() !== true)
        {
          debug.log('screenWakeLock.enable(): Screen Wake Lock request failed');
        //showSnackbar('Keep Screen On failed', 3);
        }
      }
    }
    else
    {
      debug.log('screenWakeLock.enable(): Screen Wake Lock is not supported');
      showSnackbar('Keep Screen On is not supported', 5, 'Turn Off', () => mSettings.user.keepMobileScreenOn = false);
    }
  }

  /*
  function disable()
  {
    debug.log('screenWakeLock.disable()');

    if (wakeLock !== null)
      wakeLock.release();
  }
  */

  function stateVisible()
  {
    debug.log('screenWakeLock.stateVisible()');

    if (isSupported() && (wakeLock === null))
      request();
  }

  async function request()
  {
    try
    {
      wakeLock = await navigator.wakeLock.request('screen');

      debug.log('screenWakeLock.request(): Screen Wake Lock is Enabled');
    //showSnackbar('Keep Screen On success', 3);

      wakeLock.addEventListener('release', () =>
      {
        debug.log('screenWakeLock.request(): Screen Wake Lock was Released');
      //showSnackbar('Keep Screen On was released', 3);
        wakeLock = null;
      });

      return true;
    }
    catch (exception)
    {
      debug.error(`screenWakeLock.request(): ${exception.name} - ${exception.message}`);
    }

    return false;
  }
})();


// ************************************************************************************************
// playbackEvent listeners
// ************************************************************************************************

function playbackEventReady()
{
  mElements.playbackControls.details.addEventListener('click', playbackDetailsClick);
  mElements.playbackControls.thumbnail.addEventListener('click', playbackDetailsClick);
  mElements.autoPlayToggle.addEventListener('click', autoPlayToggle);
  mElements.crossfadeToggle.addEventListener('click', crossfadeToggle);
  document.addEventListener('visibilitychange', documentEventVisibilityChange);
  
  if (mSettings.user.keepMobileScreenOn)
    screenWakeLock.enable();

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
      if ((mSettings.user.autoPlay === false) && mSettings.user.blurFocusBgChange)
        document.body.classList.add('blurred');
      */
    }
  }, 0);
}

/*
function windowEventFocus()
{
  if ((mSettings.user.autoPlay === false) && mSettings.user.blurFocusBgChange)
    document.body.classList.remove('blurred');
}
*/

function windowEventStorage(event)
{
  if (mSettings.storageChangeSync)
  {
    const oldSettings = parseEventData(event, KEY.UF_PLAYBACK_SETTINGS);

    if (oldSettings !== null)
    {
      debug.log(`windowEventStorage(): ${event.key}`);
  
      // Stored settings have changed, read updated settings from storage
      readSettings();
  
      /*
      // Check what has changed (old settings vs. new settings) and update data / UI where needed
      if (settings.user.autoPlay !== oldSettings.user.autoPlay)
        updateAutoPlayData(settings.user.autoPlay);
      */
    }
  }
}

function documentEventFullscreenChange()
{
  mElements.fullscreenTarget = (document.fullscreenElement !== null) ? document.fullscreenElement.id : null;
  mConfig.fullscreenTrackEvent.fullscreenTarget = mElements.fullscreenTarget;
  document.dispatchEvent(mConfig.fullscreenTrackEvent);
}

function documentEventVisibilityChange()
{
//debug.log(`documentEventVisibilityChange() - visibilityState: ${document.visibilityState}`);

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

function subPaginationClick(event, destUrl)
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
  playbackEvents.scrollTo.id(playback.getStatus().postId);
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
// AutoPlay UI toggle and DOM update
// ************************************************************************************************

function autoPlayToggle(event)
{
  event.preventDefault();
  mSettings.user.autoPlay = (mSettings.user.autoPlay === true) ? false : true;
  showSnackbar(mSettings.user.autoPlay ? 'Autoplay enabled (<b>Shift</b> + <b>A</b> to disable)' : 'Autoplay disabled (<b>Shift</b> + <b>A</b> to enable)', 5);
  updateAutoPlayDOM(mSettings.user.autoPlay);
}

function updateAutoPlayDOM(autoPlay)
{
  debug.log(`updateAutoPlayDOM() - autoPlay: ${autoPlay}`);

  mElements.autoPlayToggle.querySelector('.autoplay-on-off').textContent = autoPlay ? 'ON' : 'OFF';
  autoPlay ? utils.replaceClass(document.body, 'autoplay-off', 'autoplay-on') : utils.replaceClass(document.body, 'autoplay-on', 'autoplay-off');
  autoPlay ? mElements.crossfadeToggle.classList.remove('disabled')           : mElements.crossfadeToggle.classList.add('disabled');

  /*
  if (autoPlay)
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
