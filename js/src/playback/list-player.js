//
// List-player module
//
// https://ultrafunk.com
//


import * as debugLogger    from '../shared/debuglogger.js';
import * as eventLogger    from './eventlogger.js';
import * as controls       from './playback-controls.js';
import * as mediaPlayers   from './mediaplayers.js';
import * as screenWakeLock from './screen-wakelock.js';
import * as utils          from '../shared/utils.js';
import { KEY }             from '../shared/storage.js';
import { showModal }       from '../shared/modal.js';
import { shareModal }      from '../site/interaction.js';
import { navigateTo }      from './playback-events.js';

import {
  showSnackbar,
  dismissSnackbar,
} from '../shared/snackbar.js';


export {
  init,
  getStatus,
};


/*************************************************************************************************/


const debug    = debugLogger.newInstance('list-player');
const eventLog = new eventLogger.Playback(10);

const m = {
  settings:          {},
  player:            null,
  autoplayData:      null,
  autoplayToggle:    null,
  firstStatePlaying: true,
};

const list = {
  container: null,
  observer:  null,
};

const current = {
  trackId:    null,
  element:    null,
  snackbarId: 0,
};


// ************************************************************************************************
//
// ************************************************************************************************

function init(playbackSettings, autoplayToggle)
{
  debug.log('init');

  m.settings       = playbackSettings;
  m.autoplayToggle = autoplayToggle;
  list.container = document.getElementById('tracklist-container');
  list.observer  = new IntersectionObserver(observerCallback, { root: list.container });
  
  if (cueInitialTrack() !== null)
    initYouTubeAPI();
  else
    showSnackbar('No playable YouTube tracks!', 0, 'help', () => { window.location.href = "/help/#list-player"; });

  utils.addListenerAll('span.nav-bar-arrow-back', 'click', prevNextNavTo, navigationVars.prev); // eslint-disable-line no-undef
  utils.addListenerAll('span.nav-bar-arrow-fwd',  'click', prevNextNavTo, navigationVars.next); // eslint-disable-line no-undef

  list.container.addEventListener('click', (event) =>
  {
    const playTrackButton = event.target.closest('div.thumbnail');
    if (playTrackButton !== null) return setCurrentTrack(playTrackButton.closest('div.track-entry').id, true, true);

    const sharePlayOnButton = event.target.closest('div.share-playon-button');
    if (sharePlayOnButton !== null ) return sharePlayOnButtonClick(sharePlayOnButton);

    const moreButton = event.target.closest('div.menu-button');
    if (moreButton !== null) return moreButtonOnClick(moreButton);
  });
}


// ************************************************************************************************
//
// ************************************************************************************************

function documentEventKeyDown(event)
{
  if (utils.keyboardShortcuts.allow() &&
      (event.repeat  === false)       &&
      (event.ctrlKey === false)       &&
      (event.altKey  === false))
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
        (event.shiftKey === true) ? prevNextNavTo(null, navigationVars.prev) : prevTrack(); // eslint-disable-line no-undef
        break;

      case 'ArrowRight':
        event.preventDefault();
        (event.shiftKey === true) ? prevNextNavTo(null, navigationVars.next) : nextTrack(); // eslint-disable-line no-undef
        break;

      case 'A':
        m.autoplayToggle.toggle(event);
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
        showSnackbar(m.settings.user.masterMute ? 'Volume is muted (<b>m</b> to unmute)' : 'Volume is unmuted (<b>m</b> to mute)', 3);
        break;
    }
  }
}


// ************************************************************************************************
//
// ************************************************************************************************

function sharePlayOnButtonClick(element)
{
  const trackEntry  = element.closest('div.track-entry');
  const artistTitle = `${trackEntry.getAttribute('data-track-artist')} - ${trackEntry.getAttribute('data-track-title')}`;
  const trackUrl    = trackEntry.getAttribute('data-track-url');

  shareModal.show({ string: artistTitle, filterString: true, url: trackUrl });
}

function moreButtonOnClick(element)
{
  const entryList  = [];
  const trackEntry = element.closest('div.track-entry');
  const artist     = trackEntry.getAttribute('data-track-artist');
  const title      = trackEntry.getAttribute('data-track-title');
  const artists    = trackEntry.querySelector('.track-artists-links').querySelectorAll('a');
  const channels   = trackEntry.querySelector('.track-channels-links').querySelectorAll('a');

  entryList.push({ id: null, class: 'dialog-body-text', text: `<b>${artist}</b><br><span class="light-text">${title}</span>` });
  entryList.push({ id: null, class: 'dialog-body-title', text: 'Artists' });
  artists.forEach(item => entryList.push({ id: `modal-item-id-${entryList.length + 1}`, class: item.classList[0], text: item.innerText, link: item.href, icon: 'link' }));
  entryList.push({ id: null, class: 'dialog-body-title', text: 'Channels' });
  channels.forEach(item => entryList.push({ id: `modal-item-id-${entryList.length + 1}`, text: item.innerText, link: item.href, icon: 'link' }));

  showModal('Track Details', entryList, (clickId) => { window.location.href = entryList[entryList.findIndex(item => (item.id === clickId))].link; });
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
    behavior: (m.settings.user.smoothScrolling ? 'smooth' : 'auto'),
  });
}

function toggleMute()
{
  m.settings.user.masterMute ? m.settings.user.masterMute = false : m.settings.user.masterMute = true;
  m.settings.user.masterMute ? m.player.embedded.mute()           : m.player.embedded.unMute();
}


// ************************************************************************************************
//
// ************************************************************************************************

function cueInitialTrack()
{
  current.trackId = getNextPlayableId();
  m.autoplayData  = JSON.parse(sessionStorage.getItem(KEY.UF_AUTOPLAY));
  sessionStorage.removeItem(KEY.UF_AUTOPLAY);

  if (current.trackId !== null)
  {
    if ((m.autoplayData !== null) && (m.autoplayData.trackId !== null))
    {
      const matchesVideoId = m.autoplayData.trackId.match(/^[a-zA-Z0-9-_]{11}$/);
      
      if (matchesVideoId !== null)
      {
        current.trackId = matchesVideoId[0];
      }
      else if (m.autoplayData.trackId.match(/^track-(?!0)\d{1,6}$/i) !== null)
      {
        const trackElement = list.container.querySelectorAll(`[data-post-id="${m.autoplayData.trackId.slice(6)}"]`);

        if (trackElement.length === 1)
        {
          if (trackElement[0].id.length !== 0)
            current.trackId = trackElement[0].id;
          else
            showSnackbar('Cannot play SoundCloud track', 5, 'help', () => { window.location.href = "/help/#list-player"; });
        }
        else
        {
          showSnackbar('Unable to cue track (not found)', 5);
        }
      }
    }
  
    current.element = document.getElementById(current.trackId);
    list.observer.observe(current.element);
  }

  debug.log(`cueInitialTrack() - current.trackId: ${current.trackId} - autoplayData: ${(m.autoplayData !== null) ? JSON.stringify(m.autoplayData) : 'N/A'}`);

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
  event?.preventDefault();
  navigateTo(destUrl, controls.isPlaying());
}


// ************************************************************************************************
//
// ************************************************************************************************

function getPrevPlayableId()
{
  let destElement = (current.element !== null) ? current.element.previousElementSibling : null;

  while ((destElement !== null) && (destElement.id.length === 0))
    destElement = destElement.previousElementSibling;

  return (destElement !== null) ? destElement.id : null;
}

function getNextPlayableId(startElement = current.element)
{
  let destElement = (startElement !== null) ? startElement.nextElementSibling : list.container.querySelector('.track-entry');

  while ((destElement !== null) && (destElement.id.length === 0))
    destElement = destElement.nextElementSibling;
  
  return (destElement !== null) ? destElement.id : null;
}

function setCurrentTrack(nextTrackId, playNextTrack = true, isPointerClick = false)
{
//https://wordpress.ultrafunk.com/list/page/21/
//ToDo: Unable to play last track in list needs better error handling / state reset if autoplay is disabled

  debug.log(`setCurrentTrack() - nextTrackId: ${(nextTrackId.length !== 0) ? nextTrackId : 'N/A' } - playNextTrack: ${playNextTrack} - isPointerClick: ${isPointerClick}`);

  if ((nextTrackId.length === 0) && isPointerClick)
  {
    showSnackbar('Cannot play SoundCloud track', 5, 'help', () => { window.location.href = "/help/#list-player"; });
    return;
  }
  
  if (nextTrackId === current.trackId)
  {
    togglePlayPause();
  }
  else
  {
    if (controls.isPlaying())
      m.player.embedded.stopVideo();

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
  m.player.setArtist(current.element.getAttribute('data-track-artist'));
  m.player.setTitle(current.element.getAttribute('data-track-title'));
  m.player.setThumbnail(current.trackId);
  
  if (playTrack)
  {
    m.player.embedded.loadVideoById(current.trackId);
    setPlayStateClass(true);
  }
  else
  {
    m.player.embedded.cueVideoById(current.trackId);
    setPlayStateClass(false);
  }
}

function getStatus()
{
  let status      = { isPlaying: false, currentTrack: 1, position: 0, trackId: 0 };
  const currentId = list.container.querySelector('.track-entry.current')?.id;

  if (currentId === undefined)
    return status;
  
  list.container.querySelectorAll('.track-entry').forEach((element, index) =>
  {
    if (element.id === currentId)
    {
      status = {
        isPlaying:    controls.isPlaying(),
        currentTrack: (index + 1),
        position:     Math.ceil(m.player.embedded.getCurrentTime()),
        trackId:      `track-${element.getAttribute('data-post-id')}`,
      };
    }
  });

  return status;
}


// ************************************************************************************************
//
// ************************************************************************************************

function togglePlayPause()
{
  controls.isPlaying() ? m.player.embedded.pauseVideo() : m.player.embedded.playVideo();
}

function advanceToNextTrack(autoplay = false, isPlaybackError = false)
{
  const repeatMode  = isPlaybackError ? controls.REPEAT.OFF : controls.getRepeatMode();
  const nextTrackId = getNextPlayableId();

  debug.log(`advanceToNextTrack() autoplay: ${autoplay} - isPlaybackError: ${isPlaybackError} - nextTrackId: ${nextTrackId} - repeatMode: ${debug.getObjectKeyForValue(controls.REPEAT, repeatMode)}`);

  if (autoplay && (repeatMode === controls.REPEAT.ONE))
  {
    m.player.embeddedPlayer.seekTo(0);
    m.player.embeddedPlayer.playVideo();
  }
  else if (autoplay && (nextTrackId === null) && (repeatMode === controls.REPEAT.ALL))
  {
    setCurrentTrack(getNextPlayableId(list.container.querySelector('.track-entry')));
    scrollPlayerIntoView();
  }
  else
  {
    if (nextTrackId === null)
      navigateTo(navigationVars.next, autoplay); // eslint-disable-line no-undef
    else
      autoplay ? setCurrentTrack(nextTrackId) : setPlayStateClass(false);
  }
}

function prevTrack()
{
  const prevTrackId = getPrevPlayableId();
  const position    = m.player.embeddedPlayer.getCurrentTime();

  if ((prevTrackId !== null) && (position <= 5))
  {
    setCurrentTrack(prevTrackId, controls.isPlaying());
    controls.updatePrevState();
  }
  else if (position !== 0)
  {
    m.player.seekTo(0);
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
  if ((controls.isPlaying() === false) && (m.autoplayData !== null))
  {
    eventLog.add(eventLogger.SOURCE.ULTRAFUNK, eventLogger.EVENT.RESUME_AUTOPLAY, null);
    eventLog.add(eventLogger.SOURCE.YOUTUBE, -1, getNextPlayableId());
  }

  if (controls.isPlaying() === false)
    advanceToNextTrack(true, true);
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

    m.player = new mediaPlayers.Playlist(embeddedPlayer);
    controls.init(m.settings.user, m.player, (positionSeconds) => { m.player.seekTo(positionSeconds); });
    debug.log(m.player);
  };

  const tag = document.createElement('script');
  tag.id    = 'youtube-iframe-api';
  tag.src   = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubePlayerReady()
{
  debug.log('onYouTubePlayerReady()');

  current.element.classList.add('current');
  
  if (m.autoplayData?.autoplay === true)
    eventLog.add(eventLogger.SOURCE.ULTRAFUNK, eventLogger.EVENT.RESUME_AUTOPLAY, null);

  controls.ready(prevTrack, togglePlayPause, nextTrack, toggleMute);
  loadOrCueCurrentTrack(m.autoplayData?.autoplay === true);

  //ToDo: Add common code in playback-controls.js for list-player & playback-interaction?
  utils.addListener('.playback-details-control',   'click', scrollPlayerIntoView);
  utils.addListener('.playback-thumbnail-control', 'click', scrollPlayerIntoView);
  utils.addListener('.playback-timer-control',     'click', (event) => m.autoplayToggle.toggle(event));
  document.addEventListener('keydown', documentEventKeyDown);
  
  document.addEventListener('visibilitychange', () =>
  {
    if ((document.visibilityState === 'visible') && (m.settings.user.keepMobileScreenOn))
      screenWakeLock.stateVisible();
  });

  if (m.settings.user.keepMobileScreenOn)
    screenWakeLock.enable(m.settings);
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
        current.snackbarId = showSnackbar('Autoplay blocked, Play to continue', 0, 'play', () => m.player.embedded.playVideo());
      }
      break;
    
    // eslint-disable-next-line no-undef
    case YT.PlayerState.ENDED:
      playbackTimer.stop(true);
      advanceToNextTrack(m.settings.user.autoplay);
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
  m.player.setDuration(Math.round(event.target.getDuration()));

  if (m.firstStatePlaying)
  {
    m.firstStatePlaying = false;
    m.autoplayData      = null;
    
    setTimeout(() =>
    {
      if (m.settings.user.autoplay && controls.isPlaying() && (window.pageYOffset < 1))
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
        update((m.player.embedded.getCurrentTime() * 1000), m.player.getDuration());
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
