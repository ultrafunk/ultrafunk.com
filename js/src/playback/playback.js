//
// Play YouTube and SoundCloud embeds with playback control UI
//
// https://ultrafunk.com
//


import * as debugLogger   from '../shared/debuglogger.js';
import * as eventLogger   from './eventlogger.js';
import * as mediaPlayers  from './mediaplayers.js';
import * as embedded      from './embedded-players.js';
import * as events        from './playback-events.js';
import * as controls      from './playback-controls.js';
import { CROSSFADE_TYPE } from './crossfade.js';


export {
  hasEmbeddedPlayers,
  init,
  togglePlayPause,
  prevClick,
  nextClick,
  toggleMute,
  getStatus,
};


/*************************************************************************************************/


const debug  = debugLogger.getInstance('playback');
let eventLog = null;
let settings = {};
let players  = {};

const mConfig = {
  updateTimerInterval:   200, // Milliseconds between each timer event
  minTrackCrossfadeTime: 5,   // Shortest allowed track to track fade time
  maxBufferingDelay:     3,   // VERY rough estimate of "max" network buffering delay in seconds
};


// ************************************************************************************************
// Init
// ************************************************************************************************

function init(playbackSettings)
{
  eventLog = embedded.eventLog;
  settings = playbackSettings.user;

  events.init(playbackSettings);
  controls.init(settings, seekClick, trackCrossfadeClick);
  
  players = mediaPlayers.getInstance();
  players.init(settings, playTrack);

  embedded.init(settings, players, playbackState, playbackTimer);
}

function hasEmbeddedPlayers()
{
  return (embedded.countPlayers(embeddedEventHandler) > 0);
}


// ************************************************************************************************
// Playback controls click handlers + state
// ************************************************************************************************

function togglePlayPause()
{
  if (controls.isPlaying())
  {
    controls.setPauseState();
    players.current.pause();
  }
  else
  {
    controls.setPlayState(players.getStatus());
    players.current.play(embedded.onPlayerError);
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
      controls.setPauseState();
    }
  }
  else if (event === null)
  {
    controls.setPauseState();
    
    if (settings.autoPlay)
      events.dispatch(events.EVENT.CONTINUE_AUTOPLAY);
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
  
function playTrack(playMedia, scrollToMedia = true)
{
  events.dispatch(events.EVENT.MEDIA_SHOW, { scrollToMedia: scrollToMedia, postId: players.current.getPostId() });
  
  if (playMedia)
    players.current.play(embedded.onPlayerError);
}

function skipToTrack(track, playMedia = true)
{
  debug.log(`skipToTrack(): ${track} - ${playMedia}`);

  if ((playMedia === true) && (controls.isPlaying() === false))
  {
    // Reset eventlog to enable check for autoplay block
    eventLog.clear();
    eventLog.add(eventLogger.SOURCE.ULTRAFUNK, eventLogger.EVENT.RESUME_AUTOPLAY, null);
    
    if (players.jumpToTrack(track, playMedia))
      controls.updateNextState(players.getStatus());
  }
}

function resumeAutoPlay()
{
  debug.log('resumeAutoPlay()');
  eventLog.add(eventLogger.SOURCE.ULTRAFUNK, eventLogger.EVENT.RESUME_AUTOPLAY, null);
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
// Embedded players event handler (thin wrapper for events.dispatch())
// ************************************************************************************************

function embeddedEventHandler(embeddedEvent, embeddedEventData = null)
{
  if (debug.isDebug() && (embeddedEvent !== events.EVENT.LOADING))
  {
    debug.log(`embeddedEventHandler(): ${embeddedEvent}`);
    if (embeddedEventData !== null) debug.log(embeddedEventData);
  }

  switch(embeddedEvent)
  {
    case events.EVENT.LOADING:
      events.dispatch(events.EVENT.LOADING, embeddedEventData);
      break;
    
    case events.EVENT.READY:
      controls.ready(prevClick, togglePlayPause, nextClick, toggleMute, players.getNumTracks());
      events.dispatch(events.EVENT.READY);
      events.dispatch(events.EVENT.RESUME_AUTOPLAY, null, { 'resumeAutoPlay': resumeAutoPlay });
      break;

    case events.EVENT.MEDIA_ENDED:
      nextClick(null);
      break;

    case events.EVENT.AUTOPLAY_BLOCKED:
      controls.setPauseState();
      events.dispatch(events.EVENT.AUTOPLAY_BLOCKED, getStatus(), { 'togglePlayPause': togglePlayPause });
      break;

    case events.EVENT.PLAYBACK_BLOCKED:
      controls.setPauseState();
      events.dispatch(events.EVENT.PLAYBACK_BLOCKED, embeddedEventData, { 'skipToTrack': skipToTrack });
      break;

    case events.EVENT.MEDIA_UNAVAILABLE:
      controls.setPauseState();
      events.dispatch(events.EVENT.MEDIA_UNAVAILABLE, embeddedEventData, { 'skipToTrack': skipToTrack });
      break;
    }
}


// ************************************************************************************************
// Playback controls and embedded players state sync module
// ************************************************************************************************

const playbackState = (() =>
{
  const STATE = {
    PLAY:  1,
    PAUSE: 2,
  };
  
  const syncAll = function syncAllRecursive(nextPlayerUid, syncState)
  {
    debug.log(`playbackState.syncAll() - previousTrack: ${players.getPlayerIndex() + 1} - nextTrack: ${players.indexMap.get(nextPlayerUid) + 1} - syncState: ${debug.getObjectKeyForValue(STATE, syncState)}`);
    
    if (players.isCurrent(nextPlayerUid))
    {
      if (syncState === STATE.PLAY)
      {
        players.crossfade.start(nextPlayerUid);
        controls.setPlayState(players.getStatus());
        events.dispatch(events.EVENT.MEDIA_PLAYING, getStatus());
      }
      else if (syncState === STATE.PAUSE)
      {
        players.crossfade.stop();
        controls.setPauseState();
        events.dispatch(events.EVENT.MEDIA_PAUSED, getStatus());
      }
    }
    else
    {
      const prevPlayerIndex = players.getPlayerIndex();
      const nextPlayerIndex = players.indexMap.get(nextPlayerUid);
      
      players.stop();
      players.setPlayerIndex(nextPlayerIndex);
      
      syncControls(prevPlayerIndex, nextPlayerIndex);
      syncAllRecursive(nextPlayerUid, syncState);
    }
  };

  function syncControls(prevPlayerIndex, nextPlayerIndex)
  {
    if (nextPlayerIndex > prevPlayerIndex)
      controls.updateNextState(players.getStatus());
    else
      controls.updatePrevState(players.getStatus());
  }

  return {
    STATE,
    syncAll,
    syncControls,
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
    intervalId = setInterval(update, mConfig.updateTimerInterval);
  }
  
  function stop(mediaEnded = false)
  {
    if (intervalId !== -1)
    {
      clearInterval(intervalId);
      intervalId = -1;
    }
    
    if (mediaEnded)
    {
      updateCallback(0);
      events.dispatch(events.EVENT.MEDIA_ENDED, getStatus());
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
      updateAutoCrossfade(positionSeconds, durationSeconds);
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
          events.dispatch(events.EVENT.MEDIA_TIME_REMAINING, { timeRemainingSeconds: timeRemainingSeconds });
        }
        else
        {
          controls.blinkPlayPause(false);
        }
      }
    }
  }

  function updateAutoCrossfade(positionSeconds, durationSeconds)
  {
    if ((settings.masterMute !== true) && settings.autoPlay && settings.autoCrossfade)
    {
      if ((durationSeconds - positionSeconds) === (settings.autoCrossfadeLength + mConfig.maxBufferingDelay))
      {
        if ((players.getCurrentTrack() + 1) <= players.getNumTracks())
          crossfadeInit(CROSSFADE_TYPE.AUTO, settings.autoCrossfadeCurve);
      }
    }
  }
})();


// ************************************************************************************************
// Track to Track crossfade click handler + crossfade init helper functions
// ************************************************************************************************

function trackCrossfadeClick(fadeInIframeId)
{
  const fadeInUid = players.uIdFromIframeId(fadeInIframeId);

  if ((players.isCurrent(fadeInUid) === false) && (players.current.getDuration() > 0))
  {
    debug.log(`trackCrossfadeClick():\nfadeOut: ${players.current.getArtist()} - "${players.current.getTitle()}" (${players.current.getUid()})\nfadeIn.: ${players.playerFromUid(fadeInUid).getArtist()} - "${players.playerFromUid(fadeInUid).getTitle()}" (${fadeInUid})`);

    if ((settings.masterMute !== true) && (settings.autoPlay === false) && settings.trackCrossfade)
    {
      players.current.getPosition((positionMilliseconds) =>
      {
        const timeRemaining = players.current.getDuration() - (positionMilliseconds / 1000);

        if (timeRemaining >= (mConfig.minTrackCrossfadeTime + mConfig.maxBufferingDelay))
          crossfadeInit(CROSSFADE_TYPE.TRACK, settings.trackCrossfadeCurve, fadeInUid);
      });
    }
  }
}

function crossfadeInit(crossfadeType, crossfadeCurve, crossfadeInUid = null)
{
  eventLog.add(eventLogger.SOURCE.ULTRAFUNK, eventLogger.EVENT.CROSSFADE_START, null);

  const playersIndex = players.crossfade.init(crossfadeType, crossfadeCurve, crossfadeInUid);

  if (playersIndex !== null)
    playbackState.syncControls(playersIndex.fadeOutPlayer, playersIndex.fadeInPlayer);
}
