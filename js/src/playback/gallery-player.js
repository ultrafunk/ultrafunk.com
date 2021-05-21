//
// Gallery player module
//
// https://ultrafunk.com
//


import * as debugLogger       from '../shared/debuglogger.js';
import * as eventLogger       from './eventlogger.js';
import * as mediaPlayers      from './mediaplayers.js';
import * as embedded          from './embedded-players.js';
import * as events            from './playback-events.js';
import * as controls          from './playback-controls.js';
import * as crossfadeControls from './crossfade-controls.js';
import { CROSSFADE_TYPE }     from './crossfade.js';


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


const debug  = debugLogger.newInstance('gallery-player');

const m = {
  eventLog: null,
  settings: {},
  players:  {},
};

const config = {
  updateTimerInterval: 200, // Milliseconds between each timer event
  minCrossfadeToTime:  5,   // Shortest allowed track to track fade time
  maxBufferingDelay:   3,   // VERY rough estimate of "max" network buffering delay in seconds
};


// ************************************************************************************************
// Init
// ************************************************************************************************

function init(playbackSettings)
{
  m.eventLog = embedded.eventLog;
  m.settings = playbackSettings.user;

  events.init(playbackSettings);
  
  m.players = mediaPlayers.getInstance();
  m.players.init(m.settings, playTrack);

  controls.init(m.settings, m.players, seekClick);
  crossfadeControls.init(m.settings, m.players, crossfadeToClick);
  embedded.init({ settings: m.settings, players: m.players, playbackState: playbackState, playbackTimer: playbackTimer });
}

function hasEmbeddedPlayers()
{
  return (embedded.getTrackCount(embeddedEventHandler) > 0);
}


// ************************************************************************************************
// Playback controls click handlers + state
// ************************************************************************************************

function togglePlayPause()
{
  if (controls.isPlaying())
  {
    controls.setPauseState();
    m.players.current.pause();
  }
  else
  {
    controls.setPlayState();
    m.players.current.play(embedded.onPlayerError);
  }
}

function prevClick()
{
  debug.log(`prevClick() - prevTrack: ${m.players.getCurrentTrack() - 1} - numTracks: ${m.players.getNumTracks()}`);

  if (m.players.getCurrentTrack() > 0)
  {
    m.players.current.getPosition((positionMilliseconds) =>
    {
      if (positionMilliseconds > 5000)
      {
        m.players.current.seekTo(0);
        playbackTimer.updateCallback(0);
      }
      else
      {
        if (m.players.getCurrentTrack() > 1)
          m.players.stop();
        
        if (m.players.prevTrack(controls.isPlaying()))
          controls.updatePrevState();
      }
    });
  }
}

function nextClick(isMediaEnded = false)
{
  const isLastTrack = ((m.players.getCurrentTrack() + 1) > m.players.getNumTracks());

  debug.log(`nextClick() - isMediaEnded: ${isMediaEnded} - isLastTrack: ${isLastTrack} - autoplay: ${m.settings.autoplay}`);

  if (repeatPlayback(isMediaEnded, isLastTrack))
    return;

  if (isLastTrack === false)
  {
    m.players.stop();
    
    if (isMediaEnded && (m.settings.autoplay === false))
    {
      controls.setPauseState();
    }
    else
    {
      if (m.players.nextTrack(controls.isPlaying()))
        controls.updateNextState();
    }
  }
  else if (isMediaEnded)
  {
    controls.setPauseState();
    
    if (m.settings.autoplay)
      events.dispatch(events.EVENT.CONTINUE_AUTOPLAY);
    else
      m.players.stop();
  }
}

function repeatPlayback(isMediaEnded, isLastTrack)
{
  if (isMediaEnded && m.settings.autoplay)
  {
    const repeatMode = controls.getRepeatMode();

    debug.log(`repeatPlayback(): ${debug.getObjectKeyForValue(controls.REPEAT, repeatMode)}`);

    if (repeatMode === controls.REPEAT.ONE)
    {
      m.players.current.seekTo(0);
      m.players.current.play();
      return true;
    }
    else if (isLastTrack && (repeatMode === controls.REPEAT.ALL))
    {
      m.players.stop();
      m.players.setPlayerIndex(0);
      playTrack(true);
      return true;
    }
  }

  return false;
}

function seekClick(positionSeconds)
{
  m.players.current.seekTo(positionSeconds);
}

function toggleMute()
{
  m.settings.masterMute = (m.settings.masterMute === true) ? false : true;
  m.players.mute();
}
  
function cueTrack(iframeId, scrollToMedia = true)
{
  debug.log(`cueTrack(): ${iframeId}`);

  m.players.setPlayerIndex(m.players.indexMap.get(iframeId));
  events.dispatch(events.EVENT.MEDIA_SHOW, { scrollToMedia: scrollToMedia, trackId: m.players.current.getTrackId() });
  controls.updateNextState();
}

function playTrack(playMedia, scrollToMedia = true)
{
  events.dispatch(events.EVENT.MEDIA_SHOW, { scrollToMedia: scrollToMedia, trackId: m.players.current.getTrackId() });
  
  if (playMedia)
    m.players.current.play(embedded.onPlayerError);
}

function skipToTrack(trackNum, playMedia = true)
{
  debug.log(`skipToTrack(): ${trackNum} - ${playMedia}`);

  if ((playMedia === true) && (controls.isPlaying() === false))
  {
    // Reset eventlog to enable check for autoplay block
    m.eventLog.clear();
    m.eventLog.add(eventLogger.SOURCE.ULTRAFUNK, eventLogger.EVENT.RESUME_AUTOPLAY, null);
    
    if (m.players.jumpToTrack(trackNum, playMedia))
      controls.updateNextState();
  }
}

function resumeAutoplay(autoplayData, iframeId = null)
{
  debug.log(`resumeAutoplay(): ${autoplayData.autoplay}${(iframeId !== null) ? ' - ' + iframeId : '' }`);

  if (iframeId !== null)
  {
    autoplayData.autoplay ? skipToTrack(m.players.trackFromUid(iframeId), true) : cueTrack(iframeId);
  }
  else if (autoplayData.autoplay)
  {
    m.eventLog.add(eventLogger.SOURCE.ULTRAFUNK, eventLogger.EVENT.RESUME_AUTOPLAY, null);
    togglePlayPause();
  }
}

function getStatus()
{
  return {
    isPlaying:    controls.isPlaying(),
    currentTrack: m.players.getCurrentTrack(),
    position:     0,
    numTracks:    m.players.getNumTracks(),
    trackId:      m.players.current.getTrackId(),
    iframeId:     m.players.current.getIframeId(),
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
      controls.ready(prevClick, togglePlayPause, nextClick, toggleMute);
      crossfadeControls.ready();
      events.dispatch(events.EVENT.READY);
      events.dispatch(events.EVENT.RESUME_AUTOPLAY, null, { 'resumeAutoplay': resumeAutoplay });
      break;

    case events.EVENT.MEDIA_ENDED:
      nextClick(true);
      break;

    case events.EVENT.AUTOPLAY_BLOCKED:
      controls.setPauseState();
      events.dispatch(events.EVENT.AUTOPLAY_BLOCKED, null, { 'togglePlayPause': togglePlayPause });
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
    debug.log(`playbackState.syncAll() - previousTrack: ${m.players.getPlayerIndex() + 1} - nextTrack: ${m.players.indexMap.get(nextPlayerUid) + 1} - syncState: ${debug.getObjectKeyForValue(STATE, syncState)}`);
    
    if (m.players.isCurrent(nextPlayerUid))
    {
      if (syncState === STATE.PLAY)
      {
        m.players.crossfade.start();
        controls.setPlayState();
        events.dispatch(events.EVENT.MEDIA_PLAYING, getStatus());
      }
      else if (syncState === STATE.PAUSE)
      {
        m.players.crossfade.stop();
        controls.setPauseState();
        events.dispatch(events.EVENT.MEDIA_PAUSED, getStatus());
      }
    }
    else
    {
      const prevPlayerIndex = m.players.getPlayerIndex();
      const nextPlayerIndex = m.players.indexMap.get(nextPlayerUid);
      
      m.players.stop();
      m.players.setPlayerIndex(nextPlayerIndex);
      
      syncControls(prevPlayerIndex, nextPlayerIndex);
      syncAllRecursive(nextPlayerUid, syncState);
    }
  };

  function syncControls(prevPlayerIndex, nextPlayerIndex)
  {
    if (nextPlayerIndex > prevPlayerIndex)
      controls.updateNextState();
    else
      controls.updatePrevState();
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
  let isVisible      = true;

  // Can be called on IIFE execution since it has no other dependencies
  document.addEventListener('visibilitychange', () => { isVisible = (document.visibilityState === 'visible') ? true : false; });

  return {
    start,
    stop,
    updateCallback,
  };
  
  function start()
  {
    stop(false);
    intervalId = setInterval(() => { if (isVisible) m.players.current.getPosition(updateCallback); }, config.updateTimerInterval);
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
    if ((m.settings.autoplay === false) && m.settings.timeRemainingWarning)
    {
      if (lastPosSeconds !== positionSeconds)
      {
        const timeRemainingSeconds = durationSeconds - positionSeconds;
        lastPosSeconds             = positionSeconds;

        if (timeRemainingSeconds <= m.settings.timeRemainingSeconds)
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
    if ((m.settings.masterMute === false) && m.settings.autoplay && m.settings.autoCrossfade)
    {
      if ((durationSeconds - positionSeconds) === (m.settings.autoCrossfadeLength + config.maxBufferingDelay))
      {
        if ((m.players.getCurrentTrack() + 1) <= m.players.getNumTracks())
          crossfadeInit(CROSSFADE_TYPE.AUTO, { name: 'Auto Crossfade', length: m.settings.autoCrossfadeLength, curve: m.settings.autoCrossfadeCurve});
      }
    }
  }
})();


// ************************************************************************************************
// Track to Track crossfade click handler + crossfade init helper functions
// ************************************************************************************************

function crossfadeToClick(fadeInUid, crossfadePreset)
{
  if ((m.players.isCurrent(fadeInUid) === false) && (m.players.current.getDuration() > 0))
  {
    debug.log(`crossfadeToClick():
      fadeOut: ${m.players.current.getArtist()} - "${m.players.current.getTitle()}" (${m.players.current.getUid()})
      fadeIn.: ${m.players.playerFromUid(fadeInUid).getArtist()} - "${m.players.playerFromUid(fadeInUid).getTitle()}" (${fadeInUid})`);

    if ((m.settings.masterMute === false) && (m.settings.autoplay === false))
    {
      m.players.current.getPosition((positionMilliseconds) =>
      {
        const timeRemaining = m.players.current.getDuration() - (positionMilliseconds / 1000);

        if (timeRemaining >= (config.minCrossfadeToTime + config.maxBufferingDelay))
          crossfadeInit(CROSSFADE_TYPE.TRACK, crossfadePreset, fadeInUid);
      });
    }
  }
}

function crossfadeInit(crossfadeType, crossfadePreset, crossfadeInUid = null)
{
  m.eventLog.add(eventLogger.SOURCE.ULTRAFUNK, eventLogger.EVENT.CROSSFADE_START, null);

  const playersIndex = m.players.crossfade.init(crossfadeType, crossfadePreset, crossfadeInUid);

  if (playersIndex !== null)
    playbackState.syncControls(playersIndex.fadeOutPlayer, playersIndex.fadeInPlayer);
}
