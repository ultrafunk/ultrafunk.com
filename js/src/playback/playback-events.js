//
// Playback events module
//
// https://ultrafunk.com
//


import * as debugLogger                  from '../shared/debuglogger.js';
import * as utils                        from '../shared/utils.js';
import { updateProgressPercent }         from './playback-controls.js';
import { showSnackbar, dismissSnackbar } from '../shared/snackbar.js';


export {
  EVENT,
  init,
  addListener,
  dispatch,
  navigateTo,
  scrollTo,
};


/*************************************************************************************************/


const debug  = debugLogger.newInstance('playback-events');
let settings = {};

const mConfig = {
  nowPlayingIconsSelector: 'h2.entry-title',
};

const mElements = {
  nowPlayingIcons: null,
  snackbarId:      0,
};

const EVENT = {
  LOADING:              'loading',
  READY:                'ready',
  MEDIA_PLAYING:        'mediaPlaying',
  MEDIA_PAUSED:         'mediaPaused',
  MEDIA_ENDED:          'mediaEnded',
  MEDIA_TIME_REMAINING: 'mediaTimeRemaining',
  MEDIA_SHOW:           'mediaShow',
  MEDIA_UNAVAILABLE:    'mediaUnavailable',
  CONTINUE_AUTOPLAY:    'continueAutoplay',
  RESUME_AUTOPLAY:      'resumeAutoplay',
  AUTOPLAY_BLOCKED:     'autoplayBlocked',
  PLAYBACK_BLOCKED:     'playbackBlocked',
};

const eventListeners = {
  [EVENT.LOADING]:              [ loading ],
  [EVENT.READY]:                [ ready ],
  [EVENT.MEDIA_PLAYING]:        [ mediaPlaying ],
  [EVENT.MEDIA_PAUSED]:         [ mediaPaused ],
  [EVENT.MEDIA_ENDED]:          [ mediaEnded ],
  [EVENT.MEDIA_TIME_REMAINING]: [ mediaTimeRemaining ],
  [EVENT.MEDIA_SHOW]:           [ mediaShow ],
  [EVENT.CONTINUE_AUTOPLAY]:    [ continueAutoplay ],
  [EVENT.RESUME_AUTOPLAY]:      [ resumeAutoplay ],
  [EVENT.AUTOPLAY_BLOCKED]:     [ autoplayBlocked ],
  [EVENT.PLAYBACK_BLOCKED]:     [ playbackBlocked ],
  [EVENT.MEDIA_UNAVAILABLE]:    [ mediaUnavailable ],
};


// ************************************************************************************************
// 
// ************************************************************************************************

function init(playbackSettings)
{
  debug.log('init()');
  settings = playbackSettings;
  mElements.nowPlayingIcons = document.querySelectorAll(mConfig.nowPlayingIconsSelector);
}


// ************************************************************************************************
// 
// ************************************************************************************************

function addListener(playbackEvent, playbackEventListener)
{
  if (playbackEvent in eventListeners)
    eventListeners[playbackEvent].push(playbackEventListener);
}

function dispatch(playbackEvent, playbackEventData = null, playbackEventCallback = null)
{
  eventListeners[playbackEvent].forEach((eventListener) =>
  {
    eventListener({ event: playbackEvent, data: playbackEventData, callback: playbackEventCallback });
  });
}


// ************************************************************************************************
// Default event listeners
// ************************************************************************************************

function loading(playbackEvent)
{
//debugEvent(playbackEvent);
  updateProgressPercent(playbackEvent.data.loadingPercent);
}

function ready(playbackEvent)
{
  debugEvent(playbackEvent);
  updateProgressPercent(0);
}

function mediaPlaying(playbackEvent)
{
  debugEvent(playbackEvent);
  
  // If autoplayBlocked() snackbar is still visible, dismiss it when playback starts
  dismissSnackbar(mElements.snackbarId);

  if (playbackEvent.data.numTracks > 1)
  {
    const nowPlayingIcon = document.querySelector(`#${playbackEvent.data.postId} ${mConfig.nowPlayingIconsSelector}`);

    resetNowPlayingIcons(nowPlayingIcon);
    utils.replaceClass(nowPlayingIcon, 'playing-paused', 'now-playing-icon');

    if (settings.user.animateNowPlayingIcon)
      nowPlayingIcon.classList.add('playing-animate');
  }

  /*
  if (settings.user.keepMobileScreenOn)
    screenWakeLock.enable(settings);
  */
}

function mediaPaused(playbackEvent)
{
  debugEvent(playbackEvent);

  if (playbackEvent.data.numTracks > 1)
    document.querySelector(`#${playbackEvent.data.postId} ${mConfig.nowPlayingIconsSelector}`).classList.add('playing-paused');

  /*
  if (settings.user.keepMobileScreenOn)
    screenWakeLock.disable();
  */
}

function mediaEnded(playbackEvent)
{
  debugEvent(playbackEvent);

  updateProgressPercent(0);

  if ((playbackEvent !== null) && (playbackEvent.data.numTracks > 1))
    resetNowPlayingIcons();
}

function mediaTimeRemaining()
{
//debugEvent(playbackEvent);
}

function mediaShow(playbackEvent)
{
  debugEvent(playbackEvent);

  mediaEnded(null);

  if (playbackEvent.data.scrollToMedia)
    scrollTo.id(playbackEvent.data.postId);
}

function continueAutoplay(playbackEvent)
{
  debugEvent(playbackEvent);
  navigateTo(navigationVars.nextUrl, true); // eslint-disable-line no-undef
}

function resumeAutoplay(playbackEvent)
{
  debugEvent(playbackEvent);
  debug.log(`RESUME_AUTOPLAY: ${settings.priv.continueAutoPlay}`);

  if (settings.priv.continueAutoPlay)
  {
    settings.priv.continueAutoPlay = false;
    playbackEvent.callback.resumeAutoPlay();
  }
}

function autoplayBlocked(playbackEvent)
{
  debugEvent(playbackEvent);

  mElements.snackbarId = showSnackbar('Autoplay blocked, Play to continue...', 0, 'play', () =>
  {
    if (playbackEvent.data.isPlaying === false)
      playbackEvent.callback.togglePlayPause();
  });
}

function playbackBlocked(playbackEvent)
{
  debugEvent(playbackEvent);

  showSnackbar('Unable to play track, skipping to next...', 5);
  playbackEventErrorTryNext(playbackEvent, 5);
}

function mediaUnavailable(playbackEvent)
{
  debugEvent(playbackEvent);

  if (isPremiumTrack(playbackEvent.data.postId))
  {
    showSnackbar('YouTube Premium track, skipping...', 5, 'help',  () => { window.location.href = '/channel/premium/'; });
    playbackEventErrorTryNext(playbackEvent, 5);
  }
  else
  {
    showSnackbar('Unable to play track, skipping to next...', 5);
    debugLogger.logErrorOnServer('EVENT_MEDIA_UNAVAILABLE', playbackEvent.data);
    playbackEventErrorTryNext(playbackEvent, 5);
  }
}


// ************************************************************************************************
// Misc. event handler utility functions
// ************************************************************************************************

function debugEvent(playbackEvent = null)
{
  if (debug.isDebug() && (playbackEvent !== null))
  {
  //debug.log(`${debug.getObjectKeyForValue(EVENT, playbackEvent.event)}`);
    debug.log(playbackEvent);
  }
}

function resetNowPlayingIcons(nowPlayingElement)
{
  mElements.nowPlayingIcons.forEach(element =>
  {
    if (element !== nowPlayingElement)
      element.classList.remove('now-playing-icon', 'playing-animate', 'playing-paused');
  });
}

function playbackEventErrorTryNext(playbackEvent, timeout = 5)
{
  setTimeout(() =>
  {
    if (playbackEvent.data.currentTrack < playbackEvent.data.numTracks)
    {
      // Only supports skipping FORWARD for now...
      playbackEvent.callback.skipToTrack(playbackEvent.data.currentTrack + 1, true);
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
// Scrolling to specified # (track) module
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
      return (matchesMaxWidthMobile ? siteHeaderDownMobilePx : siteHeaderDownPx);
    else
      return (matchesMaxWidthMobile ? siteHeaderUpMobilePx : siteHeaderUpPx);
  }

  function getMarginTop()
  {
    // -1 because of fractional pixels on HiDPI displays (iframe bottom 1 px would show on top)
    return (utils.getCssPropValue('--site-content-margin-top') - 1);
  }
})();
