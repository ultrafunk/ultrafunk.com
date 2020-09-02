//
// Play all YouTube and SoundCloud embeds on a WordPress page with playback control UI
//
// https://ultrafunk.com
//


import * as debugLogger  from '../common/debuglogger.js?ver=1.10.5';
import * as mediaPlayers from './mediaplayers.js?ver=1.10.5';
import * as controls     from './playback-controls.js?ver=1.10.5';
import * as eventLogger  from './eventlogger.js?ver=1.10.5';


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
  toggleMute,
  trackCrossfadeClick,
  skipToTrack,
  getStatus,
  resumeAutoPlay,
};


const debug           = debugLogger.getInstance('playback');
const eventLog        = new eventLogger.Playback(10);
const eventHandlers   = {};
let settings          = {};
let players           = {};
let playersReadyCount = 0;

const moduleConfig = {
  youTubeIframeIdRegEx:      null,
  soundCloudIframeIdRegEx:   null,
  entriesSelector:           'article',
  entryTitleData:            'data-entry-title',
  progressControlsId:        'progress-controls',
  playbackControlsId:        'playback-controls',
  entryMetaControlsSelector: '.entry-meta-controls .crossfade-control',
  updateTimerInterval:       200, // Milliseconds between each timer event
  updateCrossfadeInterval:   50,  // Milliseconds between each crossfade event
  bufferingDelay:            1,   // VERY rough estimate of "average" network buffering delay in seconds
};

// Playback events for listeners
const EVENT = {
  LOADING:              10,
  READY:                20,
  MEDIA_PLAYING:        30,
  MEDIA_PAUSED:         40,
  MEDIA_ENDED:          50,
  MEDIA_TIME_REMAINING: 60,
  MEDIA_SHOW:           70,
  CONTINUE_AUTOPLAY:    80,
  RESUME_AUTOPLAY:      90,
  AUTOPLAY_BLOCKED:     100,
  PLAYBACK_BLOCKED:     110,
  MEDIA_UNAVAILABLE:    120,
};


// ************************************************************************************************
// Init, config and event handlers
// ************************************************************************************************

function init(playbackSettings)
{
  settings = playbackSettings;

  controls.init(moduleConfig, settings, seekClick, trackCrossfadeClick);
  players = mediaPlayers.getPlayers(moduleConfig, settings, playTrack);

  initYouTubeAPI();
  initSoundCloudAPI();
}

function setConfig(configProps = {})          { Object.assign(moduleConfig, configProps);    }
function setEventHandlers(handlersProps = {}) { Object.assign(eventHandlers, handlersProps); }

function callEventHandler(playbackEvent, eventData = null)
{
  if (playbackEvent in eventHandlers)
    eventHandlers[playbackEvent](playbackEvent, eventData);
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
          
        player = new mediaPlayers.YouTube(postId, iframeId, embeddedPlayer);
      }
      else if (moduleConfig.soundCloudIframeIdRegEx.test(iframeId))
      {
        /* eslint-disable */
        const embeddedPlayer = SC.Widget(iframeId);
        player = new mediaPlayers.SoundCloud(postId, iframeId, embeddedPlayer, getSoundCloudSoundId(iframe.src));

        // Preload thumbnail image as early as possible
        embeddedPlayer.bind(SC.Widget.Events.READY, () =>
        {
          player.setThumbnail();
          onSoundCloudPlayerEventReady();
        });

        embeddedPlayer.bind(SC.Widget.Events.PLAY,   onSoundCloudPlayerEventPlay);
        embeddedPlayer.bind(SC.Widget.Events.PAUSE,  onSoundCloudPlayerEventPause);
        embeddedPlayer.bind(SC.Widget.Events.FINISH, onSoundCloudPlayerEventFinish);
        embeddedPlayer.bind(SC.Widget.Events.ERROR,  onSoundCloudPlayerEventError);
        /* eslint-enable */
      }

      mediaPlayers.setArtistTitle(player, entryTitle);
      players.add(player);
    });
  });

//setPropsForSamePostId();
}

/*
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
      indexes.forEach(index => mediaPlayers[index].setTitleSource(mediaPlayer.TITLE_SOURCE.GET_FROM_SERVER));
  });
}
*/

function updateMediaPlayersReady()
{
  playersReadyCount++;

  if (playersReadyCount >= players.getNumTracks())
  {
    controls.ready(prevClick, togglePlayPause, nextClick, toggleMute, players.getNumTracks());
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
    players.current.pause();
  }
  else
  {
    controls.updatePlayState(players.getStatus());
    players.current.play(onEmbeddedPlayerError);
  }
}

function prevClick(event)
{
  debug.log(`prevClick() - prevTrack: ${players.getCurrentTrack() - 1} - numTracks: ${players.getNumTracks()} - event: ${((event !== null) ? event.type : 'null')}`);

  if (players.getCurrentTrack() > 0)
  {
    players.current.getPosition((positionMilliseconds) =>
    {
      if (positionMilliseconds > 3000)
      {
        players.current.seekTo(0);
        playbackTimer.updateCallback(0);
      }
      else
      {
        if (players.getCurrentTrack() > 1)
          players.stop();
        
        if (players.prevTrack(controls.isPlaying()))
          controls.updatePrevState(players.getStatus());
      }
    });
  }
}

function nextClick(event)
{
  debug.log(`nextClick() - nextTrack: ${players.getCurrentTrack() + 1} - numTracks: ${players.getNumTracks()} - event: ${((event !== null) ? event.type : 'null')}`);

  if ((players.getCurrentTrack() + 1) <= players.getNumTracks())
  {
    players.stop();
    
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
      players.stop();
  }
}

function seekClick(positionSeconds)
{
  players.current.seekTo(positionSeconds);
}

function toggleMute()
{
  settings.masterMute = (settings.masterMute === true) ? false : true;
  players.mute();
}
  
function trackCrossfadeClick(fadeInIframeId)
{
  const fadeInUid = players.uIdFromIframeId(fadeInIframeId);

  if ((players.isCurrent(fadeInUid) === false) && (players.current.getDuration() > 0))
  {
    debug.log(`trackCrossfadeClick(): ${(players.isCurrent(fadeInUid) === false)}\nfadeOut: ${players.current.getArtist()} - ${players.current.getTitle()} [${players.current.getUid()}]\nfadeIn.: ${players.playerFromUid(fadeInUid).getArtist()} - ${players.playerFromUid(fadeInUid).getTitle()} [${players.current.getUid()}]`);

    if ((settings.masterMute !== true) && (settings.autoPlay === false) && settings.trackCrossfade)
    {
      players.current.getPosition((positionMilliseconds) =>
      {
        const positionSeconds = positionMilliseconds / 1000;
        const timeRemaining   = players.current.getDuration() - positionSeconds;

        // Check for shortest "allowed" fade time
        if (timeRemaining >= 6)
        {
          const approxFadeLength = settings.trackCrossfadeLength + moduleConfig.bufferingDelay;
          const fadeLength       = (timeRemaining > approxFadeLength) ? approxFadeLength : timeRemaining;
          players.crossfade.start(positionSeconds, fadeLength, settings.trackCrossfadeCurve, fadeInUid);
        }
      });
    }
  }
}

function playTrack(playMedia, scrollToMedia = true)
{
  callEventHandler(EVENT.MEDIA_SHOW, { scrollToMedia: scrollToMedia, postId: players.current.getPostId(), iframeId: players.current.getIframeId() });
  
  if (playMedia)
    players.current.play(onEmbeddedPlayerError);
}

function skipToTrack(track, playMedia = true)
{
  debug.log(`skipToTrack(): ${track} - ${playMedia}`);

  if ((playMedia === true) && (controls.isPlaying() === false))
  {
    // Reset eventlog to enable check for autoplay block
    eventLog.clear();
    eventLog.add(eventLogger.SOURCE.ULTRAFUNK, Date.now(), eventLogger.EVENT.RESUME_AUTOPLAY, null);
    
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
    postId:       players.current.getPostId(),
    iframeId:     players.current.getIframeId(),
  };
}


// ************************************************************************************************
// Playback controls and embedded players state sync module
// ************************************************************************************************

const playersState = (() =>
{
  const STATE = {
    PLAY:  1,
    PAUSE: 2,
  };
  
  let sync = function syncRecursive(nextPlayerIndex, syncState)
  {
    debug.log(`playersState.sync() - prevPlayerIndex: ${players.getPlayerIndex()} - nextPlayerIndex: ${nextPlayerIndex} - syncState: ${debug.getObjectKeyForValue(STATE, syncState)}`);
    
    if (players.getPlayerIndex() === nextPlayerIndex)
    {
      if (syncState === STATE.PLAY)
      {
        controls.updatePlayState(players.getStatus());
        callEventHandler(EVENT.MEDIA_PLAYING, { postId: players.current.getPostId() });
      }
      else if (syncState === STATE.PAUSE)
      {
        controls.updatePauseState();
        players.crossfade.stop();
        callEventHandler(EVENT.MEDIA_PAUSED, { postId: players.current.getPostId() });
      }
    }
    else
    {
      const prevPlayerIndex = players.getPlayerIndex();
      
      players.stop();
      players.setPlayerIndex(nextPlayerIndex);

      if (nextPlayerIndex > prevPlayerIndex)
        controls.updateNextState(players.getStatus());
      else
        controls.updatePrevState(players.getStatus());
      
      syncRecursive(nextPlayerIndex, syncState);
    }
  };

  return {
    STATE,
    sync,
  };
})();


// ************************************************************************************************
// Playback timer and event handling module
// ************************************************************************************************

const playbackTimer = (() =>
{
  let intervalId     = -1;
  let lastPosSeconds = 0;

  return {
    start,
    stop,
    updateCallback,
  };
  
  function start()
  {
    stop(false);
    intervalId = setInterval(update, moduleConfig.updateTimerInterval);
  }
  
  function stop(playbackEnded = false)
  {
    if (intervalId !== -1)
    {
      clearInterval(intervalId);
      intervalId = -1;
    }
    
    if (playbackEnded)
    {
      updateCallback(0);
      callEventHandler(EVENT.MEDIA_ENDED);
    }

    lastPosSeconds = 0;
    controls.blinkPlayPause(false);
  }
  
  function update()
  {
    players.current.getPosition(updateCallback);
  }
  
  function updateCallback(positionMilliseconds, durationSeconds = 0)
  {
    const positionSeconds = Math.round(positionMilliseconds / 1000);

    controls.updateProgressPosition(positionMilliseconds, durationSeconds);
    controls.setTimer(positionSeconds, durationSeconds);

    if ((positionSeconds > 0) && (durationSeconds > 0))
    {
      updateTimeRemainingWarning(positionSeconds, durationSeconds);
      updateAutoCrossfade(positionMilliseconds, positionSeconds, durationSeconds);
    }
  }
  
  function updateTimeRemainingWarning(positionSeconds, durationSeconds)
  {
    if ((settings.autoPlay === false) && settings.timeRemainingWarning)
    {
      if (lastPosSeconds !== positionSeconds)
      {
        const timeRemainingSeconds = durationSeconds - positionSeconds;
        lastPosSeconds             = positionSeconds;

        if (timeRemainingSeconds <= settings.timeRemainingSeconds)
        {
          controls.blinkPlayPause(true);
          callEventHandler(EVENT.MEDIA_TIME_REMAINING, { timeRemainingSeconds: timeRemainingSeconds });
        }
        else
        {
          controls.blinkPlayPause(false);
        }
      }
    }
  }

  function updateAutoCrossfade(positionMilliseconds, positionSeconds, durationSeconds)
  {
    if ((settings.masterMute !== true) && settings.autoPlay && settings.autoCrossfade)
    {
      const approxFadeLength = settings.autoCrossfadeLength + moduleConfig.bufferingDelay;

      if ((durationSeconds - positionSeconds) === approxFadeLength)
      {
        if ((players.getCurrentTrack() + 1) <= players.getNumTracks())
          players.crossfade.start((positionMilliseconds / 1000), approxFadeLength, settings.autoCrossfadeCurve);
      }
    }
  }
})();


// ************************************************************************************************
// Helper functions / wrappers for the YouTube and SoundCloud MediaPlayer classed
// ************************************************************************************************

function onEmbeddedPlayerError(player, mediaUrl)
{
  debug.log('onEmbeddedPlayerError()');
  debug.log(player);

  const eventSource  = (player instanceof mediaPlayers.SoundCloud) ? eventLogger.SOURCE.SOUNDCLOUD : eventLogger.SOURCE.YOUTUBE;

  // Stop the current track if it is not the one we are going to next
  if (players.isCurrent(player.getUid()) === false)
    players.stop();
  
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

function onYouTubePlayerReady(event)
{
  debug.log('onYouTubePlayerReady()');
  updateMediaPlayersReady();

  players.playerFromUid(event.target.f.id).setThumbnail(event.target.getVideoData().video_id);
}

function onYouTubePlayerStateChange(event)
{
  eventLog.add(eventLogger.SOURCE.YOUTUBE, Date.now(), event.data, event.target.f.id);
  
  switch (event.data)
  {
    case YT.PlayerState.BUFFERING: // eslint-disable-line no-undef
      {
        debug.log('onYouTubePlayerStateChange: BUFFERING');

        if (players.crossfade.isFading() === false)
        {
          const player = players.playerFromUid(event.target.f.id);
          player.mute(settings.masterMute);
          player.setVolume(settings.masterVolume);
        }
      }
      break;

    case YT.PlayerState.CUED: // eslint-disable-line no-undef
      debug.log('onYouTubePlayerStateChange: CUED');
      break;

    case YT.PlayerState.PLAYING: // eslint-disable-line no-undef
      {
        debug.log('onYouTubePlayerStateChange: PLAYING');

        // Call order is important on play events for state handling: Always sync first!
        playersState.sync(players.indexMap.get(event.target.f.id), playersState.STATE.PLAY);

        players.current.setDuration(Math.round(event.target.getDuration()));
        playbackTimer.start();

        /*
        if (players.current.setArtistTitleFromServer(event.target.getVideoData().title))
          controls.setDetails(players.getStatus());
        */
      }
      break;

    case YT.PlayerState.PAUSED: // eslint-disable-line no-undef
      {
        debug.log(`onYouTubePlayerStateChange: PAUSED (uID: ${event.target.f.id})`);

        if (players.isCurrent(event.target.f.id))
        {
          playersState.sync(players.indexMap.get(event.target.f.id), playersState.STATE.PAUSE);
          playbackTimer.stop(false);
        }
        else
        {
          players.crossfade.stop();
        }
      }
      break;

    case YT.PlayerState.ENDED: // eslint-disable-line no-undef
      {
        debug.log(`onYouTubePlayerStateChange: ENDED (uID: ${event.target.f.id})`);

        if (players.isCurrent(event.target.f.id))
        {
          playbackTimer.stop(true);
          nextClick(null);
        }
        else
        {
          players.crossfade.stop();
        }
      }
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
  onEmbeddedPlayerError(player, event.target.getVideoUrl());
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
  debug.log(`onSoundCloudPlayerEvent: PLAY (uID: ${event.soundId})`);
  eventLog.add(eventLogger.SOURCE.SOUNDCLOUD, Date.now(), eventLogger.EVENT.STATE_PLAYING, event.soundId);

  // Call order is important on play events for state handling: Always sync first!
  playersState.sync(players.indexMap.get(event.soundId), playersState.STATE.PLAY);

  if (players.crossfade.isFading() === false)
  {
    players.current.mute(settings.masterMute);
    players.current.setVolume(settings.masterVolume);
  }

  players.current.getEmbeddedPlayer().getDuration(durationMilliseconds =>
  {
    players.current.setDuration(Math.round(durationMilliseconds / 1000));
    playbackTimer.start();
  });  
}

function soundCloudPlaybackBlocked(playbackEvent, eventData = null)
{
  debug.log(`soundCloudPlaybackBlocked(): ${debug.getObjectKeyForValue(EVENT, playbackEvent)}`);
  
  controls.updatePauseState();
  playbackTimer.stop(false);
  callEventHandler(playbackEvent, eventData);
}

function onSoundCloudPlayerEventPause(event)
{
  debug.log(`onSoundCloudPlayerEvent: PAUSE (uID: ${event.soundId})`);
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
    if (players.isCurrent(event.soundId))
    {
      players.current.getPosition(positionMilliseconds =>
      {
        if (positionMilliseconds > 0)
        {
          playersState.sync(players.indexMap.get(event.soundId), playersState.STATE.PAUSE);
          playbackTimer.stop(false);
        }
      });    
    }
    else
    {
      players.crossfade.stop();
    }
  }
}

function onSoundCloudPlayerEventFinish(event)
{
  debug.log(`onSoundCloudPlayerEvent: FINISH (uID: ${event.soundId})`);

  if (players.isCurrent(event.soundId))
  {
    playbackTimer.stop(true);
    nextClick(null);
  }
  else
  {
    players.crossfade.stop();
  }
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
