//
// Browser interaction and media playback handler
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=1.8.2';
import * as storage     from '../common/storage.js?ver=1.8.2';
import * as utils       from '../common/utils.js?ver=1.8.2';
import * as eventLogger from './eventlogger.js?ver=1.8.2';
import * as playback    from './playback.js?ver=1.8.2';
import {
  updateProgressPercent,
  updateAutoPlayState
} from './playback-controls.js?ver=1.8.2';


const debug              = debugLogger.getInstance('interaction');
const eventLog           = new eventLogger.Interaction(10);
let settings             = {};
let useKeyboardShortcuts = false;

// Shared config for all, submodules can have local const config = {...}
const moduleConfig = {
  youTubeIframeIdRegEx:    /youtube-uid/i,
  soundCloudIframeIdRegEx: /soundcloud-uid/i,
  nowPlayingIconsSelector: 'h2.entry-title',
  autoPlayToggleId:        'footer-autoplay-toggle',
  footerCrossfadeToggleId: 'footer-crossfade-toggle',
  keyboardShortcuts:       true,
  allowKeyboardShortcuts:  'allowKeyboardShortcuts',
  denyKeyboardShortcuts:   'denyKeyboardShortcuts',
  doubleClickDelay:        500,
};

const defaultSettings = {
  // Incremental version to check for new properties
  version:           12,
  storageChangeSync: false,
  // User (public) settings
  user: {
  // Audio settings
    autoPlay:              true,
    masterVolume:          100,
    masterMute:            false,
    autoCrossfade:         false,
    autoCrossfadeLength:   16,    // 16 === 15 seconds fade time, +1 to compensate for buffering latency
    autoCrossfadeCurve:    0,     // 0 = Equal Power (default), 1 = Linear
    trackCrossfade:        true,
    trackCrossfadeLength:  11,    // 11 === 10 seconds fade time, +1 to compensate for buffering latency
    trackCrossfadeCurve:   0,     // 0 = Equal Power (default), 1 = Linear
  // UI settings
    autoScroll:            true,
    smoothScrolling:       true,
    autoExitFullscreen:    true,  // Automatically exit fullscreen when a track ends
    animateNowPlayingIcon: true,  // Current track indicator icon CSS pulse animation ON / OFF
    blurFocusBgChange:     false, // Set different background color when focus is lost (blurred)
    timeRemainingWarning:  true,  // Flash Play / Pause button...
    timeRemainingSeconds:  45,    // ...seconds left when warning is shown
    autoExitFsOnWarning:   true,  // Automatically exit fullscreen early when timeRemainingWarning is enabled 
  },
  // Priv (private / internal) settings
  priv: {
    continueAutoPlay:   false,
    showLeftArrowHint:  true,
    showRightArrowHint: true,
    showDetailsHint:    true,
  },
};

// Shared DOM elements for all, submodules can have local const elements = {...}
const moduleElements = {
  playbackControls:       { details: null, thumbnail: null },
  fullscreenChangeTarget: null,
  nowPlayingIcons:        null,
  footerAutoPlayToggle:   null,
  footerCrossfadeToggle:  null,
};


// ************************************************************************************************
//  Document ready and init
// ************************************************************************************************

document.addEventListener('DOMContentLoaded', () =>
{ 
  debug.log('DOMContentLoaded');

  if (hasEmbeddedPlayers())
  {
    readSettings();
    initInteraction();
    
    playback.setConfig({
      youTubeIframeIdRegEx:    moduleConfig.youTubeIframeIdRegEx,
      soundCloudIframeIdRegEx: moduleConfig.soundCloudIframeIdRegEx,
    });

    playback.setSettings({
      autoPlay:             settings.user.autoPlay,
      masterVolume:         settings.user.masterVolume,
      masterMute:           settings.user.masterMute,
      autoCrossfade:        settings.user.autoCrossfade,
      autoCrossfadeLength:  settings.user.autoCrossfadeLength,
      trackCrossfade:       settings.user.trackCrossfade,
      trackCrossfadeLength: settings.user.trackCrossfadeLength,
      timeRemainingWarning: settings.user.timeRemainingWarning,
      timeRemainingSeconds: settings.user.timeRemainingSeconds,
    });

    playbackEvents.addListeners();
    playback.init();

    updateAutoPlayDOM(settings.user.autoPlay);
    updateCrossfadeDOM(settings.user.autoCrossfade);
  }
});

// Listen for triggered events to toggle keyboard capture = allow other input elements to use shortcut keys
document.addEventListener(moduleConfig.allowKeyboardShortcuts, () => { if (moduleConfig.keyboardShortcuts) useKeyboardShortcuts = true;  });
document.addEventListener(moduleConfig.denyKeyboardShortcuts,  () => { if (moduleConfig.keyboardShortcuts) useKeyboardShortcuts = false; });


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
  settings = storage.readWriteJsonProxy(storage.KEY.UF_PLAYBACK_SETTINGS, defaultSettings);
  debug.log(settings);
}

function initInteraction()
{
  debug.log('initInteraction()');

  useKeyboardShortcuts                      = moduleConfig.keyboardShortcuts;
  moduleElements.playbackControls.details   = document.getElementById('playback-controls').querySelector('.details-control');
  moduleElements.playbackControls.thumbnail = document.getElementById('playback-controls').querySelector('.thumbnail-control');
  moduleElements.nowPlayingIcons            = document.querySelectorAll(moduleConfig.nowPlayingIconsSelector);
  moduleElements.footerAutoPlayToggle       = document.getElementById(moduleConfig.autoPlayToggleId);
  moduleElements.footerCrossfadeToggle      = document.getElementById(moduleConfig.footerCrossfadeToggleId);

  window.addEventListener('blur',    windowEventBlur);
  window.addEventListener('focus',   windowEventFocus);
  window.addEventListener('storage', windowEventStorage);
  
  document.addEventListener('fullscreenchange',       documentEventFullscreenChange);
  document.addEventListener('webkitfullscreenchange', documentEventFullscreenChange);
  
  utils.addEventListeners('i.sub-pagination-prev', 'click', subPaginationClick, navigationVars.prevUrl); // eslint-disable-line no-undef
  utils.addEventListeners('i.sub-pagination-next', 'click', subPaginationClick, navigationVars.nextUrl); // eslint-disable-line no-undef
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
      [playback.EVENT.MEDIA_MUTED]:          mediaMuted,
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
    moduleElements.footerAutoPlayToggle.addEventListener('click', autoPlayToggle);
    moduleElements.footerCrossfadeToggle.addEventListener('click', crossfadeToggle);
  }
  
  function mediaPlaying(playbackEvent, eventData)
  {
    debugEvent(playbackEvent, eventData);
  
    const nowPlayingIcon = document.querySelector(`#${eventData.postId} ${moduleConfig.nowPlayingIconsSelector}`);
  
    resetNowPlayingIcons(nowPlayingIcon);
    utils.replaceClass(nowPlayingIcon, 'playing-paused', 'now-playing-icon');

    if (settings.user.animateNowPlayingIcon)
      nowPlayingIcon.classList.add('playing-animate');
  }
  
  function mediaPaused(playbackEvent, eventData)
  {
    debugEvent(playbackEvent, eventData);
  
    document.querySelector(`#${eventData.postId} ${moduleConfig.nowPlayingIconsSelector}`).classList.add('playing-paused');
  }

  function mediaMuted(playbackEvent, eventData)
  {
    debugEvent(playbackEvent, eventData);

    settings.user.masterMute = eventData.masterMute;
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
      scrollTo.id(eventData.postId, eventData.iframeId);
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
      utils.snackbar.show('YouTube Premium track, skipping...', 10, 'help',  () => { window.location.href = '/channel/premium/'; });
      playbackEventErrorTryNext(eventData, 5);
    }
    else
    {
      utils.snackbar.show('Unable to play track, skipping to next...', 5);
      logClientErrorOnServer('EVENT_MEDIA_UNAVAILABLE', eventData);
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
  
  function logClientErrorOnServer(eventCategory, eventData)
  {
    const eventAction = eventData.mediaUrl + ' | ' + eventData.mediaTitle;
    
    debug.log(`logClientErrorOnServer(): ${eventCategory} - ${eventAction}`);
    
    gtag('event', eventAction, // eslint-disable-line no-undef
    {
      event_category: eventCategory,
      event_label:    'Ultrafunk Client Error',
    });
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
  
      // Check what has changed (old settings vs. new settings) and update data / UI where needed
      if (settings.user.autoPlay !== oldSettings.user.autoPlay)
        updateAutoPlayData(settings.user.autoPlay);
  
      // ToDo: This probably needs to update UI as well...
      if (settings.user.masterVolume !== oldSettings.user.masterVolume)
        playback.setSettings({ masterVolume: settings.user.masterVolume });
  
      // ToDo: This probably needs to update UI as well...
      if (settings.user.masterMute !== oldSettings.user.masterMute)
        playback.setSettings({ masterMute: settings.user.masterMute });
    }
  }
}

function documentEventFullscreenChange()
{
  moduleElements.fullscreenChangeTarget = (document.fullscreenElement !== null) ? document.fullscreenElement.id : null;
}


// ************************************************************************************************
// Click event handlers
// ************************************************************************************************

function playbackDetailsClick(event)
{
  showCurrentTrack(event);
  eventLog.add(eventLogger.SOURCE.MOUSE, Date.now(), eventLogger.EVENT.MOUSE_CLICK, null);
  showInteractionHint('showDetailsHint', '<b>Tip:</b> Double click or double tap on Artist &amp; Title for full screen track');

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
  const playbackStatus = playback.getStatus();
  scrollTo.id(playbackStatus.postId, playbackStatus.iframeId);
}

function enterFullscreenTrack()
{
  const element = document.getElementById(playback.getStatus().iframeId);
  element.requestFullscreen();
}

function exitFullscreenTrack()
{
  if (moduleElements.fullscreenChangeTarget !== null)
  {
    document.exitFullscreen();
    moduleElements.fullscreenChangeTarget = null;
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
          crossfadeToggle(event);
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

  if (moduleElements.fullscreenChangeTarget === null)
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
    eventLog.add(eventLogger.SOURCE.KEYBOARD, Date.now(), eventLogger.EVENT.KEY_ARROW_LEFT, null);

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
    eventLog.add(eventLogger.SOURCE.KEYBOARD, Date.now(), eventLogger.EVENT.KEY_ARROW_RIGHT, null);

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
// AutoPlay UI toggle and data + DOM update
// ************************************************************************************************

function autoPlayToggle(event)
{
  event.preventDefault();
  settings.user.autoPlay = (settings.user.autoPlay === true) ? false : true;
  updateAutoPlayData(settings.user.autoPlay);
}

function updateAutoPlayData(autoPlay)
{
  utils.snackbar.show(autoPlay ? 'Autoplay enabled (<b>Shift</b> + <b>F12</b> to disable)' : 'Autoplay disabled (<b>Shift</b> + <b>F12</b> to enable)', 5);
  playback.setSettings({ autoPlay: autoPlay });
  updateAutoPlayDOM(autoPlay);
}

function updateAutoPlayDOM(autoPlay)
{
  debug.log(`updateAutoPlayDOM() - autoPlay: ${autoPlay}`);

  updateAutoPlayState(autoPlay);  
  moduleElements.footerAutoPlayToggle.querySelector('.autoplay-on-off').textContent = autoPlay ? 'ON' : 'OFF';
  moduleElements.nowPlayingIcons.forEach(element => (autoPlay ? element.classList.remove('no-autoplay') : element.classList.add('no-autoplay')));

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
// Crossfade UI toggle and data + DOM update
// ************************************************************************************************

function crossfadeToggle(event)
{
  event.preventDefault();
  settings.user.autoCrossfade = (settings.user.autoCrossfade === true) ? false : true;
  updateCrossfadeData(settings.user.autoCrossfade);
}

function updateCrossfadeData(autoCrossfade)
{
  utils.snackbar.show(autoCrossfade ? 'Auto Crossfade enabled (<b>x</b> to disable)' : 'Auto Crossfade disabled (<b>x</b> to enable)', 5);
  playback.setSettings({ autoCrossfade: autoCrossfade });
  updateCrossfadeDOM(autoCrossfade);
}

function updateCrossfadeDOM(autoCrossfade)
{
  debug.log(`updateCrossfadeDOM() - autoCrossfade: ${autoCrossfade}`);
  moduleElements.footerCrossfadeToggle.querySelector('.crossfade-on-off').textContent = autoCrossfade ? 'ON' : 'OFF';
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

  function id(postId, iframeId)
  {
    if (settings.user.autoScroll)
    {
      const singlePlayer    = (document.querySelectorAll(`#${postId} iframe`).length === 1) ? true : false;
      const scrollToElement = singlePlayer ? postId : iframeId;
      const topMargin       = singlePlayer ? getTopMargin() : 10;

      // Actual functional 'offsetTop' calculation: https://stackoverflow.com/a/52477551
      const offsetTop       = Math.round(window.scrollY + document.getElementById(scrollToElement).getBoundingClientRect().top);

      const scrollTop       = Math.round(window.pageYOffset); // Don't want float results that can cause jitter
      let   headerHeight    = getScrollHeaderHeight(offsetTop > scrollTop);

      // If we get obscured by the sticky header menu, recalculate headerHeight to account for that
      if ((scrollTop + headerHeight + topMargin) > offsetTop)
        headerHeight = getScrollHeaderHeight(false);

      // ToDo: This will not be smooth on iOS... Needs polyfill
      window.scroll(
      {
        top:      (offsetTop - (headerHeight + topMargin)),
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

  function getTopMargin()
  {
    if (document.documentElement.classList.contains('track-layout-2-column'))
      return 35;
    
    if (document.documentElement.classList.contains('track-layout-3-column'))
      return 30;

    return 40;
  }
})();
