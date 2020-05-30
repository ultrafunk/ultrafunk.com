//
// Play all YouTube and SoundCloud embeds on a WordPress page with playback control UI
//
// https://ultrafunk.com
//


import * as debugLogger      from '../common/debuglogger.js?ver=1.6.5';
import * as mediaPlayer      from './mediaplayer.js?ver=1.6.5';
import * as controls         from './playback-controls.js?ver=1.6.5';
import * as eventLogger      from './eventlogger.js?ver=1.6.5';


export {
// Constants
  EVENT,
// Functions
  init,
  setConfig,
  setEventHandlers,
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
const eventHandlers   = {};
let eventCallback     = null;
let playersReadyCount = 0;
let currentPlayer     = 0;

const moduleConfig = {
  youTubeIframeIdRegEx:    null,
  soundCloudIframeIdRegEx: null,
  entriesSelector:         'article',
  entryTitleData:          'data-entry-title',
  playbackControlsId:      'playback-controls',
  autoPlay:                true,
  autoScroll:              true,
  updateTimerInterval:     200,  // Milliseconds between each callback call
  timeRemainingWarning:    true, // Flash Play / Pause button
  timeRemainingSeconds:    30,   // Seconds left when warning is shown
};

// Events for event handlers and / or callback
const EVENT = {
  LOADING:              10,
  READY:                20,
  MEDIA_PLAYING:        30,
  MEDIA_PAUSED:         40,
  MEDIA_ENDED:          50,
  MEDIA_TIMER:          60,
  MEDIA_TIME_REMAINING: 70,
  GOTO_MEDIA:           80,
  CONTINUE_AUTOPLAY:    90,
  RESUME_AUTOPLAY:      100,
  AUTOPLAY_BLOCKED:     110,
  PLAYBACK_BLOCKED:     120,
  MEDIA_UNAVAILABLE:    130,
};


// ************************************************************************************************
// 
// ************************************************************************************************

function init(callback = null)
{
  eventCallback = callback;
  controls.init(moduleConfig.playbackControlsId);
  initYouTubeAPI();
  initSoundCloudAPI();
}

function setConfig(setConfig = null)
{
  if (setConfig !== null)
  {
    Object.entries(setConfig).forEach(([key, value]) => moduleConfig[key] = value);
  //debug.log(config);
  }
}

function setEventHandlers(setEventHandlers = null)
{
  if (setEventHandlers !== null)
  {
    Object.entries(setEventHandlers).forEach(([key, value]) => eventHandlers[key] = value);
  //debug.log(eventHandlers);
  }
}

function callEventHandler(playbackEvent, eventData = null)
{
  if (playbackEvent in eventHandlers)
    eventHandlers[playbackEvent](playbackEvent, eventData);
  else if (eventCallback !== null)
    eventCallback(playbackEvent, eventData);
  else
    debug.warn(`callEventHandler(): No event handler or event callback found for: EVENT.${debug.getObjectKeyForValue(EVENT, playbackEvent)} (${playbackEvent})`);
}


// ************************************************************************************************
// Find, register and init all embedder media players
// ************************************************************************************************

function getAllEmbeddedPlayers()
{
  const entries = document.querySelectorAll(moduleConfig.entriesSelector);

  entries.forEach(entry => 
  {
    const postId     = entry.id;
    const entryTitle = entry.getAttribute(moduleConfig.entryTitleData);
    const iframes    = entry.querySelectorAll('iframe');

    iframes.forEach(iframe =>
    {
      const iframeId = iframe.id;
      let   player   = {};

      if (moduleConfig.youTubeIframeIdRegEx.test(iframeId)) 
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
      else if (moduleConfig.soundCloudIframeIdRegEx.test(iframeId))
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

function updateMediaPlayersReadyProgress()
{
  playersReadyCount++;

  if (playersReadyCount >= getNumPlayers())
  {
    controls.ready(prevClick, togglePlayPause, nextClick, getNumTracks());
    callEventHandler(EVENT.READY);
    callEventHandler(EVENT.RESUME_AUTOPLAY);
  }
  else
  {
    callEventHandler(EVENT.LOADING);
  }
}


// ************************************************************************************************
// Playback controls click handlers + state
// ************************************************************************************************

function togglePlayPause()
{
  if (controls.isPlaying())
  {
    controls.updatePauseState();
    getMediaPlayer().pause();
  }
  else
  {
    controls.updatePlayState(getPlaybackStatus());
    getMediaPlayer().play(onEmbeddedPlayerErrorCallback);
  }
}

function prevClick(event)
{
  debug.log(`prevClick() - prevTrack: ${getCurrentTrack() - 1} - numTracks: ${getNumTracks()} - event: ${((event !== null) ? event.type : 'null')}`);

  if (getCurrentTrack() > 0)
    getMediaPlayer().getPositionCallback(prevClickCallback);
}

function prevClickCallback(positionMilliseconds)
{
//debug.log(`prevClickCallback() - positionMilliseconds: ${positionMilliseconds} - currentTrack: ${getCurrentTrack()} - currentPlayer: ${getCurrentPlayer()}`);

  if (positionMilliseconds > 3000)
  {
    getMediaPlayer().seekTo(0);
    playbackTimer.updateCallback(0);
  }
  else
  {
    if (getCurrentTrack() > 1)
      getMediaPlayer().stop();
    
    if (mediaPrev(controls.isPlaying()))
      controls.updatePrevState(getPlaybackStatus());
  }
}

function nextClick(event)
{
  debug.log(`nextClick() - nextTrack: ${getCurrentTrack() + 1} - numTracks: ${getNumTracks()} - event: ${((event !== null) ? event.type : 'null')}`);

  if ((getCurrentTrack() + 1) <= getNumTracks())
  {
    getMediaPlayer().stop();
    
    //Called from UI event handler for button or keyboard if (event !== null)
    if ((event !== null) || (moduleConfig.autoPlay))
    {
      if (mediaNext(controls.isPlaying()))
        controls.updateNextState(getPlaybackStatus());
    }
    else
    {
      controls.updatePauseState();
    }
  }
  else if (event === null)
  {
    controls.updatePauseState();
    
    if (moduleConfig.autoPlay)
      callEventHandler(EVENT.CONTINUE_AUTOPLAY);
    else
      getMediaPlayer().stop();
  }
}

function playTrack(track, playMedia = true)
{
  debug.log(`playTrack(): ${track} - ${playMedia}`);

  if ((playMedia === true) && (controls.isPlaying() === false))
  {
    // Reset eventlog to enable check for autoplay block
    eventLog.clear();
    eventLog.add(eventLogger.SOURCE.ULTRAFUNK, Date.now(), eventLogger.EVENT.RESUME_AUTOPLAY, null);
    
    // Only supports jumping FORWARD for now...
    if (mediaTrack(track, playMedia))
      controls.updateNextState(getPlaybackStatus());
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
    {
      controls.updatePlayState(getPlaybackStatus());
      callEventHandler(EVENT.MEDIA_PLAYING, { postId: getMediaPlayer().getPostId() });
    }
    else if (syncState === SYNCSTATE.PAUSE)
    {
      controls.updatePauseState();
      callEventHandler(EVENT.MEDIA_PAUSED, { postId: getMediaPlayer().getPostId() });      
    }
  }
  else
  {
    if (nextPlayer !== -1)
    {
      const prevPlayer = getCurrentPlayer();
      
      getMediaPlayer().stop();
      setCurrentPlayer(nextPlayer);

      if (nextPlayer > prevPlayer)
        controls.updateNextState(getPlaybackStatus());
      else
        controls.updatePrevState(getPlaybackStatus());
      
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

function getPlaybackStatus()
{
  return {
    currentTrack: getCurrentTrack(),
    numTracks:    getNumTracks(),
    artist:       getMediaPlayer().getArtist(),
    title:        getMediaPlayer().getTitle(),
  };
}

function getStatus()
{
  return {
    isPlaying:    controls.isPlaying(),
    currentTrack: getCurrentTrack(),
    numTracks:    getNumTracks(),
    postId:       getMediaPlayer().getPostId(),
    iframeId:     getMediaPlayer().getIframeId(),
  };
}

function isValidTrack(track)
{
  return (((track > 0) && (track <= getNumTracks())) ? true : false);
}


// ************************************************************************************************
// Media track navigation
// ************************************************************************************************

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
  callEventHandler(EVENT.GOTO_MEDIA, { postId: getMediaPlayer().getPostId(), iframeId: getMediaPlayer().getIframeId() });
  
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
  controls.updatePauseState();
  callEventHandler(EVENT.MEDIA_UNAVAILABLE, getPlayerErrorVars(player, mediaUrl));
}

function getPlayerErrorVars(player, mediaUrl)
{
  const artist = player.getArtist() || 'N/A';
  const title  = player.getTitle()  || 'N/A';

  return {
    currentTrack: (getPlayerIndexFromUid(player.getUid()) + 1),
    numTracks:    getNumTracks(),
    postId:       player.getPostId(),
    mediaTitle:   `${artist} - ${title}`,
    mediaUrl:     mediaUrl,
  };
}


// ************************************************************************************************
// Playback timer and event handling
// ************************************************************************************************

const playbackTimer = (() =>
{
  let timerId             = -1;
  let lastPosMilliseconds = 0;

  return {
    start,
    stop,
    updateCallback,
  };
  
  function start()
  {
    stop(false);
    timerId = setInterval(update, moduleConfig.updateTimerInterval);
  }
  
  function stop(playbackEnded = false)
  {
    if (timerId !== -1)
    {
      clearInterval(timerId);
      timerId = -1;
    }
    
    if (playbackEnded)
    {
      updateCallback(0);
      callEventHandler(EVENT.MEDIA_ENDED);
    }
  
    resetTimeRemainingWarning();
  }
  
  function update()
  {
    getMediaPlayer().getPositionCallback(updateCallback);
  }
  
  function updateCallback(posMilliseconds)
  {
    const duration = getMediaPlayer().getDuration();
    
    controls.setTimer(Math.round(posMilliseconds / 1000), duration);
    updateTimeRemainingWarning(posMilliseconds, duration);
    callEventHandler(EVENT.MEDIA_TIMER, { currentTrack: getCurrentTrack(), position: posMilliseconds, duration: duration });
  }
  
  function resetTimeRemainingWarning()
  {
    lastPosMilliseconds = 0;
    controls.stopBlinkPlayPause();
  }
  
  function updateTimeRemainingWarning(posMilliseconds, duration)
  {
    if ((moduleConfig.autoPlay === false) && moduleConfig.timeRemainingWarning)
    {
      if ((posMilliseconds > 0) && (duration > 0))
      {
        const deltaTime = posMilliseconds - lastPosMilliseconds;
        
        if ((deltaTime > 900) || (deltaTime < 0))
        {
          const timeRemainingSeconds = Math.round(duration - (posMilliseconds / 1000));
          lastPosMilliseconds        = posMilliseconds;
          
          if (timeRemainingSeconds <= moduleConfig.timeRemainingSeconds)
          {
            controls.blinkPlayPause();
            callEventHandler(EVENT.MEDIA_TIME_REMAINING, { timeRemainingSeconds: timeRemainingSeconds });
          }
          else
          {
            controls.stopBlinkPlayPause();
          }
        }
      }
    }
  }
})();


// ************************************************************************************************
// YouTube init and event functions
// https://developers.google.com/youtube/iframe_api_reference
// ************************************************************************************************

function initYouTubeAPI()
{
  debug.log('initYouTubeAPI()');
  callEventHandler(EVENT.LOADING);

  let tag = document.createElement('script');
  tag.id = 'youtube-iframe-api';
  tag.src = 'https://www.youtube.com/iframe_api';
  let firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
  
window.onYouTubeIframeAPIReady = function()
{
  debug.log('onYouTubeIframeAPIReady()');
  callEventHandler(EVENT.LOADING);

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
        playbackTimer.start();

        if (getMediaPlayer(playerIndex).setArtistTitleFromServer(event.target.getVideoData().title))
          controls.setDetails(getPlaybackStatus());
      }
      break;

    case YT.PlayerState.PAUSED: // eslint-disable-line no-undef
      debug.log('onYouTubePlayerStateChange: PAUSED');
      syncPlayersState(getPlayerIndexFromUid(event.target.f.id), SYNCSTATE.PAUSE);
      playbackTimer.stop(false);
      break;

    case YT.PlayerState.ENDED: // eslint-disable-line no-undef
      debug.log('onYouTubePlayerStateChange: ENDED');
      playbackTimer.stop(true);
      nextClick(null);
      break;

    default:
      {
        debug.log('onYouTubePlayerStateChange: UNSTARTED (-1)');
        
        if (eventLog.ytAutoPlayBlocked(event.target.f.id, 3000))
        {
          controls.updatePauseState();
          callEventHandler(EVENT.AUTOPLAY_BLOCKED);
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
  callEventHandler(EVENT.LOADING);
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
    playbackTimer.start();
  });  
}

function soundCloudPlaybackBlocked(callbackEvent, callbackData = null)
{
  debug.log(`soundCloudPlaybackBlocked(): ${debug.getObjectKeyForValue(EVENT, callbackEvent)}`);
  controls.updatePauseState();
  playbackTimer.stop(false);
  callEventHandler(callbackEvent, callbackData);
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
          playbackTimer.stop(false);
        }
      });    
    }
  }
}

function onSoundCloudPlayerEventFinish(event)
{
  debug.log('onSoundCloudPlayerEvent: FINISH / ENDED');
  eventLog.add(eventLogger.SOURCE.SOUNDCLOUD, Date.now(), eventLogger.EVENT.STATE_ENDED, event.soundId);
  playbackTimer.stop(true);
  nextClick(null);
}

function onSoundCloudPlayerEventError()
{
  this.getCurrentSound(soundObject =>
  {
    const player = getMediaPlayer(getPlayerIndexFromUid(soundObject.id));
    debug.log(`onSoundCloudPlayerEvent: ERROR for track: ${getPlayerIndexFromUid(soundObject.id) + 1}. ${player.getArtist()} - ${player.getTitle()} - [${player.getUid()} / ${player.getIframeId()}]`);
    player.setPlayable(false);
  });
}
