//
// Embedded players
//
// https://ultrafunk.com
//


import * as debugLogger  from '../shared/debuglogger.js';
import * as eventLogger  from './eventlogger.js';
import * as mediaPlayers from './mediaplayers.js';
import { EVENT }         from './playback-events.js';


export {
  eventLog,
  init,
  getTrackCount,
  onPlayerError,
};


/*************************************************************************************************/


const debug    = debugLogger.newInstance('embedded-players');
const eventLog = new eventLogger.Playback(10);

const m = {
  settings:        {},
  players:         {},
  playbackState:   null,
  playbackTimer:   null,
  eventHandler:    null,
  loadEventsTotal: 0,
  loadEventsCount: 1,
};

const config = {
  youTubeIframeIdRegEx:    /youtube-uid/i,
  soundCloudIframeIdRegEx: /soundcloud-uid/i,
  maxPlaybackStartDelay:   3, // VERY rough estimate of "max" network buffering delay in seconds (see also: maxBufferingDelay)
};


// ************************************************************************************************
//
// ************************************************************************************************

function init(args)
{
  ({ settings: m.settings, players: m.players, playbackState: m.playbackState, playbackTimer: m.playbackTimer } = args);

  initYouTubeAPI();
  initSoundCloudAPI();
}


// ************************************************************************************************
//
// ************************************************************************************************

function getTrackCount(embeddedEventHandler)
{
  let trackCount = document.body.getAttribute('data-gallery-track-count');
  (trackCount === null) ? trackCount = 0 : trackCount = parseInt(trackCount);

  debug.log(`getTrackCount(): ${trackCount}`);

  m.loadEventsTotal = trackCount + 3;       // The total number of loadEvents include 3 stages before embedded players are loaded
  m.eventHandler    = embeddedEventHandler; // This is set here to be available as early as possible since it is called before init()

  return trackCount;
}

function getLoadingPercent()
{
  return { loadingPercent: (100 * (m.loadEventsCount++ / m.loadEventsTotal)) };
}

function updatePlayersReady()
{
  if (m.loadEventsCount >= m.loadEventsTotal)
    m.eventHandler(EVENT.READY);
  else
    m.eventHandler(EVENT.LOADING, getLoadingPercent());
}


// ************************************************************************************************
// Get and wrap all embedder players in MediaPlayer YouTube or SoundCloud classes
// ************************************************************************************************

function getAllPlayers()
{
  const entries = document.querySelectorAll('single-track');

  entries.forEach(entry => 
  {
    const iframe = entry.querySelector('iframe');
    let player   = null;

    if (config.youTubeIframeIdRegEx.test(iframe.id)) 
    {
      const embeddedPlayer = new YT.Player(iframe.id, // eslint-disable-line no-undef
      {
        events:
        {
          onReady:       onYouTubePlayerReady,
          onStateChange: onYouTubePlayerStateChange,
          onError:       onYouTubePlayerError,
        }
      });

      player = new mediaPlayers.YouTube(entry.id, iframe.id, embeddedPlayer, entry.getAttribute('data-track-source-data'));
    }
    else if (config.soundCloudIframeIdRegEx.test(iframe.id))
    {
      /* eslint-disable */
      const embeddedPlayer = SC.Widget(iframe.id);
      player = new mediaPlayers.SoundCloud(entry.id, iframe.id, embeddedPlayer, iframe.src);

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

    if (player !== null)
    {
      player.setTitle(entry.getAttribute('data-track-title'));
      player.setArtist(entry.getAttribute('data-track-artist'));
      m.players.add(player);
    }
  });
}


// ************************************************************************************************
// Helper functions for the YouTube and SoundCloud MediaPlayer classes
// ************************************************************************************************

function onPlayerError(player, mediaUrl)
{
  debug.log('onPlayerError()');
  debug.log(player);

  const eventSource = (player instanceof mediaPlayers.SoundCloud) ? eventLogger.SOURCE.SOUNDCLOUD : eventLogger.SOURCE.YOUTUBE;

  // Stop the current track if it is not the one we are going to next
  if (m.players.isCurrent(player.getUid()) === false)
    m.players.stop();
  
  eventLog.add(eventSource, eventLogger.EVENT.PLAYER_ERROR, player.getUid());
  m.eventHandler(EVENT.MEDIA_UNAVAILABLE, getPlayerErrorData(player, mediaUrl));
}

function getPlayerErrorData(player, mediaUrl)
{
  const artist = player.getArtist() || 'N/A';
  const title  = player.getTitle()  || 'N/A';

  return {
    currentTrack: m.players.trackFromUid(player.getUid()),
    numTracks:    m.players.getNumTracks(),
    trackId:      player.getTrackId(),
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
  m.eventHandler(EVENT.LOADING, getLoadingPercent());

  window.onYouTubeIframeAPIReady = function()
  {
    debug.log('onYouTubeIframeAPIReady()');
    m.eventHandler(EVENT.LOADING, getLoadingPercent());
  
    // ToDo: THIS SHOULD NOT BE TRIGGERED HERE ONLY?
    getAllPlayers();
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
  updatePlayersReady();
}

function onYouTubePlayerStateChange(event)
{
  eventLog.add(eventLogger.SOURCE.YOUTUBE, event.data, event.target.h.id);

  switch (event.data)
  {
    /* eslint-disable */
    case YT.PlayerState.UNSTARTED: onYouTubeStateUnstarted(event); break;
    case YT.PlayerState.BUFFERING: onYouTubeStateBuffering(event); break;
    case YT.PlayerState.PLAYING:   onYouTubeStatePlaying(event);   break;
    case YT.PlayerState.PAUSED:    onYouTubeStatePaused(event);    break;
    case YT.PlayerState.CUED:      onYouTubeStateCued(event);      break;
    case YT.PlayerState.ENDED:     onYouTubeStateEnded(event);     break;
    /* eslint-enable */
  }
}

function onYouTubeStateUnstarted(event)
{
  debug.log(`onYouTubePlayerStateChange: UNSTARTED (uID: ${event.target.h.id})`);
  
  if (eventLog.ytAutoplayBlocked(event.target.h.id, 3000))
    m.eventHandler(EVENT.AUTOPLAY_BLOCKED);
}

function onYouTubeStateBuffering(event)
{
  debug.log(`onYouTubePlayerStateChange: BUFFERING (uID: ${event.target.h.id})`);

  if (m.players.crossfade.isFading() === false)
  {
    const player = m.players.playerFromUid(event.target.h.id);
    player.mute(m.settings.masterMute);
    player.setVolume(m.settings.masterVolume);
  }
}

function onYouTubeStatePlaying(event)
{
  debug.log(`onYouTubePlayerStateChange: PLAYING   (uID: ${event.target.h.id})`);
  
  // Call order is important on play events for state handling: Always sync first!
  m.playbackState.syncAll(event.target.h.id, m.playbackState.STATE.PLAY);
  m.players.current.setDuration(Math.round(event.target.getDuration()));
  m.playbackTimer.start();
}

function onYouTubeStatePaused(event)
{
  debug.log(`onYouTubePlayerStateChange: PAUSED    (uID: ${event.target.h.id})`);

  if (m.players.isCurrent(event.target.h.id))
  {
    m.playbackState.syncAll(event.target.h.id, m.playbackState.STATE.PAUSE);
    m.playbackTimer.stop(false);
  }
  else
  {
    m.players.crossfade.stop();
  }
}

function onYouTubeStateCued(event)
{
  debug.log(`onYouTubePlayerStateChange: CUED      (uID: ${event.target.h.id})`);
}

function onYouTubeStateEnded(event)
{
  debug.log(`onYouTubePlayerStateChange: ENDED     (uID: ${event.target.h.id})`);

  if (m.players.isCurrent(event.target.h.id))
  {
    m.playbackTimer.stop(true);
    m.eventHandler(EVENT.MEDIA_ENDED);
  }
  else
  {
    m.players.crossfade.stop();
  }
}

function onYouTubePlayerError(event)
{
  debug.log('onYouTubePlayerError: ' + event.data);

  const player = m.players.playerFromUid(event.target.h.id);
  player.setPlayable(false);
  onPlayerError(player, event.target.getVideoUrl());
}


// ************************************************************************************************
// SoundCloud init and event functions
// https://developers.soundcloud.com/docs/api/html5-widget
// ************************************************************************************************

function initSoundCloudAPI()
{
  debug.log('initSoundCloudAPI()');
  m.eventHandler(EVENT.LOADING, getLoadingPercent());
}

function onSoundCloudPlayerEventReady()
{
  debug.log('onSoundCloudPlayerEventReady()');
  updatePlayersReady();
}

function onSoundCloudPlayerEventPlay(event)
{
  debug.log(`onSoundCloudPlayerEvent: PLAY   (uID: ${event.soundId})`);
  eventLog.add(eventLogger.SOURCE.SOUNDCLOUD, eventLogger.EVENT.STATE_PLAYING, event.soundId);

  if (m.players.crossfade.isFading() && m.players.isCurrent(event.soundId))
  {
    // Call order is important on play events for state handling: Always sync first!
    if (eventLog.scPlayDoubleTrigger(event.soundId, (config.maxPlaybackStartDelay * 1000)))
      m.playbackState.syncAll(event.soundId, m.playbackState.STATE.PLAY);
  }
  else
  {
    // Call order is important on play events for state handling: Always sync first!
    m.playbackState.syncAll(event.soundId, m.playbackState.STATE.PLAY);

    m.players.current.mute(m.settings.masterMute);
    m.players.current.setVolume(m.settings.masterVolume);
  }

  m.players.current.getEmbeddedPlayer().getDuration(durationMilliseconds =>
  {
    m.players.current.setDuration(Math.round(durationMilliseconds / 1000));
    m.playbackTimer.start();
  });  
}

function onSoundCloudPlayerEventPause(event)
{
  debug.log(`onSoundCloudPlayerEvent: PAUSE  (uID: ${event.soundId})`);
  eventLog.add(eventLogger.SOURCE.SOUNDCLOUD, eventLogger.EVENT.STATE_PAUSED, event.soundId);
  
  if (eventLog.scAutoplayBlocked(event.soundId, 3000))
  {
    m.playbackTimer.stop(false);
    m.eventHandler(EVENT.AUTOPLAY_BLOCKED);
  }
  else if (eventLog.scWidgetPlayBlocked(event.soundId, 30000))
  {
    m.playbackTimer.stop(false);
    m.eventHandler(EVENT.PLAYBACK_BLOCKED, { currentTrack: m.players.trackFromUid(event.soundId), numTracks: m.players.getNumTracks() });
  }
  else
  {
    // Only sync state if we get pause events on the same (current) player
    if (m.players.isCurrent(event.soundId))
    {
      m.players.current.getPosition(positionMilliseconds =>
      {
        if (positionMilliseconds > 0)
        {
          m.playbackState.syncAll(event.soundId, m.playbackState.STATE.PAUSE);
          m.playbackTimer.stop(false);
        }
      });    
    }
    else
    {
      m.players.crossfade.stop();
    }
  }
}

function onSoundCloudPlayerEventFinish(event)
{
  debug.log(`onSoundCloudPlayerEvent: FINISH (uID: ${event.soundId})`);

  if (m.players.isCurrent(event.soundId))
  {
    m.playbackTimer.stop(true);
    m.eventHandler(EVENT.MEDIA_ENDED);
  }
  else
  {
    m.players.crossfade.stop();
  }
}

function onSoundCloudPlayerEventError()
{
  this.getCurrentSound(soundObject =>
  {
    const player = m.players.playerFromUid(soundObject.id);
    debug.log(`onSoundCloudPlayerEvent: ERROR for track: ${m.players.trackFromUid(soundObject.id)}. ${player.getArtist()} - ${player.getTitle()} - [${player.getUid()} / ${player.getIframeId()}]`);
    player.setPlayable(false);
  });
}
