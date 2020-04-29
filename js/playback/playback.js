//
// Play all YouTube and SoundCloud embeds on a WordPress page with playback control UI
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=104';
import * as mediaPlayer from './mediaplayer.js?ver=104';
import * as eventLogger from './eventlogger.js?ver=104';


export {
// Constants
  EVENT,
// Functions
  init,
  setConfig,
  togglePlayPause,
  prevClick,
  nextClick,
  playTrack,
  getStatus,
  resumeAutoPlay,
};


const debug           = debugLogger.getInstance('playback');
const mediaPlayers    = [];
const eventLog        = new eventLogger.Playback(10);
let eventCallback     = null;
let playersReadyCount = 0;
let currentPlayer     = 0;

const config = {
  youTubeIframeIdRegEx:    null,
  soundCloudIframeIdRegEx: null,
  entriesSelector:         'article',
  entryTitleSelector:      'h2.entry-title',
  autoPlay:                true,
  autoScroll:              true,
  updateTimerInterval:     200,  // Milliseconds between each callback call
  timeRemainingWarning:    true, // Flash Play / Pause button
  timeRemainingSeconds:    30,   // Seconds left when warning is shown
};

// Callback events for interaction.js
const EVENT = {
  READY:                10,
  MEDIA_PLAYING:        20,
  MEDIA_TIME_REMAINING: 30,
  MEDIA_ENDED:          40,
  SHOW_MEDIA:           50,
  CONTINUE_AUTOPLAY:    60,
  RESUME_AUTOPLAY:      70,
  AUTOPLAY_BLOCKED:     80,
  PLAYBACK_BLOCKED:     90,
  MEDIA_UNAVAILABLE:    100,
};

// Page header playback controls
const STATE = {
  DISABLED: 'state-disabled',
  ENABLED:  'state-enabled',
  PLAY:     'state-play',
  PAUSE:    'state-pause',
  STOP:     'state-stop',
};

const controls = {
  progress:   { div: null, state: STATE.ENABLED  },
  prevTrack:  { div: null, state: STATE.DISABLED },
  playPause:  { div: null, state: STATE.PLAY     },
  nextTrack:  { div: null, state: STATE.DISABLED },
  details:    { div: null, state: STATE.DISABLED },
};


// ************************************************************************************************
// Find, register and init all embedder media players
// ************************************************************************************************

function init(callback)
{
  eventCallback = callback;
  initControls();
  initYouTubeAPI();
  initSoundCloudAPI();
}

function setConfig(changeConfig = null)
{
  if (changeConfig !== null)
  {
    Object.entries(changeConfig).forEach(([key, value]) => config[key] = value);
    debug.log(config);
  }
}

function getAllEmbeddedPlayers()
{
  const entries = document.querySelectorAll(config.entriesSelector);

  entries.forEach(entry => 
  {
    const postId     = entry.id;
    const entryTitle = entry.querySelector(config.entryTitleSelector).textContent;
    const iframes    = entry.querySelectorAll('iframe');

    iframes.forEach(iframe =>
    {
      const iframeId = iframe.id;
      let   player   = {};

      if (config.youTubeIframeIdRegEx.test(iframeId)) 
      {
        const embeddedPlayer = new YT.Player(iframeId, // eslint-disable-line no-undef
        {
          events:
          {
            onReady:       onYouTubePlayerReady,
            onStateChange: onYouTubePlayerStateChange,
            onError:       onYouTubePlayerError,
          }
        });
          
        player = new mediaPlayer.YouTube(postId, iframeId, embeddedPlayer);
      }
      else if (config.soundCloudIframeIdRegEx.test(iframeId))
      {
        /* eslint-disable */
        const embeddedPlayer = SC.Widget(iframeId);

        embeddedPlayer.bind(SC.Widget.Events.READY,  onSoundCloudPlayerEventReady);
        embeddedPlayer.bind(SC.Widget.Events.PLAY,   onSoundCloudPlayerEventPlay);
        embeddedPlayer.bind(SC.Widget.Events.PAUSE,  onSoundCloudPlayerEventPause);
        embeddedPlayer.bind(SC.Widget.Events.FINISH, onSoundCloudPlayerEventFinish);
        embeddedPlayer.bind(SC.Widget.Events.ERROR,  onSoundCloudPlayerEventError);
        /* eslint-enable */

        player = new mediaPlayer.SoundCloud(postId, iframeId, embeddedPlayer, getSoundCloudSoundId(iframe.src));
      }

      player.setArtistTitle(entryTitle);
      mediaPlayers.push(player);
      
      debug.log(player);
    });
  });

  setPropsForSamePostId();
}

function setPropsForSamePostId()
{
  const samePostIds = {};
  
  // Create list of duplicate postIds
  mediaPlayers.forEach((player, index) =>
  {
    samePostIds[player.getPostId()] = samePostIds[player.getPostId()] || [];
    samePostIds[player.getPostId()].push(index);
  });

  // Traverse list and set relevant properties for all items with same postId
  Object.entries(samePostIds).forEach(([postId, indexes]) => // eslint-disable-line no-unused-vars
  {
    if (indexes.length > 1)
      indexes.forEach(index => mediaPlayers[index].setDataSource(mediaPlayer.DATA_SOURCE.GET_FROM_SERVER));
  });
}


// ************************************************************************************************
// Playback controls init
// ************************************************************************************************

function initControls()
{
  const playbackControls = document.getElementById('playback-controls');

  if (playbackControls !== null)
  {
    controls.progress.div  = playbackControls.querySelector('.progress-control');
    controls.playPause.div = playbackControls.querySelector('.play-pause-control');
    controls.prevTrack.div = playbackControls.querySelector('.prev-control');
    controls.nextTrack.div = playbackControls.querySelector('.next-control');
    controls.details.div   = playbackControls.querySelector('.details-control');
  }
}

function updateMediaPlayersProgress()
{
  controls.progress.div.append('.');
}

function updateMediaPlayersReadyProgress()
{
  playersReadyCount++;

  if (playersReadyCount >= getNumPlayers())
  {
    setControlsReady();
    eventCallback(EVENT.READY);
    eventCallback(EVENT.RESUME_AUTOPLAY);
  }
  else
  {
    updateMediaPlayersProgress();
  }
}

function setControlsReady()
{
  setControlState(controls.progress, STATE.DISABLED);
  controls.progress.div.style.display = 'none';
  
  setControlState(controls.playPause, STATE.PLAY);
  controls.playPause.div.style.display = 'inline-block';
  controls.playPause.div.addEventListener('click', togglePlayPause);

  setControlState(controls.prevTrack);
  controls.prevTrack.div.style.display = 'inline-block';
  controls.prevTrack.div.addEventListener('click', prevClick);

  setControlState(controls.nextTrack, ((getNumTracks() > 1) ? STATE.ENABLED : STATE.DISABLED));
  controls.nextTrack.div.style.display = 'inline-block';
  controls.nextTrack.div.addEventListener('click', nextClick);

  setControlState(controls.details, STATE.ENABLED);
  controls.details.div.style.display = 'inline-block';
}

function setControlState(control, state = STATE.DISABLED)
{
  control.div.classList.remove(control.state);
  control.div.classList.add(state);
  control.state = state;
  
  if (state === STATE.PLAY)
    control.div.querySelector('i').textContent = 'play_circle_filled';
  else if (state === STATE.PAUSE)
    control.div.querySelector('i').textContent = 'pause_circle_filled';
}

function setDetailsControl(state)
{
  let artist = '';
  let title  = '';

  if (state !== STATE.STOP)
  {
    artist = getMediaPlayer().getArtist() || ''; // Artist will contain the post title if all else fails
    title  = getMediaPlayer().getTitle()  || '';
  }
    
  controls.details.div.querySelector('.details-artist').textContent = artist;
  controls.details.div.querySelector('.details-title').textContent = title;
}


// ************************************************************************************************
// Playback controls click handlers + state
// ************************************************************************************************

function updatePlayControlsState()
{
  setControlState(controls.playPause, STATE.PAUSE);
  setControlState(controls.prevTrack, STATE.ENABLED);
  setDetailsControl(STATE.PLAY);
}

function updatePauseControlsState()
{
  setControlState(controls.playPause, STATE.PLAY);
}

function togglePlayPause()
{
  if (controls.playPause.state === STATE.PLAY)
  {
    updatePlayControlsState();
    getMediaPlayer().play(onEmbeddedPlayerErrorCallback);
  }
  else
  {
    updatePauseControlsState();
    getMediaPlayer().pause();
  }
}

function isPlaying()
{
  return ((controls.playPause.state === STATE.PAUSE) ? true : false);
}

function prevClick(event)
{
  debug.log(`prevClick() - prevTrack: ${getCurrentTrack() - 1} - numTracks: ${getNumTracks()} - event: ${((event !== null) ? event.type : 'null')}`);

  if (getCurrentTrack() > 0)
    getMediaPlayer().getPositionCallback(prevClickCallback);
}

function updatePrevControlsState()
{
  setDetailsControl(STATE.PLAY);

  if ((isPlaying() === false) && (getCurrentTrack() <= 1))
    setControlState(controls.prevTrack, STATE.DISABLED);
  
  if (getCurrentTrack() < getNumTracks())
    setControlState(controls.nextTrack, STATE.ENABLED);
}

function prevClickCallback(positionMilliseconds)
{
//debug.log(`prevClickCallback() - positionMilliseconds: ${positionMilliseconds} - currentTrack: ${getCurrentTrack()} - currentPlayer: ${getCurrentPlayer()}`);

  if (positionMilliseconds > 3000)
  {
    getMediaPlayer().seekTo(0);
    updatePlaybackTimerCallback(0);
  }
  else
  {
    if (getCurrentTrack() > 1)
      getMediaPlayer().stop();
    
    if (mediaPrev(isPlaying()))
      updatePrevControlsState();
  }
}

function updateNextControlsState()
{
  setDetailsControl(STATE.PLAY);
  setControlState(controls.prevTrack, STATE.ENABLED);
  
  if (getCurrentTrack() >= getNumTracks())
    setControlState(controls.nextTrack, STATE.DISABLED);
}

function nextClick(event)
{
  debug.log(`nextClick() - nextTrack: ${getCurrentTrack() + 1} - numTracks: ${getNumTracks()} - event: ${((event !== null) ? event.type : 'null')}`);

  if ((getCurrentTrack() + 1) <= getNumTracks())
  {
    getMediaPlayer().stop();
    
    //Called from UI event handler for button or keyboard if (event !== null)
    if ((event !== null) || (config.autoPlay))
    {
      if(mediaNext(isPlaying()))
        updateNextControlsState();
    }
    else
    {
      updatePauseControlsState();
    }
  }
  else if (event === null)
  {
    setControlState(controls.playPause, STATE.PLAY);
    
    if (config.autoPlay)
      eventCallback(EVENT.CONTINUE_AUTOPLAY);
    else
      getMediaPlayer().stop();
  }
}

function playTrack(track, playMedia = true)
{
  debug.log(`playTrack(): ${track} - ${playMedia}`);

  if ((playMedia === true) && (isPlaying() === false))
  {
    // Reset eventlog to enable check for autoplay block
    eventLog.clear();
    eventLog.add(eventLogger.SOURCE.ULTRAFUNK, Date.now(), eventLogger.EVENT.RESUME_AUTOPLAY, null);
    
    // Only supports jumping FORWARD for now...
    if (mediaTrack(track, playMedia))
      updateNextControlsState();
  }
}

function resumeAutoPlay()
{
  debug.log('resumeAutoPlay()');
  eventLog.add(eventLogger.SOURCE.ULTRAFUNK, Date.now(), eventLogger.EVENT.RESUME_AUTOPLAY, null);
  togglePlayPause();
}


// ************************************************************************************************
// Playback controls and embedded players state sync
// ************************************************************************************************

const SYNCSTATE = {
  PLAY:  1,
  PAUSE: 2,
};

let syncPlayersState = function syncPlayersStateRecursive(nextPlayer, syncState)
{
  debug.log(`syncPlayersState() - prevPlayer: ${getCurrentPlayer()} - nextPlayer: ${nextPlayer} - syncState: ${debug.getObjectKeyForValue(SYNCSTATE, syncState)}`);
  
  if (getCurrentPlayer() === nextPlayer)
  {
    if (syncState === SYNCSTATE.PLAY)
      updatePlayControlsState();
    else if (syncState === SYNCSTATE.PAUSE)
      updatePauseControlsState();
  }
  else
  {
    if (nextPlayer !== -1)
    {
      const prevPlayer = getCurrentPlayer();
      
      getMediaPlayer().stop();
      setCurrentPlayer(nextPlayer);

      if (nextPlayer > prevPlayer)
        updateNextControlsState();
      else
        updatePrevControlsState();
      
      syncPlayersStateRecursive(nextPlayer, syncState);
    }
  }
};


// ************************************************************************************************
// Playback and embedded player utils
// ************************************************************************************************

function getCurrentPlayer()                    { return currentPlayer;          }
function setCurrentPlayer(nextPlayer)          { currentPlayer = nextPlayer;    }
function getMediaPlayer(index = currentPlayer) { return mediaPlayers[index];    }
function getNumPlayers()                       { return mediaPlayers.length;    }
function getCurrentTrack()                     { return getCurrentPlayer() + 1; }
function getNumTracks()                        { return mediaPlayers.length;    }

function getPlayerIndexFromUid(uId)
{
  const index = mediaPlayers.findIndex(player => player.getUid() === uId);
  return (((index !== -1) && (index <= mediaPlayers.length)) ? index : -1);
}

function getStatus()
{
  return {
    currentTrack: getCurrentTrack(),
    numTracks:    getNumTracks(),
    isPlaying:    isPlaying(),
    postId:       getMediaPlayer().getPostId(),
    iframeId:     getMediaPlayer().getIframeId(),
  };
}

function isValidTrack(track)
{
  return (((track > 0) && (track <= getNumTracks())) ? true : false);
}


//
// Media navigation
//

function mediaPrev(playMedia)
{
  if (currentPlayer > 0)
  {
    currentPlayer--;
    mediaGotoTrack(playMedia);
    return true;
  }
  
  return false;
}

function mediaNext(playMedia)
{
  currentPlayer++;
  
  if (currentPlayer < getNumPlayers())
  {
    mediaGotoTrack(playMedia);
    return true;
  }
  
  return false;
}

// Only supports jumping FORWARD for now...
function mediaTrack(track, playMedia)
{
  if (isValidTrack(track))
  {
    currentPlayer = track - 1;
    mediaGotoTrack(playMedia);
    return true;
  }

  return false;
}

function mediaGotoTrack(playMedia)
{
  eventCallback(EVENT.SHOW_MEDIA, { postId: getMediaPlayer().getPostId(), iframeId: getMediaPlayer().getIframeId() });
  
  if (playMedia)
    getMediaPlayer().play(onEmbeddedPlayerErrorCallback);
}


// ************************************************************************************************
// Embedded player playback errors
// ************************************************************************************************

function onEmbeddedPlayerErrorCallback(player, mediaUrl)
{
  debug.log('onEmbeddedPlayerErrorCallback()');
  debug.log(player);

  const eventSource  = (player instanceof mediaPlayer.SoundCloud) ? eventLogger.SOURCE.SOUNDCLOUD : eventLogger.SOURCE.YOUTUBE;

  // Stop the current track if it is not the one we are going to next
  if (getMediaPlayer().getUid() !== player.getUid())
    getMediaPlayer().stop();
  
  eventLog.add(eventSource, Date.now(), eventLogger.EVENT.PLAYER_ERROR, player.getUid());
  updatePauseControlsState();
  eventCallback(EVENT.MEDIA_UNAVAILABLE, getPlayerErrorVars(player, mediaUrl));
}

function getPlayerErrorVars(player, mediaUrl)
{
  const artist = player.getArtist() || 'N/A';
  const title  = player.getTitle()  || 'N/A';

  return {
    currentTrack: (getPlayerIndexFromUid(player.getUid()) + 1),
    numTracks:    getNumTracks(),
    postId:       player.getPostId(),
    mediaTitle:   artist + ' - ' + title,
    mediaUrl:     mediaUrl,
  };
}


// ************************************************************************************************
// Playback timer and event handling
// ************************************************************************************************

let playbackTimerId     = -1;
let lastPosMilliseconds = 0;

function startPlaybackTimer()
{
  stopPlaybackTimer(false);
  playbackTimerId = setInterval(updatePlaybackTimer, config.updateTimerInterval);
}

function stopPlaybackTimer(playbackEnded = false)
{
  if (playbackTimerId !== -1)
  {
    clearInterval(playbackTimerId);
    playbackTimerId = -1;
  }
  
  if (playbackEnded)
  {
    updatePlaybackTimerCallback(0);
    eventCallback(EVENT.MEDIA_ENDED);
  }

  resetTimeRemainingWarning();
}

function updatePlaybackTimer()
{
  getMediaPlayer().getPositionCallback(updatePlaybackTimerCallback);
}

function updatePlaybackTimerCallback(posMilliseconds)
{
  const duration = getMediaPlayer().getDuration();
  
  updateTimeRemainingWarning(posMilliseconds, duration);
  eventCallback(EVENT.MEDIA_PLAYING, { currentTrack: getCurrentTrack(), position: posMilliseconds, duration: duration });
}

function resetTimeRemainingWarning()
{
  lastPosMilliseconds = 0;
  controls.playPause.div.classList.remove('time-remaining-warning');
}

function updateTimeRemainingWarning(posMilliseconds, duration)
{
  if ((config.autoPlay === false) && config.timeRemainingWarning)
  {
    if ((posMilliseconds > 0) && (duration > 0))
    {
      const deltaTime = posMilliseconds - lastPosMilliseconds;
      
      if ((deltaTime > 900) || (deltaTime < 0))
      {
        const timeRemainingSeconds = Math.round(duration - (posMilliseconds / 1000));
        lastPosMilliseconds        = posMilliseconds;
        
        if (timeRemainingSeconds <= config.timeRemainingSeconds)
        {
          controls.playPause.div.classList.toggle('time-remaining-warning');
          eventCallback(EVENT.MEDIA_TIME_REMAINING, { timeRemainingSeconds: timeRemainingSeconds });
        }
        else
        {
          controls.playPause.div.classList.remove('time-remaining-warning');
        }
      }
    }
  }
}


// ************************************************************************************************
// YouTube init and event functions
// https://developers.google.com/youtube/iframe_api_reference
// ************************************************************************************************

function initYouTubeAPI()
{
  debug.log('initYouTubeAPI()');
  updateMediaPlayersProgress();
  
  let tag = document.createElement('script');
  tag.id = 'youtube-iframe-api';
  tag.src = 'https://www.youtube.com/iframe_api';
  let firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
  
window.onYouTubeIframeAPIReady = function()
{
  debug.log('onYouTubeIframeAPIReady()');
  updateMediaPlayersProgress();
  
  //ToDo: THIS SHOULD NOT BE TRIGGERED HERE ONLY?
  getAllEmbeddedPlayers();
};

function onYouTubePlayerReady()
{
  debug.log('onYouTubePlayerReady()');
  updateMediaPlayersReadyProgress();
}

function onYouTubePlayerStateChange(event)
{
  eventLog.add(eventLogger.SOURCE.YOUTUBE, Date.now(), event.data, event.target.f.id);
  
  switch (event.data)
  {
    case YT.PlayerState.BUFFERING: // eslint-disable-line no-undef
      debug.log('onYouTubePlayerStateChange: BUFFERING');
      break;

    case YT.PlayerState.CUED: // eslint-disable-line no-undef
      debug.log('onYouTubePlayerStateChange: CUED');
      break;

    case YT.PlayerState.PLAYING: // eslint-disable-line no-undef
      {
        debug.log('onYouTubePlayerStateChange: PLAYING');
        
        const playerIndex = getPlayerIndexFromUid(event.target.f.id);

        // Call order is important on play events for state handling: Always sync first!
        syncPlayersState(playerIndex, SYNCSTATE.PLAY);
        getMediaPlayer(playerIndex).setDuration(Math.round(event.target.getDuration()));
        startPlaybackTimer();

        if(getMediaPlayer(playerIndex).setArtistTitleFromServer(null, event.target.getVideoData().title))
          setDetailsControl(STATE.PLAY);
      }
      break;

    case YT.PlayerState.PAUSED: // eslint-disable-line no-undef
      debug.log('onYouTubePlayerStateChange: PAUSED');
      syncPlayersState(getPlayerIndexFromUid(event.target.f.id), SYNCSTATE.PAUSE);
      stopPlaybackTimer(false);
      break;

    case YT.PlayerState.ENDED: // eslint-disable-line no-undef
      debug.log('onYouTubePlayerStateChange: ENDED');
      stopPlaybackTimer(true);
      nextClick(null);
      break;

    default:
      {
        debug.log('onYouTubePlayerStateChange(): UNSTARTED (-1)');
        
        if (eventLog.ytAutoPlayBlocked(event.target.f.id, 3000))
        {
          updatePauseControlsState();
          eventCallback(EVENT.AUTOPLAY_BLOCKED);
        }
      }
  }
}

function onYouTubePlayerError(event)
{
  debug.log('onYouTubePlayerError: ' + event.data);
  const player = getMediaPlayer(getPlayerIndexFromUid(event.target.f.id));

  player.setPlayable(false);
  onEmbeddedPlayerErrorCallback(player, event.target.getVideoUrl());
}


// ************************************************************************************************
// SoundCloud init and event functions
// https://developers.soundcloud.com/docs/api/html5-widget
// ************************************************************************************************

function initSoundCloudAPI()
{
  debug.log('initSoundCloudAPI()');
  updateMediaPlayersProgress();
}

function onSoundCloudPlayerEventReady()
{
  debug.log('onSoundCloudPlayerEventReady()');
  updateMediaPlayersReadyProgress();
}

function getSoundCloudSoundId(iframeSrc)
{
  if (iframeSrc !== undefined)
  {
    const iframeUrl = new URL(decodeURIComponent(iframeSrc));
    const trackUrl  = iframeUrl.searchParams.get('url');
    
    if (trackUrl !== null)
    {
      const trackUrlParts = trackUrl.split('/');
      const tracksString  = 'tracks'.toUpperCase();

      for (let i = 0; i < trackUrlParts.length; i++)
      {
        if (trackUrlParts[i].toUpperCase() === tracksString)
          return parseInt(trackUrlParts[i + 1]);
      }
    }
  }
  
  return null;
}

function onSoundCloudPlayerEventPlay(event)
{
  debug.log('onSoundCloudPlayerEvent: PLAY');
  eventLog.add(eventLogger.SOURCE.SOUNDCLOUD, Date.now(), eventLogger.EVENT.STATE_PLAYING, event.soundId);
  
  // Call order is important on play events for state handling: Always sync first!
  syncPlayersState(getPlayerIndexFromUid(event.soundId), SYNCSTATE.PLAY);

  getMediaPlayer().getEmbeddedPlayer().getDuration(durationMilliseconds =>
  {
    getMediaPlayer(getPlayerIndexFromUid(event.soundId)).setDuration(Math.round(durationMilliseconds / 1000));
    startPlaybackTimer();
  });  
}

function soundCloudPlaybackBlocked(callbackEvent, callbackData = null)
{
  debug.log(`soundCloudPlaybackBlocked(): ${debug.getObjectKeyForValue(EVENT, callbackEvent)}`);
  updatePauseControlsState();
  stopPlaybackTimer(false);
  eventCallback(callbackEvent, callbackData);
}

function onSoundCloudPlayerEventPause(event)
{
  debug.log('onSoundCloudPlayerEvent: PAUSE');
  eventLog.add(eventLogger.SOURCE.SOUNDCLOUD, Date.now(), eventLogger.EVENT.STATE_PAUSED, event.soundId);
  
  if (eventLog.scAutoPlayBlocked(event.soundId, 3000))
  {
    soundCloudPlaybackBlocked(EVENT.AUTOPLAY_BLOCKED);
  }
  else if (eventLog.scWidgetPlayBlocked(event.soundId, 30000))
  {
    soundCloudPlaybackBlocked(EVENT.PLAYBACK_BLOCKED, { currentTrack: (getPlayerIndexFromUid(event.soundId) + 1), numTracks: getNumTracks() });
  }
  else
  {
    // Only sync state if we get pause events on the same (current) player
    if (getMediaPlayer().getUid() === event.soundId)
    {
      getMediaPlayer().getEmbeddedPlayer().getPosition(positionMilliseconds =>
      {
        if (positionMilliseconds > 0)
        {
          syncPlayersState(getPlayerIndexFromUid(event.soundId), SYNCSTATE.PAUSE);
          stopPlaybackTimer(false);
        }
      });    
    }
  }
}

function onSoundCloudPlayerEventFinish(event)
{
  debug.log('onSoundCloudPlayerEvent: FINISH / ENDED');
  eventLog.add(eventLogger.SOURCE.SOUNDCLOUD, Date.now(), eventLogger.EVENT.STATE_ENDED, event.soundId);
  stopPlaybackTimer(true);
  nextClick(null);
}

function onSoundCloudPlayerEventError()
{
  this.getCurrentSound(soundObject =>
  {
    const player = getMediaPlayer(getPlayerIndexFromUid(soundObject.id));
    debug.log(`onSoundCloudPlayerEvent: ERROR ${player.getIframeId()} - track: ${getPlayerIndexFromUid(soundObject.id) + 1} (${player.getArtist()})`);
    player.setPlayable(false);
  });
}
