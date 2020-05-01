//
// Browser interaction and media playback handler
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=105';
import * as storage     from '../common/storage.js?ver=105';
import * as utils       from '../common/utils.js?ver=105';
import * as eventLogger from './eventlogger.js?ver=105';
import * as playback    from './playback.js?ver=105';


const debug              = debugLogger.getInstance('interaction');
const eventLog           = new eventLogger.Interaction(10);
let settings             = {};
let playbackReady        = false;
let useKeyboardShortcuts = false;

const config = {
  youTubeIframeIdRegEx:    /youtube-uid/i,
  soundCloudIframeIdRegEx: /soundcloud-uid/i,
  autoPlayToggleId:        'footer-autoplay-toggle',
  keyboardShortcuts:       true,
  allowKeyboardShortcuts:  'allowKeyboardShortcuts',
  denyKeyboardShortcuts:   'denyKeyboardShortcuts',
  doubleClickDelay:        500,
};

const defaultSettings = {
  // Incremental version to check for new properties
  version: 3,
  // User (public) settings
  user: {
    autoPlay:             true,
    autoScroll:           true,
    smoothScrolling:      true,
    autoExitFullscreen:   true,  // Automatically exit fullscreen when a track ends
    blurFocusBgChange:    false, // Set different background color when focus is lost (blurred)
    timeRemainingWarning: true,  // Flash Play / Pause button...
    timeRemainingSeconds: 45,    // ...seconds left when warning is shown
    autoExitFsOnWarning:  true,  // Automatically exit fullscreen early when timeRemainingWarning is enabled 
  },
  // Priv (private / internal) settings
  priv: {
    continueAutoPlay:   false,
    showLeftArrowHint:  true,
    showRightArrowHint: true,
    showDetailsHint:    true,
  },
};

const elements = {
  playbackProgressBar:    null,
  playbackControls:       { playPause: null, details: null },
  fullscreenChangeTarget: null,
  footerAutoPlayToggle:   null,
};


// ************************************************************************************************
//  Document ready and init
// ************************************************************************************************

document.addEventListener('DOMContentLoaded', () =>
{ 
  if (hasEmbeddedPlayers())
  {
    readSettings();
    
    playback.setConfig({
      youTubeIframeIdRegEx:    config.youTubeIframeIdRegEx,
      soundCloudIframeIdRegEx: config.soundCloudIframeIdRegEx,
      autoPlay:                settings.user.autoPlay,
      timeRemainingWarning:    settings.user.timeRemainingWarning,
      timeRemainingSeconds:    settings.user.timeRemainingSeconds,
    });
    
    playback.init(playbackEventCallback);

    initInteraction();
    updateAutoPlayDOM(settings.user.autoPlay);
  }
});

// Listen for triggered events to toggle keyboard capture = allow other input elements to use shortcut keys
document.addEventListener(config.allowKeyboardShortcuts, () => { if (config.keyboardShortcuts) useKeyboardShortcuts = true;  });
document.addEventListener(config.denyKeyboardShortcuts,  () => { if (config.keyboardShortcuts) useKeyboardShortcuts = false; });


// ************************************************************************************************
// Interaction init and setup
// ************************************************************************************************

// Search page for <iframes> and check if any of them contains an embedded player
function hasEmbeddedPlayers()
{
  const players = document.querySelectorAll('iframe');

  for (let i = 0; i < players.length; i++)
  {
    if (config.youTubeIframeIdRegEx.test(players[i].id) || config.soundCloudIframeIdRegEx.test(players[i].id))
      return true;    
  }

  return false;
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

  useKeyboardShortcuts                = config.keyboardShortcuts;
  elements.playbackProgressBar        = document.getElementById('playback-progress').querySelector('.playback-progress-bar');
  elements.playbackControls.playPause = document.getElementById('playback-controls').querySelector('.play-pause-control');
  elements.playbackControls.details   = document.getElementById('playback-controls').querySelector('.details-control');
  elements.footerAutoPlayToggle       = document.getElementById(config.autoPlayToggleId);

  window.addEventListener('blur',    windowEventBlur);
  window.addEventListener('focus',   windowEventFocus);
  window.addEventListener('storage', windowEventStorage);
  
  document.onfullscreenchange       = onFullscreenChange;
  document.onwebkitfullscreenchange = onFullscreenChange;

  utils.addEventListeners('i.sub-pagination-prev', 'click', subPaginationClick, navigationVars.prevUrl); // eslint-disable-line no-undef
  utils.addEventListeners('i.sub-pagination-next', 'click', subPaginationClick, navigationVars.nextUrl); // eslint-disable-line no-undef
}


// ************************************************************************************************
// Playback events callback handler and functions
// ************************************************************************************************

function playbackEventCallback(playbackEvent, eventData = null)
{
  if (debug.isDebug() && (playbackEvent !== playback.EVENT.MEDIA_PLAYING) && (playbackEvent !== playback.EVENT.MEDIA_TIME_REMAINING))
  {
    debug.log(`playbackEventCallback(): ${debug.getObjectKeyForValue(playback.EVENT, playbackEvent)} (${playbackEvent})`);
    
    if (eventData !== null)
      debug.log(eventData);
  }
  
  switch(playbackEvent)
  {
    case playback.EVENT.READY:
      playbackReady = true;
      elements.playbackControls.details.addEventListener('click', playbackDetailsClick);
      elements.footerAutoPlayToggle.addEventListener('click', autoPlayToggle);
      break;

    case playback.EVENT.MEDIA_PLAYING:
      if (eventData !== null)
      {
        const scaleX = (eventData.position / (eventData.duration * 1000));
        elements.playbackProgressBar.style.transform = `scaleX(${scaleX})`;
      }
      break;
      
    case playback.EVENT.MEDIA_TIME_REMAINING:
      if (eventData !== null)
      {
        if (settings.user.autoExitFsOnWarning && (eventData.timeRemainingSeconds <= settings.user.timeRemainingSeconds))
        {
          debug.log(`playbackEventCallback(): ${debug.getObjectKeyForValue(playback.EVENT, playbackEvent)} (${playbackEvent})`);
          exitFullscreenTrack();
        }
      }
      break;

    case playback.EVENT.MEDIA_ENDED:
      if (settings.user.autoExitFullscreen)
      {
        exitFullscreenTrack();
      }
      break;

    case playback.EVENT.SHOW_MEDIA:
      if ((eventData !== null) && (eventData.postId !== null) && (eventData.iframeId !== null))
      {
        elements.playbackProgressBar.style.transform = 'scaleX(0)';
        scrollToId(eventData.postId, eventData.iframeId);
      }
      break;

    case playback.EVENT.CONTINUE_AUTOPLAY:
      navigateTo(navigationVars.nextUrl, true); // eslint-disable-line no-undef
      break;

    case playback.EVENT.RESUME_AUTOPLAY:
      resumeAutoPlay();
      break;
      
    case playback.EVENT.AUTOPLAY_BLOCKED:
      utils.showSnackbar('Autoplay was blocked, click or tap Play to continue...', 30);
      break;
      
    case playback.EVENT.PLAYBACK_BLOCKED:
      utils.showSnackbar('Unable to play track, skipping to next...', 5);
      playbackEventErrorTryNext(eventData, 5);
      break;
      
    case playback.EVENT.MEDIA_UNAVAILABLE:
      playbackEventMediaUnavailable(eventData);
      break;
  }
}

function playbackEventMediaUnavailable(eventData)
{
  if (eventData !== null)
  {
    if (isPremiumTrack(eventData.postId))
    {
      utils.showSnackbar('YouTube Premium track, skipping to next... <a href="/channel/premium/"><b>HELP</b></a>', 10);
      playbackEventErrorTryNext(eventData, 5);
    }
    else
    {
      utils.showSnackbar('Unable to play track, skipping to next...', 5);
      logClientErrorOnServer('EVENT_MEDIA_UNAVAILABLE', eventData);
      playbackEventErrorTryNext(eventData, 5);
    }
  }
}

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
  const oldSettings = storage.parseEventData(event, storage.KEY.UF_PLAYBACK_SETTINGS);

  if (oldSettings !== null)
  {
    debug.log(`windowEventStorage(): ${event.key}`);

    // Stored settings have changed, read updated settings from storage
    readSettings();

    // Check what has changed (old settings vs. new settings) and update data / UI where needed
    if(settings.user.autoPlay !== oldSettings.user.autoPlay)
      updateAutoPlayData(settings.user.autoPlay);
  }
}

function onFullscreenChange()
{
  elements.fullscreenChangeTarget = (document.fullscreenElement !== null) ? document.fullscreenElement.id : null;
  debug.log(`onFullscreenChange(): ${elements.fullscreenChangeTarget}`);
}

function enterFullscreenTrack()
{
  const element = document.getElementById(playback.getStatus().iframeId);
  element.requestFullscreen();
}

function exitFullscreenTrack()
{
  if (elements.fullscreenChangeTarget !== null)
  {
    document.exitFullscreen();
    elements.fullscreenChangeTarget = null;
  }
}

function subPaginationClick(event, destUrl)
{
  if ((event !== null) && (destUrl !== null))
  {
    event.preventDefault();
    navigateTo(destUrl, playback.getStatus().isPlaying);
  }
}

function isPremiumTrack(postId)
{
  const postWithId = document.getElementById(postId);

  if (postWithId !== null)
    return postWithId.classList.contains('category-premium');
  
  return false;
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

function playbackEventErrorTryNext(eventData, timeout = 5)
{
  setTimeout(() =>
  {
    if (eventData.currentTrack < eventData.numTracks)
    {
      playback.playTrack(eventData.currentTrack + 1, true);
    }
    else
    {
      if (navigationVars.nextUrl !== null)        // eslint-disable-line no-undef
        navigateTo(navigationVars.nextUrl, true); // eslint-disable-line no-undef
    }
  }, ((timeout * 1000) + 250));
}

function playbackDetailsClick(event)
{
  showCurrentTrack(event);
  eventLog.add(eventLogger.SOURCE.MOUSE, Date.now(), eventLogger.EVENT.MOUSE_CLICK, null);
  showInteractionHint('showDetailsHint', '<b>Tip:</b> Double click or double tap on Artist &amp; Title for full screen track');

  if (eventLog.doubleClicked(eventLogger.SOURCE.MOUSE, eventLogger.EVENT.MOUSE_CLICK, config.doubleClickDelay))
    enterFullscreenTrack();
}

function showCurrentTrack(event)
{
  event.preventDefault();
  const playbackStatus = playback.getStatus();
  scrollToId(playbackStatus.postId, playbackStatus.iframeId);
}


// ************************************************************************************************
// Keyboard events handler and functions
// ************************************************************************************************

document.addEventListener('keydown', (event) =>
{
  if (playbackReady && useKeyboardShortcuts && (event.ctrlKey === false) && (event.altKey === false))
  {
    switch (event.key)
    {
      case ' ':
        event.preventDefault();
        playback.togglePlayPause();
        break;

      case 'f':
      case 'F':
        {
          event.preventDefault();

          if (elements.fullscreenChangeTarget === null)
            enterFullscreenTrack();
          else
            exitFullscreenTrack();
        }
        break;

      case 'ArrowLeft':
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
        break;
        
      case 'ArrowRight':
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

function doubleTapNavPrev(prevUrl, playbackStatus)
{
  if (prevUrl !== null)
  {
    if ((playbackStatus.currentTrack === 1) && (playbackStatus.isPlaying === false))
    {
      showInteractionHint('showLeftArrowHint', '<b>Tip:</b> Double click the Left Arrow key to go to the previous page');

      if (eventLog.doubleClicked(eventLogger.SOURCE.KEYBOARD, eventLogger.EVENT.KEY_ARROW_LEFT, config.doubleClickDelay))
      {
        navigateTo(prevUrl, false);
        return true;
      }
    }
  }
  
  return false;
}

function doubleTapNavNext(nextUrl, playbackStatus)
{
  if (nextUrl !== null)
  {
    if (playbackStatus.currentTrack === playbackStatus.numTracks) // && (playbackStatus.isPlaying === false))
    {
      showInteractionHint('showRightArrowHint', '<b>Tip:</b> Double click the Right Arrow key to go to the next page');

      if (eventLog.doubleClicked(eventLogger.SOURCE.KEYBOARD, eventLogger.EVENT.KEY_ARROW_RIGHT, config.doubleClickDelay))
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
    utils.showSnackbar(hintText, snackbarTimeout);
    settings.priv[hintProperty] = false;
  }
}

function autoPlayToggle(event)
{
  event.preventDefault();
  settings.user.autoPlay = (settings.user.autoPlay === true) ? false : true;
  updateAutoPlayData(settings.user.autoPlay);
}

function updateAutoPlayData(autoPlay)
{
  const snackbarText = autoPlay ? 'AutoPlay enabled (Shift + F12 to disable)' : 'AutoPlay disabled (Shift + F12 to enable)';
  playback.setConfig({ autoPlay: autoPlay });
  utils.showSnackbar(snackbarText, 5);
  updateAutoPlayDOM(autoPlay);
}

function updateAutoPlayDOM(autoPlay)
{
  debug.log(`updateAutoPlayDOM(): ${autoPlay}`);

  if (autoPlay)
  {
    document.body.classList.remove('blurred');
    elements.playbackProgressBar.classList.remove('no-autoplay');
    elements.playbackControls.playPause.classList.remove('no-autoplay');
    elements.footerAutoPlayToggle.querySelector('.autoplay-on-off').textContent = 'ON';
  }
  else
  {
    if ((document.hasFocus() === false) && settings.user.blurFocusBgChange)
      document.body.classList.add('blurred');
    
    elements.playbackProgressBar.classList.add('no-autoplay');
    elements.playbackControls.playPause.classList.add('no-autoplay');
    elements.footerAutoPlayToggle.querySelector('.autoplay-on-off').textContent = 'OFF';
  }
}


// ************************************************************************************************
// Scrolling and (auto)play navigation
// ************************************************************************************************

// Get CSS variables (px heigth) for multistate sticky top nav menu
const siteHeaderDownPx       = utils.getCssPropValue('--site-header-down');
const siteHeaderDownMobilePx = utils.getCssPropValue('--site-header-down-mobile');
const siteHeaderUpPx         = utils.getCssPropValue('--site-header-up');
const siteHeaderUpMobilePx   = utils.getCssPropValue('--site-header-up-mobile');

function getScrollHeaderHight(directionDown)
{
  const matchesMaxWidthMobile = utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE);
  
  if (directionDown)
    return ((matchesMaxWidthMobile === true) ? siteHeaderDownMobilePx : siteHeaderDownPx);
  else
    return ((matchesMaxWidthMobile === true) ? siteHeaderUpMobilePx : siteHeaderUpPx);
}

function scrollToId(postId, iframeId)
{
  if (settings.user.autoScroll)
  {
    const singlePlayer    = (document.querySelectorAll('#' + postId + ' iframe').length === 1) ? true : false;
    const scrollToElement = singlePlayer ? postId : iframeId;
    const topMargin       = singlePlayer ? 35 : 10;
    // Actual functional 'offsetTop' calculation: https://stackoverflow.com/a/52477551
    const offsetTop       = Math.round(window.scrollY + document.getElementById(scrollToElement).getBoundingClientRect().top);
    const scrollTop       = Math.round(window.pageYOffset); // Don't want float results that can cause jitter
    let   headerHeight    = getScrollHeaderHight(offsetTop > scrollTop);

    // If we get obscured by the sticky header menu, recalculate headerHeight to account for that
    if ((scrollTop + headerHeight + topMargin) > offsetTop)
      headerHeight = getScrollHeaderHight(false);

    // ToDo: This will not be smooth on iOS... Needs polyfill
    window.scroll(
    {
      top:      (offsetTop - (headerHeight + topMargin)),
      left:     0,
      behavior: (settings.user.smoothScrolling ? 'smooth' : 'auto'),
    });
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

function resumeAutoPlay()
{
  debug.log(`resumeAutoPlay(): ${settings.priv.continueAutoPlay}`);

  if (settings.priv.continueAutoPlay)
  {
    settings.priv.continueAutoPlay = false;
    playback.resumeAutoPlay();
  }
}

