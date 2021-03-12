//
// Playback events module
//
// https://ultrafunk.com
//


import * as debugLogger                  from '../shared/debuglogger.js';
import * as utils                        from '../shared/utils.js';
import { KEY }                           from '../shared/storage.js';
import { updateProgressPercent }         from './playback-controls.js';
import { showSnackbar, dismissSnackbar } from '../shared/snackbar.js';


export {
  EVENT,
  init,
  addListener,
  dispatch,
  navigateTo,
  scrollToId,
};


/*************************************************************************************************/


const debug  = debugLogger.newInstance('playback-events');
let settings = {};

const mConfig = {
  nowPlayingIconsSelector: 'h2.entry-title',
};

const mShared = {
  nowPlayingIcons:  null,
  snackbarId:       0,
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
  mShared.nowPlayingIcons = document.querySelectorAll(mConfig.nowPlayingIconsSelector);
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
  dismissSnackbar(mShared.snackbarId);

  if (playbackEvent.data.numTracks > 1)
  {
    const nowPlayingIcon = document.querySelector(`#${playbackEvent.data.trackId} ${mConfig.nowPlayingIconsSelector}`);

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
    document.querySelector(`#${playbackEvent.data.trackId} ${mConfig.nowPlayingIconsSelector}`).classList.add('playing-paused');

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
    scrollToId(playbackEvent.data.trackId);
}

function continueAutoplay(playbackEvent)
{
  debugEvent(playbackEvent);
  navigateTo(navigationUrls.next, true); // eslint-disable-line no-undef
}

function resumeAutoplay(playbackEvent)
{
  const autoplayValue = sessionStorage.getItem(KEY.UF_AUTOPLAY);
  sessionStorage.removeItem(KEY.UF_AUTOPLAY);

  debugEvent(playbackEvent);
  debug.log(`RESUME_AUTOPLAY: ${(autoplayValue !== null) ? 'true' : 'false'}`);

  if (autoplayValue !== null)
    playbackEvent.callback.resumeAutoplay();
}

function autoplayBlocked(playbackEvent)
{
  debugEvent(playbackEvent);

  mShared.snackbarId = showSnackbar('Autoplay blocked, Play to continue', 0, 'play', () =>
  {
    if (playbackEvent.data.isPlaying === false)
      playbackEvent.callback.togglePlayPause();
  });
}

function playbackBlocked(playbackEvent)
{
  debugEvent(playbackEvent);
  showSnackbar('Unable to play track, skipping to next', 5, 'Stop', () => {}, () => playbackEventErrorTryNext(playbackEvent));
}

function mediaUnavailable(playbackEvent)
{
  debugEvent(playbackEvent);

  if (isPremiumTrack(playbackEvent.data.trackId))
  {
    showSnackbar('YouTube Premium track, skipping', 5, 'help',  () => { window.location.href = '/channel/premium/'; }, () => playbackEventErrorTryNext(playbackEvent));
  }
  else
  {
    showSnackbar('Unable to play track, skipping to next', 5, 'Stop', () => {}, () => playbackEventErrorTryNext(playbackEvent));
    debugLogger.logErrorOnServer('EVENT_MEDIA_UNAVAILABLE', playbackEvent.data);
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
  mShared.nowPlayingIcons.forEach(element =>
  {
    if (element !== nowPlayingElement)
      element.classList.remove('now-playing-icon', 'playing-animate', 'playing-paused');
  });
}

function playbackEventErrorTryNext(playbackEvent)
{
  if (playbackEvent.data.currentTrack < playbackEvent.data.numTracks)
  {
    // Only supports skipping FORWARD for now...
    playbackEvent.callback.skipToTrack(playbackEvent.data.currentTrack + 1, true);
  }
  else
  {
    if (navigationUrls.next !== null)        // eslint-disable-line no-undef
      navigateTo(navigationUrls.next, true); // eslint-disable-line no-undef
  }
}

function isPremiumTrack(trackId)
{
  const postWithId = document.getElementById(trackId);

  if (postWithId !== null)
    return postWithId.classList.contains('category-premium');
  
  return false;
}

function navigateTo(destUrl, continueAutoplay = false)
{
  debug.log(`navigateTo(): ${destUrl} - continueAutoplay: ${continueAutoplay}`);
  
  if ((destUrl !== undefined) && (destUrl !== null) && (destUrl.length > 0))
  {
    if (continueAutoplay)
      sessionStorage.setItem(KEY.UF_AUTOPLAY, 'true');
    
    window.location.href = destUrl;
  }
}


// ************************************************************************************************
// Scrolling to specified # (track) module
// ************************************************************************************************

function scrollToId(trackId)
{
  if (settings.user.autoScroll)
  {
    // Actual functional 'offsetTop' calculation: https://stackoverflow.com/a/52477551
    const offsetTop    = Math.round(window.scrollY + document.getElementById(trackId).getBoundingClientRect().top);
    const scrollTop    = Math.round(window.pageYOffset); // Don't want float results that can cause jitter
    let   headerHeight = getScrollHeaderHeight(offsetTop > scrollTop);

    // If we get obscured by the sticky header menu, recalculate headerHeight to account for that
    if ((scrollTop + headerHeight + getContentMarginTop()) > offsetTop)
      headerHeight = getScrollHeaderHeight(false);

    // ToDo: This will not be smooth on iOS... Needs polyfill?
    window.scroll(
    {
      top:      (offsetTop - (headerHeight + getContentMarginTop())),
      left:     0,
      behavior: (settings.user.smoothScrolling ? 'smooth' : 'auto'),
    });
  }
}

function getScrollHeaderHeight(isScrollDown)
{
  return (isScrollDown ? utils.getCssPropValue('--site-header-height-down') : utils.getCssPropValue('--site-header-height-up'));
}

function getContentMarginTop()
{
  // -1 because of fractional pixels on HiDPI displays (iframe bottom 1 px would show on top)
  return (utils.getCssPropValue('--site-content-margin-top') - 1);
}
