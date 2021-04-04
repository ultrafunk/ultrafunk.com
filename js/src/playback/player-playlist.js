//
// Standalone player + playlist module
//
// https://ultrafunk.com
//


import * as debugLogger  from '../shared/debuglogger.js';
import * as eventLogger  from './eventlogger.js';
import * as controls     from './playback-controls.js';
import * as mediaPlayers from './mediaplayers.js';
import * as utils        from '../shared/utils.js';
import { KEY }           from '../shared/storage.js';
import { shareModal }    from '../site/interaction.js';
import { navigateTo }    from './playback-events.js';

import {
  showSnackbar,
  dismissSnackbar,
} from '../shared/snackbar.js';


export {
  init,
};


/*************************************************************************************************/


const debug           = debugLogger.newInstance('player-playlist');
const eventLog        = new eventLogger.Playback(10);
let settings          = {};
let player            = null;
let autoplayToggle    = null;
let firstStatePlaying = true;

const list = {
  container: null,
  observer:  null,
};

const current = {
  trackId:       null,
  element:       null,
  snackbarId:    0,
  autoplayValue: null,
};


// ************************************************************************************************
//
// ************************************************************************************************

function init(playbackSettings, autoplayToggleCallback)
{
  debug.log('init');

  settings       = playbackSettings;
  autoplayToggle = autoplayToggleCallback;
  list.container = document.getElementById('tracklist-container');
  list.observer  = new IntersectionObserver(observerCallback, { root: list.container });
  
  if (setCurrentIdAndElement() !== null)
  {
    initYouTubeAPI();
    utils.fullscreenElement.init();
    utils.keyboardShortcuts.init(settings.user);

    document.addEventListener('keydown', documentEventKeyDown);

    //ToDo: Add common code in playback-controls.js for player-playlist & playback/interaction?
    utils.addEventListeners('#playback-controls .details-control',   'click', scrollPlayerIntoView);
    utils.addEventListeners('#playback-controls .thumbnail-control', 'click', scrollPlayerIntoView);
    utils.addEventListeners('#playback-controls .timer-control',     'click', (event) => autoplayToggle(event));
  }
  else
  {
    showSnackbar('No playable YouTube tracks!', 0, 'help', () => { window.location.href = "/help/#compact-player"; });
  }

  document.getElementById('footer-autoplay-toggle').addEventListener('click', (event) => autoplayToggle(event));
  utils.addEventListeners('i.nav-bar-arrow-back', 'click', prevNextNavTo, navigationVars.prev); // eslint-disable-line no-undef
  utils.addEventListeners('i.nav-bar-arrow-fwd',  'click', prevNextNavTo, navigationVars.next); // eslint-disable-line no-undef
  setTrackButtonListeners();
}

function setTrackButtonListeners()
{
  list.container.addEventListener('click', (event) =>
  {
    const playTrackButton = event.target.closest('div.thumbnail');
    if (playTrackButton !== null) return setCurrentTrack(playTrackButton.closest('div.track-entry').id, true, true);

    const sharePlayOnButton = event.target.closest('div.share-playon-button');
    if (sharePlayOnButton !== null ) return sharePlayOnButtonClick(sharePlayOnButton);

  //const menuButton = event.target.closest('div.menu-button');
  //if (menuButton !== null) return debug.log('div.menu-button');
  });
}


// ************************************************************************************************
//
// ************************************************************************************************

function documentEventKeyDown(event)
{
  if (utils.keyboardShortcuts.allow() && (event.repeat === false) && (event.ctrlKey === false) && (event.altKey === false))
  {
    switch(event.code)
    {
      case 'Backquote':
        event.preventDefault();
        scrollPlayerIntoView(event);
        break;
    }

    switch (event.key)
    {
      case ' ':
        event.preventDefault();
        (current.trackId !== null) ? setCurrentTrack(current.trackId) : setCurrentTrack(list.container.querySelector('.track-entry.current').id);
        break;

      case 'ArrowLeft':
        event.preventDefault();
        (event.shiftKey === false) ? prevTrack() : prevNextNavTo(event, navigationVars.prev); // eslint-disable-line no-undef
        break;

      case 'ArrowRight':
        event.preventDefault();
        (event.shiftKey === false) ? nextTrack() : prevNextNavTo(event, navigationVars.next); // eslint-disable-line no-undef
        break;

      case 'A':
        autoplayToggle(event);
        break;

      case 'f':
      case 'F':
        event.preventDefault();
        utils.fullscreenElement.toggle(document.getElementById('youtube-player'));
        break;

      case 'm':
      case 'M':
        event.preventDefault();
        toggleMute();
        showSnackbar(settings.user.masterMute ? 'Volume is muted (<b>m</b> to unmute)' : 'Volume is unmuted (<b>m</b> to mute)', 3);
        break;
    }
  }
}


// ************************************************************************************************
//
// ************************************************************************************************

function sharePlayOnButtonClick(sharePlayOnButton)
{
  const trackEntry       = sharePlayOnButton.closest('div.track-entry');
  const artistTrackTitle = trackEntry.getAttribute('data-artist-track-title');
  const trackUrl         = trackEntry.getAttribute('data-track-url');
  
  shareModal.show({ string: artistTrackTitle, filterString: true, url: trackUrl });
}

function scrollPlayerIntoView()
{
  let scrollTop = 0;

  if (window.pageYOffset < 1)
    scrollTop = utils.getCssPropValue('--site-header-height') - utils.getCssPropValue('--site-header-height-down');

  window.scroll(
  {
    top:      scrollTop,
    left:     0,
    behavior: (settings.user.smoothScrolling ? 'smooth' : 'auto'),
  });
}

function toggleMute()
{
  settings.user.masterMute ? settings.user.masterMute = false : settings.user.masterMute = true;
  settings.user.masterMute ? player.embedded.mute()           : player.embedded.unMute();
}


// ************************************************************************************************
//
// ************************************************************************************************

function setCurrentIdAndElement()
{
  current.trackId = getNextPlayableId();

  if (current.trackId !== null)
  {
    current.autoplayValue = sessionStorage.getItem(KEY.UF_AUTOPLAY);
    sessionStorage.removeItem(KEY.UF_AUTOPLAY);
  
    if (current.autoplayValue !== null)
    {
      const matches = current.autoplayValue.match(/^[a-zA-Z0-9-_]{11}$/);
      
      if (matches !== null)
        current.trackId = matches[0];
    }
  
    debug.log(`setCurrentIdAndElement() - autoplayValue: ${(current.autoplayValue !== null) ? current.autoplayValue : 'N/A'} - current.trackId: ${current.trackId}`);
  
    current.element = document.getElementById(current.trackId);
    list.observer.observe(current.element);
  }

  return current.trackId;
}

function observerCallback(entries)
{
  list.observer.unobserve(current.element);

  if ((Math.ceil(entries[0].intersectionRatio * 100) / 100) !== 1)
    list.container.scrollTop = (current.element.offsetTop - list.container.offsetHeight) + current.element.offsetHeight;    
}

function prevNextNavTo(event, destUrl)
{
  event.preventDefault();
  navigateTo(destUrl, controls.isPlaying());
}


// ************************************************************************************************
//
// ************************************************************************************************

function getPrevPlayableId()
{
  let destElement = (current.element !== null) ? current.element.previousElementSibling : null;

  while ((destElement !== null) && (destElement.id === ''))
    destElement = destElement.previousElementSibling;

  debug.log(`getPrevPlayableId(): ${(destElement !== null) ? destElement.id : 'null'}`);
  
  return (destElement !== null) ? destElement.id : null;
}

function getNextPlayableId()
{
  let destElement = (current.element !== null) ? current.element.nextElementSibling : list.container.querySelector('.track-entry');

  while ((destElement !== null) && (destElement.id === ''))
    destElement = destElement.nextElementSibling;

  debug.log(`getNextPlayableId(): ${(destElement !== null) ? destElement.id : 'null'}`);
  
  return (destElement !== null) ? destElement.id : null;
}

function setCurrentTrack(nextTrackId, playNextTrack = true, isPointerClick = false)
{
//https://wordpress.ultrafunk.com/player/page/21/
//Unable to play last track in list needs better error handling / state reset if autoplay is disabled

  debug.log(`setCurrentTrack(): ${nextTrackId} - playNextTrack: ${playNextTrack} - isPointerClick: ${isPointerClick}`);

  if (nextTrackId === current.trackId)
  {
    togglePlayPause();
  }
  else
  {
    if (controls.isPlaying())
      player.embedded.stopVideo();

    current.element.classList.remove('current', 'playing', 'paused');

    current.trackId = nextTrackId;
    current.element = document.getElementById(current.trackId);

    if (isPointerClick === false)
      list.observer.observe(current.element);

    current.element.classList.add('current');

    loadOrCueCurrentTrack(playNextTrack);
  }
}

function loadOrCueCurrentTrack(playTrack)
{
  player.setArtistTitleThumbnail(current.element.getAttribute('data-artist-track-title'), current.trackId);
  
  if (playTrack)
  {
    player.embedded.loadVideoById(current.trackId);
    setPlayStateClass(true);
  }
  else
  {
    player.embedded.cueVideoById(current.trackId);
    setPlayStateClass(false);
  }
}


// ************************************************************************************************
//
// ************************************************************************************************

function togglePlayPause()
{
  controls.isPlaying() ? player.embedded.pauseVideo() : player.embedded.playVideo();
}

function advanceToNextTrack(autoplay = false)
{
  const nextTrackId = getNextPlayableId();
  
  if (nextTrackId === null)
    navigateTo(navigationVars.next, autoplay); // eslint-disable-line no-undef
  else
    autoplay ? setCurrentTrack(nextTrackId) : setPlayStateClass(false);
}

function prevTrack()
{
  const prevTrackId = getPrevPlayableId();
  const position    = player.embeddedPlayer.getCurrentTime();

  if ((prevTrackId !== null) && (position <= 5))
  {
    setCurrentTrack(prevTrackId, controls.isPlaying());
    controls.updatePrevState();
  }
  else if (position !== 0)
  {
    player.seekTo(0);
    playbackTimer.update(0, 0);
  }
}

function nextTrack()
{
  const nextTrackId = getNextPlayableId();

  if (nextTrackId !== null)
  {
    setCurrentTrack(nextTrackId, controls.isPlaying());
    controls.updateNextState();
  }
}

function setPlayStateClass(isPlayingState)
{
  isPlayingState ? utils.replaceClass(current.element, 'paused', 'playing') : utils.replaceClass(current.element, 'playing', 'paused');
}

function skipToNextTrack()
{
  if ((controls.isPlaying() === false) && (current.autoplayValue !== null))
  {
    eventLog.add(eventLogger.SOURCE.ULTRAFUNK, eventLogger.EVENT.RESUME_AUTOPLAY, null);
    eventLog.add(eventLogger.SOURCE.YOUTUBE, -1, getNextPlayableId());
  }

  if (controls.isPlaying() === false)
    advanceToNextTrack(true);
}

function stopSkipToNextTrack()
{
  current.trackId = null;
  setPlayStateClass(false);
}


// ************************************************************************************************
//
// ************************************************************************************************

function initYouTubeAPI()
{
  debug.log('initYouTubeAPI()');

  window.onYouTubeIframeAPIReady = function()
  {
    debug.log('onYouTubeIframeAPIReady()');
  
    // eslint-disable-next-line no-undef
    const embeddedPlayer = new YT.Player('youtube-player',
    {
      events:
      {
        onReady:       onYouTubePlayerReady,
        onStateChange: onYouTubePlayerStateChange,
        onError:       onYouTubePlayerError,
      }
    });

    player = new mediaPlayers.Playlist(embeddedPlayer);
    controls.init(settings.user, player, (positionSeconds) => { player.seekTo(positionSeconds); });
    debug.log(player);
  };

  const tag = document.createElement('script');
  tag.id    = 'youtube-iframe-api';
  tag.src   = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubePlayerReady()
{
  current.element.classList.add('current');
  
  if (current.autoplayValue !== null)
    eventLog.add(eventLogger.SOURCE.ULTRAFUNK, eventLogger.EVENT.RESUME_AUTOPLAY, null);

  controls.ready(prevTrack, togglePlayPause, nextTrack, toggleMute);
  loadOrCueCurrentTrack(current.autoplayValue !== null);
}

function onYouTubePlayerStateChange(event)
{
  debug.log(`onYouTubePlayerStateChange(): ${event.data} - trackId: ${current.trackId}`);
  eventLog.add(eventLogger.SOURCE.YOUTUBE, event.data, current.trackId);

  // Set playback controls state to YouTube state so we have a single source of truth = controls.isPlaying()
  if (event.data !== YT.PlayerState.PLAYING) // eslint-disable-line no-undef
    controls.setPauseState();

  switch(event.data)
  {
    // eslint-disable-next-line no-undef
    case YT.PlayerState.UNSTARTED:
      if (eventLog.ytAutoplayBlocked(current.trackId, 3000))
      {
        setPlayStateClass(false);
        current.snackbarId = showSnackbar('Autoplay blocked, Play to continue', 0, 'play', () => player.embedded.playVideo());
      }
      break;
    
    // eslint-disable-next-line no-undef
    case YT.PlayerState.ENDED:
      playbackTimer.stop(true);
      advanceToNextTrack(settings.user.autoplay);
      break;
    
    // eslint-disable-next-line no-undef
    case YT.PlayerState.PLAYING:
      onYouTubeStatePlaying(event);
      playbackTimer.start();
      controls.setPlayState();
      setPlayStateClass(true);
      break;

    // eslint-disable-next-line no-undef
    case YT.PlayerState.PAUSED:
      setPlayStateClass(false);
      break;
  }
}

function onYouTubeStatePlaying(event)
{
  dismissSnackbar(current.snackbarId);
  player.setDuration(Math.round(event.target.getDuration()));

  if (firstStatePlaying)
  {
    firstStatePlaying     = false;
    current.autoplayValue = null;
    
    setTimeout(() =>
    {
      if (settings.user.autoplay && controls.isPlaying() && (window.pageYOffset < 1))
        scrollPlayerIntoView();
    },
    6000);
  }
}

function onYouTubePlayerError(event)
{
  debug.log(`onYouTubePlayerError(): ${event.data} - trackId: ${current.trackId}`);

  current.element.querySelector('.track-duration').innerText     = 'Error';
  current.element.querySelector('.track-duration').style.display = 'block';

  eventLog.add(eventLogger.SOURCE.YOUTUBE, eventLogger.EVENT.PLAYER_ERROR, current.trackId);
  showSnackbar('Unable to play track, skipping to next', 5, 'Stop', stopSkipToNextTrack, skipToNextTrack);
}


// ************************************************************************************************
//
// ************************************************************************************************

const playbackTimer = (() =>
{
  let intervalId = -1;
  let isVisible  = true;

  document.addEventListener('visibilitychange', () => { isVisible = (document.visibilityState === 'visible') ? true : false; });

  return {
    start,
    stop,
    update,
  };
  
  function start()
  {
    stop();

    intervalId = setInterval(() =>
    {
      if (isVisible && controls.isPlaying())
        update((player.embedded.getCurrentTime() * 1000), player.getDuration());
    },
    250);
  }
  
  function stop(resetState = false)
  {
    if (intervalId !== -1)
    {
      clearInterval(intervalId);
      intervalId = -1;
    }

    if (resetState)
      update(0, 0);
  }
  
  function update(positionMilliseconds, durationSeconds)
  {
    if (Number.isNaN(positionMilliseconds) === false)
    {
      controls.updateProgressPosition(positionMilliseconds, durationSeconds);
      controls.setTimer(Math.round(positionMilliseconds / 1000), durationSeconds);
    }
  }
})();
