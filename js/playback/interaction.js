//
// Browser interaction and media playback handler
//
// https://ultrafunk.com
//


import * as debugLogger          from '../common/debuglogger.js?ver=1.12.1';
import * as storage              from '../common/storage.js?ver=1.12.1';
import { playbackSettings }      from '../common/settings.js?ver=1.12.1';
import * as utils                from '../common/utils.js?ver=1.12.1';
import * as eventLogger          from './eventlogger.js?ver=1.12.1';
import * as playback             from './playback.js?ver=1.12.1';
import { updateProgressPercent } from './playback-controls.js?ver=1.12.1';


const debug              = debugLogger.getInstance('interaction');
const eventLog           = new eventLogger.Interaction(10);
let settings             = {};
let useKeyboardShortcuts = false;

// Shared config for all, submodules can have local const config = {...}
const moduleConfig = {
  youTubeIframeIdRegEx:        /youtube-uid/i,
  soundCloudIframeIdRegEx:     /soundcloud-uid/i,
  nowPlayingIconsSelector:     'h2.entry-title',
  autoPlayToggleId:            'footer-autoplay-toggle',
  crossfadeToggleId:           'footer-crossfade-toggle',
  keyboardShortcuts:           true,
  allowKeyboardShortcutsEvent: 'allowKeyboardShortcuts',
  denyKeyboardShortcutsEvent:  'denyKeyboardShortcuts',
  doubleClickDelay:            500,
};

// Shared DOM elements for all, submodules can have local const elements = {...}
const moduleElements = {
  playbackControls: { details: null, thumbnail: null, statePlaying: false },
  fullscreenTarget: null,
  nowPlayingIcons:  null,
  autoPlayToggle:   null,
  crossfadeToggle:  null,
};


// ************************************************************************************************
//  Document ready and init
// ************************************************************************************************

document.addEventListener('DOMContentLoaded', () =>
{ 
  debug.log('DOMContentLoaded');

  readSettings();

  if (hasEmbeddedPlayers())
  {
    initInteraction();
    
    playback.setConfig({
      youTubeIframeIdRegEx:    moduleConfig.youTubeIframeIdRegEx,
      soundCloudIframeIdRegEx: moduleConfig.soundCloudIframeIdRegEx,
    });

    playbackEvents.addListeners();
    playback.init(settings.user);

    updateAutoPlayDOM(settings.user.autoPlay);
    updateCrossfadeDOM(settings.user.autoCrossfade);
  }
});

// Listen for triggered events to toggle keyboard capture = allow other input elements to use shortcut keys
document.addEventListener(moduleConfig.allowKeyboardShortcutsEvent, () => { if (moduleConfig.keyboardShortcuts) useKeyboardShortcuts = true;  });
document.addEventListener(moduleConfig.denyKeyboardShortcutsEvent,  () => { if (moduleConfig.keyboardShortcuts) useKeyboardShortcuts = false; });


// ************************************************************************************************
// Interaction init and setup
// ************************************************************************************************

// Search page for <iframes> and check if any of them contains an embedded player
function hasEmbeddedPlayers()
{
  let playersFound = 0;

  document.querySelectorAll('iframe').forEach(element =>
  {
    if (moduleConfig.youTubeIframeIdRegEx.test(element.id) || moduleConfig.soundCloudIframeIdRegEx.test(element.id))
      playersFound++;
  });

  playbackEvents.setPlayersCount(playersFound);

  return (playersFound > 0);
}

function readSettings()
{
  debug.log('readSettings()');
  settings = storage.readWriteSettingsProxy(storage.KEY.UF_PLAYBACK_SETTINGS, playbackSettings);
  debug.log(settings);
}

function initInteraction()
{
  debug.log('initInteraction()');

  useKeyboardShortcuts                      = moduleConfig.keyboardShortcuts;
  moduleElements.playbackControls.details   = document.getElementById('playback-controls').querySelector('.details-control');
  moduleElements.playbackControls.thumbnail = document.getElementById('playback-controls').querySelector('.thumbnail-control');
  moduleElements.nowPlayingIcons            = document.querySelectorAll(moduleConfig.nowPlayingIconsSelector);
  moduleElements.autoPlayToggle             = document.getElementById(moduleConfig.autoPlayToggleId);
  moduleElements.crossfadeToggle            = document.getElementById(moduleConfig.crossfadeToggleId);

  window.addEventListener('blur',    windowEventBlur);
  window.addEventListener('focus',   windowEventFocus);
  window.addEventListener('storage', windowEventStorage);
  
  document.addEventListener('fullscreenchange',       documentEventFullscreenChange);
  document.addEventListener('webkitfullscreenchange', documentEventFullscreenChange);
  
  utils.addEventListeners('i.nav-bar-arrow-back', 'click', subPaginationClick, navigationVars.prevUrl); // eslint-disable-line no-undef
  utils.addEventListeners('i.nav-bar-arrow-fwd',  'click', subPaginationClick, navigationVars.nextUrl); // eslint-disable-line no-undef
}


// ************************************************************************************************
// Playback event handler module
// ************************************************************************************************

const playbackEvents = (() =>
{
  let playersCount      = 3;
  let playersReadyCount = 1;
  let isPlaybackReady   = false;

  return {
    setPlayersCount(numPlayers) { playersCount += numPlayers; },
    isPlaybackReady()           { return isPlaybackReady;     },
    addListeners,
  };

  function addListeners()
  {
    playback.setEventHandlers({
      [playback.EVENT.LOADING]:              loading,
      [playback.EVENT.READY]:                ready,
      [playback.EVENT.MEDIA_PLAYING]:        mediaPlaying,
      [playback.EVENT.MEDIA_PAUSED]:         mediaPaused,
      [playback.EVENT.MEDIA_ENDED]:          mediaEnded,
      [playback.EVENT.MEDIA_TIME_REMAINING]: mediaTimeRemaining,
      [playback.EVENT.MEDIA_SHOW]:           mediaShow,
      [playback.EVENT.CONTINUE_AUTOPLAY]:    continueAutoplay,
      [playback.EVENT.RESUME_AUTOPLAY]:      resumeAutoplay,
      [playback.EVENT.AUTOPLAY_BLOCKED]:     autoplayBlocked,
      [playback.EVENT.PLAYBACK_BLOCKED]:     playbackBlocked,
      [playback.EVENT.MEDIA_UNAVAILABLE]:    mediaUnavailable,
    });
  }

  function loading(/* playbackEvent */)
  {
  //debugEvent(playbackEvent);

    updateProgressPercent((playersReadyCount++ / playersCount) * 100);
  }
  
  function ready(playbackEvent)
  {
    debugEvent(playbackEvent);

    isPlaybackReady = true;
    updateProgressPercent(0);
    moduleElements.playbackControls.details.addEventListener('click', playbackDetailsClick);
    moduleElements.playbackControls.thumbnail.addEventListener('click', playbackDetailsClick);
    moduleElements.autoPlayToggle.addEventListener('click', autoPlayToggle);
    moduleElements.crossfadeToggle.addEventListener('click', crossfadeToggle);
    document.addEventListener('visibilitychange', documentEventVisibilityChange);

    if (settings.user.keepMobileScreenOn)
      screenWakeLock.enable();
  }
  
  function mediaPlaying(playbackEvent, eventData)
  {
    debugEvent(playbackEvent, eventData);
  
    const nowPlayingIcon = document.querySelector(`#${eventData.postId} ${moduleConfig.nowPlayingIconsSelector}`);
  
    resetNowPlayingIcons(nowPlayingIcon);
    utils.replaceClass(nowPlayingIcon, 'playing-paused', 'now-playing-icon');

    if (settings.user.animateNowPlayingIcon)
      nowPlayingIcon.classList.add('playing-animate');

    /*
    if (settings.user.keepMobileScreenOn)
      screenWakeLock.enable();
    */
  }
  
  function mediaPaused(playbackEvent, eventData)
  {
    debugEvent(playbackEvent, eventData);
  
    document.querySelector(`#${eventData.postId} ${moduleConfig.nowPlayingIconsSelector}`).classList.add('playing-paused');

    /*
    if (settings.user.keepMobileScreenOn)
      screenWakeLock.disable();
    */
  }

  function mediaEnded(playbackEvent)
  {
    debugEvent(playbackEvent);
  
    if (settings.user.autoExitFullscreen)
      exitFullscreenTrack();
  
    updateProgressPercent(0);
    resetNowPlayingIcons();
  }
  
  function mediaTimeRemaining(playbackEvent, eventData)
  {
  //debugEvent(playbackEvent, eventData);
  
    if (settings.user.autoExitFsOnWarning && (eventData.timeRemainingSeconds <= settings.user.timeRemainingSeconds))
      exitFullscreenTrack();
  }
  
  function mediaShow(playbackEvent, eventData)
  {
    debugEvent(playbackEvent, eventData);
  
    mediaEnded();

    if (eventData.scrollToMedia)
      scrollTo.id(eventData.postId);
  }
  
  function continueAutoplay(playbackEvent)
  {
    debugEvent(playbackEvent);
  
    navigateTo(navigationVars.nextUrl, true); // eslint-disable-line no-undef
  }
  
  function resumeAutoplay(playbackEvent)
  {
    debugEvent(playbackEvent);
    debug.log(`playbackEvents.RESUME_AUTOPLAY: ${settings.priv.continueAutoPlay}`);
  
    if (settings.priv.continueAutoPlay)
    {
      settings.priv.continueAutoPlay = false;
      playback.resumeAutoPlay();
    }
  }
  
  function autoplayBlocked(playbackEvent)
  {
    debugEvent(playbackEvent);
  
    utils.snackbar.show('Autoplay was blocked, click or tap Play to continue...', 30, 'play', () =>
    {
      if (playback.getStatus().isPlaying === false)
        playback.togglePlayPause();
    });
  }
  
  function playbackBlocked(playbackEvent, eventData)
  {
    debugEvent(playbackEvent, eventData);
  
    utils.snackbar.show('Unable to play track, skipping to next...', 5);
    playbackEventErrorTryNext(eventData, 5);
  }
  
  function mediaUnavailable(playbackEvent, eventData)
  {
    debugEvent(playbackEvent, eventData);
  
    if (isPremiumTrack(eventData.postId))
    {
      utils.snackbar.show('YouTube Premium track, skipping...', 5, 'help',  () => { window.location.href = '/channel/premium/'; });
      playbackEventErrorTryNext(eventData, 5);
    }
    else
    {
      utils.snackbar.show('Unable to play track, skipping to next...', 5);
      debugLogger.logErrorOnServer('EVENT_MEDIA_UNAVAILABLE', eventData);
      playbackEventErrorTryNext(eventData, 5);
    }
  }


  // ************************************************************************************************
  // Misc. playback event handler functions
  // ************************************************************************************************
  
  function debugEvent(playbackEvent = null, eventData = null)
  {
    if (debug.isDebug() && (playbackEvent !== null))
    {
      debug.log(`playbackEvents.${debug.getObjectKeyForValue(playback.EVENT, playbackEvent)} (${playbackEvent})`);
    
      if (eventData !== null)
        debug.log(eventData);
    }
  }

  function resetNowPlayingIcons(nowPlayingElement)
  {
    moduleElements.nowPlayingIcons.forEach(element =>
    {
      if (element !== nowPlayingElement)
        element.classList.remove('now-playing-icon', 'playing-animate', 'playing-paused');
    });
  }
  
  function playbackEventErrorTryNext(eventData, timeout = 5)
  {
    setTimeout(() =>
    {
      if (eventData.currentTrack < eventData.numTracks)
      {
        // Only supports skipping FORWARD for now...
        playback.skipToTrack(eventData.currentTrack + 1, true);
      }
      else
      {
        if (navigationVars.nextUrl !== null)        // eslint-disable-line no-undef
          navigateTo(navigationVars.nextUrl, true); // eslint-disable-line no-undef
      }
    }, ((timeout * 1000) + 250));
  }
  
  function isPremiumTrack(postId)
  {
    const postWithId = document.getElementById(postId);
  
    if (postWithId !== null)
      return postWithId.classList.contains('category-premium');
    
    return false;
  }
})();


// ************************************************************************************************
//  Experimental Screen Wake Lock API support: https://web.dev/wakelock/
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
        //utils.snackbar.show('Keep Screen On failed', 3);
        }
      }
    }
    else
    {
      debug.log('screenWakeLock.enable(): Screen Wake Lock is not supported');
      utils.snackbar.show('Keep Screen On is not supported', 5, 'Turn Off', () => settings.user.keepMobileScreenOn = false);
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
    //utils.snackbar.show('Keep Screen On success', 3);

      wakeLock.addEventListener('release', () =>
      {
        debug.log('screenWakeLock.request(): Screen Wake Lock was Released');
      //utils.snackbar.show('Keep Screen On was released', 3);
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
//  Window and document event handlers
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
      if ((settings.user.autoPlay === false) && settings.user.blurFocusBgChange)
        document.body.classList.add('blurred');
    }
  }, 0);
}

function windowEventFocus()
{
  if ((settings.user.autoPlay === false) && settings.user.blurFocusBgChange)
    document.body.classList.remove('blurred');
}

function windowEventStorage(event)
{
  if (settings.storageChangeSync)
  {
    const oldSettings = storage.parseEventData(event, storage.KEY.UF_PLAYBACK_SETTINGS);

    if (oldSettings !== null)
    {
      debug.log(`windowEventStorage(): ${event.key}`);
  
      // Stored settings have changed, read updated settings from storage
      readSettings();
  
      /*
      // Check what has changed (old settings vs. new settings) and update data / UI where needed
      if (settings.user.autoPlay !== oldSettings.user.autoPlay)
        updateAutoPlayData(settings.user.autoPlay);
  
      // ToDo: This probably needs to update UI as well...
      if (settings.user.masterVolume !== oldSettings.user.masterVolume)
      {
        // Do stuff...
      }
  
      // ToDo: This probably needs to update UI as well...
      if (settings.user.masterMute !== oldSettings.user.masterMute)
      {
        // Do stuff...
      }
      */
    }
  }
}

function documentEventFullscreenChange()
{
  moduleElements.fullscreenTarget = (document.fullscreenElement !== null) ? document.fullscreenElement.id : null;
}

function documentEventVisibilityChange()
{
//debug.log(`documentEventVisibilityChange() - visibilityState: ${document.visibilityState}`);

  if (document.visibilityState === 'visible')
  {
    if (settings.user.autoResumePlayback && moduleElements.playbackControls.statePlaying)
    {
      if (playback.getStatus().isPlaying === false)
        playback.togglePlayPause();
    }

    /*
    if (settings.user.keepMobileScreenOn && moduleElements.playbackControls.statePlaying)
      screenWakeLock.stateVisible();
    */
    
    if (settings.user.keepMobileScreenOn)
      screenWakeLock.stateVisible();
  }
  else if (document.visibilityState === 'hidden')
  {
    if (settings.user.autoResumePlayback && playback.getStatus().isPlaying)
      moduleElements.playbackControls.statePlaying = true;
    else
      moduleElements.playbackControls.statePlaying = false;

  //debug.log('documentEventVisibilityChange() - statePlaying: ' + moduleElements.playbackControls.statePlaying);
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

  if (eventLog.doubleClicked(eventLogger.SOURCE.MOUSE, eventLogger.EVENT.MOUSE_CLICK, moduleConfig.doubleClickDelay))
    enterFullscreenTrack();
}

function subPaginationClick(event, destUrl)
{
  if ((event !== null) && (destUrl !== null))
  {
    event.preventDefault();
    navigateTo(destUrl, playback.getStatus().isPlaying);
  }
}

function showCurrentTrack(event)
{
  event.preventDefault();
  scrollTo.id(playback.getStatus().postId);
}

function enterFullscreenTrack()
{
  const element = document.getElementById(playback.getStatus().iframeId);
  element.requestFullscreen();
}

function exitFullscreenTrack()
{
  if (moduleElements.fullscreenTarget !== null)
  {
    document.exitFullscreen();
    moduleElements.fullscreenTarget = null;
  }
}


// ************************************************************************************************
// Keyboard events handler and functions
// ************************************************************************************************

document.addEventListener('keydown', (event) =>
{
  if (playbackEvents.isPlaybackReady() && useKeyboardShortcuts && (event.ctrlKey === false) && (event.altKey === false))
  {
    switch (event.key)
    {
      case ' ':
        event.preventDefault();
        playback.togglePlayPause();
        break;

      case 'f':
      case 'F':
        fullscreenToggle(event);
        break;

      case 'm':
      case 'M':
        event.preventDefault();
        playback.toggleMute();
        utils.snackbar.show(settings.user.masterMute ? 'Volume is muted (<b>m</b> to unmute)' : 'Volume is unmuted (<b>m</b> to mute)', 3);
        break;

      case 'x':
      case 'X':
        if (moduleElements.crossfadeToggle.classList.contains('disabled') === false)
        {
          crossfadeToggle(event);
        }
        break;

      case 'ArrowLeft':
        arrowLeftKey(event);
        break;

      case 'ArrowRight':
        arrowRightKey(event);
        break;

      case 'F12':
        if (event.shiftKey === true)
        {
          autoPlayToggle(event);
        }
        break;
        
      default:
        {
          // Handle compatibility with MS Edge
          const key = event.code || event.keyCode;

          if ((key === 'Backquote') || (key === 220))
            showCurrentTrack(event);
        }
    }
  }
});

function fullscreenToggle(event)
{
  event.preventDefault();

  if (moduleElements.fullscreenTarget === null)
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

      if (eventLog.doubleClicked(eventLogger.SOURCE.KEYBOARD, eventLogger.EVENT.KEY_ARROW_LEFT, moduleConfig.doubleClickDelay))
      {
        navigateTo(prevUrl, false);
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

      if (eventLog.doubleClicked(eventLogger.SOURCE.KEYBOARD, eventLogger.EVENT.KEY_ARROW_RIGHT, moduleConfig.doubleClickDelay))
      {
        navigateTo(nextUrl, playbackStatus.isPlaying);
        return true;
      }
    }
  }
  
  return false;
}

function showInteractionHint(hintProperty, hintText, snackbarTimeout = 0)
{
  if (settings.priv[hintProperty])
  {
    utils.snackbar.show(hintText, snackbarTimeout);
    settings.priv[hintProperty] = false;
  }
}

function navigateTo(destUrl, continueAutoPlay = false)
{
  debug.log(`navigateTo(): ${destUrl} - continueAutoPlay: ${continueAutoPlay}`);
  
  if ((destUrl !== null) && (destUrl.length > 0))
  {
    if (continueAutoPlay)
      settings.priv.continueAutoPlay = true;
    
    window.location.href = destUrl;
  }
}


// ************************************************************************************************
// AutoPlay UI toggle and DOM update
// ************************************************************************************************

function autoPlayToggle(event)
{
  event.preventDefault();
  settings.user.autoPlay = (settings.user.autoPlay === true) ? false : true;
  utils.snackbar.show(settings.user.autoPlay ? 'Autoplay enabled (<b>Shift</b> + <b>F12</b> to disable)' : 'Autoplay disabled (<b>Shift</b> + <b>F12</b> to enable)', 5);
  updateAutoPlayDOM(settings.user.autoPlay);
}

function updateAutoPlayDOM(autoPlay)
{
  debug.log(`updateAutoPlayDOM() - autoPlay: ${autoPlay}`);

  moduleElements.autoPlayToggle.querySelector('.autoplay-on-off').textContent = autoPlay ? 'ON' : 'OFF';
  autoPlay ? utils.replaceClass(document.body, 'autoplay-off', 'autoplay-on') : utils.replaceClass(document.body, 'autoplay-on', 'autoplay-off');
  autoPlay ? moduleElements.crossfadeToggle.classList.remove('disabled')      : moduleElements.crossfadeToggle.classList.add('disabled');

  if (autoPlay)
  {
    document.body.classList.remove('blurred');
  }
  else
  {
    if ((document.hasFocus() === false) && settings.user.blurFocusBgChange)
      document.body.classList.add('blurred');
  }
}


// ************************************************************************************************
// Crossfade UI toggle and DOM update
// ************************************************************************************************

function crossfadeToggle(event)
{
  event.preventDefault();
  settings.user.autoCrossfade = (settings.user.autoCrossfade === true) ? false : true;
  utils.snackbar.show(settings.user.autoCrossfade ? 'Auto Crossfade enabled (<b>x</b> to disable)' : 'Auto Crossfade disabled (<b>x</b> to enable)', 5);
  updateCrossfadeDOM(settings.user.autoCrossfade);
}

function updateCrossfadeDOM(autoCrossfade)
{
  debug.log(`updateCrossfadeDOM() - autoCrossfade: ${autoCrossfade}`);
  moduleElements.crossfadeToggle.querySelector('.crossfade-on-off').textContent = autoCrossfade ? 'ON' : 'OFF';
}


// ************************************************************************************************
// Scrolling to specified # (track)
// ************************************************************************************************

const scrollTo = (() =>
{
  // Get CSS variables (px heigth) for multistate sticky top nav menu
  const siteHeaderDownPx       = utils.getCssPropValue('--site-header-down');
  const siteHeaderDownMobilePx = utils.getCssPropValue('--site-header-down-mobile');
  const siteHeaderUpPx         = utils.getCssPropValue('--site-header-up');
  const siteHeaderUpMobilePx   = utils.getCssPropValue('--site-header-up-mobile');

  return {
    id,
  };

  function id(postId)
  {
    if (settings.user.autoScroll)
    {
      // Actual functional 'offsetTop' calculation: https://stackoverflow.com/a/52477551
      const offsetTop    = Math.round(window.scrollY + document.getElementById(postId).getBoundingClientRect().top);
      const scrollTop    = Math.round(window.pageYOffset); // Don't want float results that can cause jitter
      let   headerHeight = getScrollHeaderHeight(offsetTop > scrollTop);

      // If we get obscured by the sticky header menu, recalculate headerHeight to account for that
      if ((scrollTop + headerHeight + getMarginTop()) > offsetTop)
        headerHeight = getScrollHeaderHeight(false);

      // ToDo: This will not be smooth on iOS... Needs polyfill
      window.scroll(
      {
        top:      (offsetTop - (headerHeight + getMarginTop())),
        left:     0,
        behavior: (settings.user.smoothScrolling ? 'smooth' : 'auto'),
      });
    }
  }

  function getScrollHeaderHeight(directionDown)
  {
    const matchesMaxWidthMobile = utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE);
    
    if (directionDown)
      return ((matchesMaxWidthMobile === true) ? siteHeaderDownMobilePx : siteHeaderDownPx);
    else
      return ((matchesMaxWidthMobile === true) ? siteHeaderUpMobilePx : siteHeaderUpPx);
  }

  function getMarginTop()
  {
    // -1 because of fractional pixels on HiDPI displays (iframe bottom 1 px would show on top)
    return (utils.getCssPropValue('--site-content-margin-top') - 1);
  }
})();
