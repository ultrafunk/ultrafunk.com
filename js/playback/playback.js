//
// Play all YouTube and SoundCloud embeds on a WordPress page with playback control UI
//
// https://ultrafunk.com
//


import * as debugLogger      from '../common/debuglogger.js?ver=1.7.2';
import * as mediaPlayer      from './mediaplayer.js?ver=1.7.2';
import * as controls         from './playback-controls.js?ver=1.7.2';
import * as eventLogger      from './eventlogger.js?ver=1.7.2';


export {
// Constants
  EVENT,
// Functions
  init,
  setConfig,
  setSettings,
  setEventHandlers,
  togglePlayPause,
  prevClick,
  nextClick,
  toggleMute,
  jumpToTrack,
  getStatus,
  resumeAutoPlay,
};


const debug           = debugLogger.getInstance('playback');
const eventLog        = new eventLogger.Playback(10);
const eventHandlers   = {};
let eventCallback     = null;
let playersReadyCount = 0;

const moduleConfig = {
  youTubeIframeIdRegEx:    null,
  soundCloudIframeIdRegEx: null,
  entriesSelector:         'article',
  entryTitleData:          'data-entry-title',
  playbackControlsId:      'playback-controls',
  updateTimerInterval:     200,  // Milliseconds between each timer event
};

const settings = {
  autoPlay:             true,
  masterVolume:         mediaPlayer.DEFAULT.VOLUME_MAX,
  masterMute:           false,
  timeRemainingWarning: true, // Flash Play / Pause button
  timeRemainingSeconds: 30,   // Seconds left when warning is shown
};

// Events for event handlers and / or callback
const EVENT = {
  LOADING:              10,
  READY:                20,
  MEDIA_PLAYING:        30,
  MEDIA_PAUSED:         40,
  MEDIA_MUTED:          50,
  MEDIA_ENDED:          60,
  MEDIA_TIMER:          70,
  MEDIA_TIME_REMAINING: 80,
  MEDIA_SHOW:           90,
  CONTINUE_AUTOPLAY:    100,
  RESUME_AUTOPLAY:      110,
  AUTOPLAY_BLOCKED:     120,
  PLAYBACK_BLOCKED:     130,
  MEDIA_UNAVAILABLE:    140,
};


// ************************************************************************************************
// Init, config, settings and event handlers
// ************************************************************************************************

function init(callback = null)
{
  eventCallback = callback;
  controls.init(moduleConfig.playbackControlsId);
  initYouTubeAPI();
  initSoundCloudAPI();
}

function setObjectProps(source = null, dest = null)
{
  if ((source !== null) && (dest !== null))
    Object.entries(source).forEach(([key, value]) => dest[key] = value);
}

function setConfig(configProps = null)          { setObjectProps(configProps, moduleConfig);    }
function setSettings(settingsProps = null)      { setObjectProps(settingsProps, settings);      }
function setEventHandlers(handlersProps = null) { setObjectProps(handlersProps, eventHandlers); }

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
      players.getMediaPlayers().push(player);
      
      debug.log(player);
    });
  });

  setPropsForSamePostId();
}

function setPropsForSamePostId()
{
  const mediaPlayers = players.getMediaPlayers();
  const samePostIds  = {};

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

function updateMediaPlayersReady()
{
  playersReadyCount++;

  if (playersReadyCount >= players.getNumTracks())
  {
    controls.ready(prevClick, togglePlayPause, nextClick, toggleMute, players.getNumTracks(), settings.masterMute);
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
    players.currentPlayer.pause();
  }
  else
  {
    controls.updatePlayState(players.getStatus());
    players.currentPlayer.play(onEmbeddedPlayerErrorCallback);
  }
}

function prevClick(event)
{
  debug.log(`prevClick() - prevTrack: ${players.getCurrentTrack() - 1} - numTracks: ${players.getNumTracks()} - event: ${((event !== null) ? event.type : 'null')}`);

  if (players.getCurrentTrack() > 0)
    players.currentPlayer.getPositionCallback(prevClickCallback);
}

function prevClickCallback(positionMilliseconds)
{
//debug.log(`prevClickCallback() - positionMilliseconds: ${positionMilliseconds} - currentTrack: ${getCurrentTrack()} - currentPlayer: ${getCurrentPlayer()}`);

  if (positionMilliseconds > 3000)
  {
    players.currentPlayer.seekTo(0);
    playbackTimer.updateCallback(0);
  }
  else
  {
    if (players.getCurrentTrack() > 1)
      players.currentPlayer.stop();
    
    if (players.prevTrack(controls.isPlaying()))
      controls.updatePrevState(players.getStatus());
  }
}

function nextClick(event)
{
  debug.log(`nextClick() - nextTrack: ${players.getCurrentTrack() + 1} - numTracks: ${players.getNumTracks()} - event: ${((event !== null) ? event.type : 'null')}`);

  if ((players.getCurrentTrack() + 1) <= players.getNumTracks())
  {
    players.currentPlayer.stop();
    
    //Called from UI event handler for button or keyboard if (event !== null)
    if ((event !== null) || (settings.autoPlay))
    {
      if (players.nextTrack(controls.isPlaying()))
        controls.updateNextState(players.getStatus());
    }
    else
    {
      controls.updatePauseState();
    }
  }
  else if (event === null)
  {
    controls.updatePauseState();
    
    if (settings.autoPlay)
      callEventHandler(EVENT.CONTINUE_AUTOPLAY);
    else
      players.currentPlayer.stop();
  }
}

function toggleMute()
{
  settings.masterMute = (settings.masterMute === true) ? false : true;
  players.currentPlayer.mute(settings.masterMute);
  controls.updateMuteState(settings.masterMute);
  callEventHandler(EVENT.MEDIA_MUTED, { masterMute: settings.masterMute });
}

function jumpToTrack(track, playMedia = true)
{
  debug.log(`jumpToTrack(): ${track} - ${playMedia}`);

  if ((playMedia === true) && (controls.isPlaying() === false))
  {
    // Reset eventlog to enable check for autoplay block
    eventLog.clear();
    eventLog.add(eventLogger.SOURCE.ULTRAFUNK, Date.now(), eventLogger.EVENT.RESUME_AUTOPLAY, null);
    
    // Only supports jumping FORWARD for now...
    if (players.jumpToTrack(track, playMedia))
      controls.updateNextState(players.getStatus());
  }
}

function resumeAutoPlay()
{
  debug.log('resumeAutoPlay()');
  eventLog.add(eventLogger.SOURCE.ULTRAFUNK, Date.now(), eventLogger.EVENT.RESUME_AUTOPLAY, null);
  togglePlayPause();
}

function getStatus()
{
  return {
    isPlaying:    controls.isPlaying(),
    currentTrack: players.getCurrentTrack(),
    numTracks:    players.getNumTracks(),
    postId:       players.currentPlayer.getPostId(),
    iframeId:     players.currentPlayer.getIframeId(),
  };
}


// ************************************************************************************************
// Playback controls and embedded players state sync
// ************************************************************************************************

const SYNCSTATE = {
  PLAY:  1,
  PAUSE: 2,
};

let syncPlayersState = function syncPlayersStateRecursive(nextPlayerIndex, syncState)
{
  debug.log(`syncPlayersState() - prevPlayerIndex: ${players.getPlayerIndex()} - nextPlayerIndex: ${nextPlayerIndex} - syncState: ${debug.getObjectKeyForValue(SYNCSTATE, syncState)}`);
  
  if (players.getPlayerIndex() === nextPlayerIndex)
  {
    if (syncState === SYNCSTATE.PLAY)
    {
      controls.updatePlayState(players.getStatus());
      callEventHandler(EVENT.MEDIA_PLAYING, { postId: players.currentPlayer.getPostId() });
    }
    else if (syncState === SYNCSTATE.PAUSE)
    {
      controls.updatePauseState();
      callEventHandler(EVENT.MEDIA_PAUSED, { postId: players.currentPlayer.getPostId() });
    }
  }
  else
  {
    if (nextPlayerIndex !== -1)
    {
      const prevPlayerIndex = players.getPlayerIndex();
      
      players.currentPlayer.stop();
      players.setPlayerIndex(nextPlayerIndex);

      if (nextPlayerIndex > prevPlayerIndex)
        controls.updateNextState(players.getStatus());
      else
        controls.updatePrevState(players.getStatus());
      
      syncPlayersStateRecursive(nextPlayerIndex, syncState);
    }
  }
};


// ************************************************************************************************
// MediaPlayers module
// ************************************************************************************************

const players = (() =>
{
  const mediaPlayers = [];
  let playerIndex    = 0;

  return {
    getMediaPlayers()               { return mediaPlayers;                    },
    getPlayerIndex()                { return playerIndex;                     },
    setPlayerIndex(nextPlayerIndex) { playerIndex = nextPlayerIndex;          },
    get currentPlayer()             { return mediaPlayers[playerIndex];       },
    getNumTracks()                  { return mediaPlayers.length;             },
    getCurrentTrack()               { return playerIndex + 1;                 },
    playerFromUid(uId)              { return mediaPlayers[indexFromUid(uId)]; },
    trackFromUid(uId)               { return (indexFromUid(uId) + 1);         },
    indexFromUid,
    getStatus,
    prevTrack,
    nextTrack,
    jumpToTrack,
  };
  
  function indexFromUid(uId)
  {
    return mediaPlayers.findIndex(player => player.getUid() === uId);
  }

  function getStatus()
  {
    return {
      currentTrack: players.getCurrentTrack(),
      numTracks:    players.getNumTracks(),
      artist:       players.currentPlayer.getArtist(),
      title:        players.currentPlayer.getTitle(),
    };
  }

  function isValidTrack(track)
  {
    return ((track > 0) && (track <= players.getNumTracks()));
  }

  function prevTrack(playMedia)
  {
    if (playerIndex > 0)
    {
      playerIndex--;
      playTrack(playMedia);
      return true;
    }
    
    return false;
  }
  
  function nextTrack(playMedia)
  {
    playerIndex++;
    
    if (playerIndex < players.getNumTracks())
    {
      playTrack(playMedia);
      return true;
    }
    
    return false;
  }
  
  // Only supports jumping FORWARD for now...
  function jumpToTrack(track, playMedia)
  {
    if (isValidTrack(track))
    {
      playerIndex = track - 1;
      playTrack(playMedia);
      return true;
    }
  
    return false;
  }
  
  function playTrack(playMedia)
  {
    callEventHandler(EVENT.MEDIA_SHOW, { postId: players.currentPlayer.getPostId(), iframeId: players.currentPlayer.getIframeId() });
    
    if (playMedia)
      players.currentPlayer.play(onEmbeddedPlayerErrorCallback);
  }
})();


// ************************************************************************************************
// Embedded player playback errors
// ************************************************************************************************

function onEmbeddedPlayerErrorCallback(player, mediaUrl)
{
  debug.log('onEmbeddedPlayerErrorCallback()');
  debug.log(player);

  const eventSource  = (player instanceof mediaPlayer.SoundCloud) ? eventLogger.SOURCE.SOUNDCLOUD : eventLogger.SOURCE.YOUTUBE;

  // Stop the current track if it is not the one we are going to next
  if (players.currentPlayer.getUid() !== player.getUid())
    players.currentPlayer.stop();
  
  eventLog.add(eventSource, Date.now(), eventLogger.EVENT.PLAYER_ERROR, player.getUid());
  controls.updatePauseState();
  callEventHandler(EVENT.MEDIA_UNAVAILABLE, getPlayerErrorVars(player, mediaUrl));
}

function getPlayerErrorVars(player, mediaUrl)
{
  const artist = player.getArtist() || 'N/A';
  const title  = player.getTitle()  || 'N/A';

  return {
    currentTrack: players.trackFromUid(player.getUid()),
    numTracks:    players.getNumTracks(),
    postId:       player.getPostId(),
    mediaTitle:   `${artist} - ${title}`,
    mediaUrl:     mediaUrl,
  };
}


// ************************************************************************************************
// Playback timer and event handling module
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
    players.currentPlayer.getPositionCallback(updateCallback);
  }
  
  function updateCallback(posMilliseconds, duration = 0)
  {
    controls.setTimer(Math.round(posMilliseconds / 1000), duration);
    updateTimeRemainingWarning(posMilliseconds, duration);
    callEventHandler(EVENT.MEDIA_TIMER, { currentTrack: players.getCurrentTrack(), position: posMilliseconds, duration: duration });
  }
  
  function resetTimeRemainingWarning()
  {
    lastPosMilliseconds = 0;
    controls.stopBlinkPlayPause();
  }
  
  function updateTimeRemainingWarning(posMilliseconds, duration)
  {
    if ((settings.autoPlay === false) && settings.timeRemainingWarning)
    {
      if ((posMilliseconds > 0) && (duration > 0))
      {
        const deltaTime = posMilliseconds - lastPosMilliseconds;
        
        if ((deltaTime > 900) || (deltaTime < 0))
        {
          const timeRemainingSeconds = Math.round(duration - (posMilliseconds / 1000));
          lastPosMilliseconds        = posMilliseconds;
          
          if (timeRemainingSeconds <= settings.timeRemainingSeconds)
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
  updateMediaPlayersReady();
}

function onYouTubePlayerStateChange(event)
{
  eventLog.add(eventLogger.SOURCE.YOUTUBE, Date.now(), event.data, event.target.f.id);
  
  switch (event.data)
  {
    case YT.PlayerState.BUFFERING: // eslint-disable-line no-undef
      {
        debug.log('onYouTubePlayerStateChange: BUFFERING');

        const player = players.playerFromUid(event.target.f.id);
        player.setVolume(settings.masterVolume);
        player.mute(settings.masterMute);
      }
      break;

    case YT.PlayerState.CUED: // eslint-disable-line no-undef
      debug.log('onYouTubePlayerStateChange: CUED');
      break;

    case YT.PlayerState.PLAYING: // eslint-disable-line no-undef
      {
        debug.log('onYouTubePlayerStateChange: PLAYING');

        // Call order is important on play events for state handling: Always sync first!
        syncPlayersState(players.indexFromUid(event.target.f.id), SYNCSTATE.PLAY);
        players.currentPlayer.setDuration(Math.round(event.target.getDuration()));
        playbackTimer.start();

        if (players.currentPlayer.setArtistTitleFromServer(event.target.getVideoData().title))
          controls.setDetails(players.getStatus());
      }
      break;

    case YT.PlayerState.PAUSED: // eslint-disable-line no-undef
      debug.log('onYouTubePlayerStateChange: PAUSED');
      syncPlayersState(players.indexFromUid(event.target.f.id), SYNCSTATE.PAUSE);
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
  const player = players.playerFromUid(event.target.f.id);

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
  updateMediaPlayersReady();
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
  syncPlayersState(players.indexFromUid(event.soundId), SYNCSTATE.PLAY);
  
  if (settings.masterMute === false)
    players.currentPlayer.setVolume(settings.masterVolume);
  
  if (settings.masterMute === true)
    players.currentPlayer.mute(settings.masterMute);

  players.currentPlayer.getEmbeddedPlayer().getDuration(durationMilliseconds =>
  {
    players.currentPlayer.setDuration(Math.round(durationMilliseconds / 1000));
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
    soundCloudPlaybackBlocked(EVENT.PLAYBACK_BLOCKED, { currentTrack: players.trackFromUid(event.soundId), numTracks: players.getNumTracks() });
  }
  else
  {
    // Only sync state if we get pause events on the same (current) player
    if (players.currentPlayer.getUid() === event.soundId)
    {
      players.currentPlayer.getEmbeddedPlayer().getPosition(positionMilliseconds =>
      {
        if (positionMilliseconds > 0)
        {
          syncPlayersState(players.indexFromUid(event.soundId), SYNCSTATE.PAUSE);
          playbackTimer.stop(false);
        }
      });    
    }
  }
}

function onSoundCloudPlayerEventFinish()
{
  debug.log('onSoundCloudPlayerEvent: FINISH / ENDED');
  playbackTimer.stop(true);
  nextClick(null);
}

function onSoundCloudPlayerEventError()
{
  this.getCurrentSound(soundObject =>
  {
    const player = players.playerFromUid(soundObject.id);
    debug.log(`onSoundCloudPlayerEvent: ERROR for track: ${players.trackFromUid(soundObject.id)}. ${player.getArtist()} - ${player.getTitle()} - [${player.getUid()} / ${player.getIframeId()}]`);
    player.setPlayable(false);
  });
}
