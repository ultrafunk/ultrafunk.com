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
  countPlayers,
  onPlayerError,
};


/*************************************************************************************************/


const debug         = debugLogger.newInstance('embedded-players');
const eventLog      = new eventLogger.Playback(10);
let settings        = null;
let players         = null;
let playbackState   = null;
let playbackTimer   = null;
let eventHandler    = null;
let loadEventsTotal = 0;
let loadEventsCount = 1;

const mConfig = {
  youTubeIframeIdRegEx:    /youtube-uid/i,
  soundCloudIframeIdRegEx: /soundcloud-uid/i,
  entriesSelector:         'article',
  trackTitleData:          'data-entry-track-title',
  maxPlaybackStartDelay:   3, // VERY rough estimate of "max" network buffering delay in seconds (see also: maxBufferingDelay)
};


// ************************************************************************************************
//
// ************************************************************************************************

function init(playbackSettings, mediaPlayers, playbackStateModule, playbackTimerModule)
{
  settings      = playbackSettings;
  players       = mediaPlayers;
  playbackState = playbackStateModule;
  playbackTimer = playbackTimerModule;

  initYouTubeAPI();
  initSoundCloudAPI();
}


// ************************************************************************************************
//
// ************************************************************************************************

function countPlayers(embeddedEventHandler)
{
  let playersCount = 0;

  document.querySelectorAll('iframe').forEach(element =>
  {
    if (mConfig.youTubeIframeIdRegEx.test(element.id) || mConfig.soundCloudIframeIdRegEx.test(element.id))
      playersCount++;
  });

  debug.log(`countPlayers(): ${playersCount}`);

  loadEventsTotal = playersCount + 3;     // The total number of loadEvents include 3 stages before embedded players are loaded
  eventHandler    = embeddedEventHandler; // This is set here to be available as early as possible since it is called before init()

  return playersCount;
}

function getLoadingPercent()
{
  return { loadingPercent: (100 * (loadEventsCount++ / loadEventsTotal)) };
}

function updatePlayersReady()
{
  if (loadEventsCount >= loadEventsTotal)
    eventHandler(EVENT.READY);
  else
    eventHandler(EVENT.LOADING, getLoadingPercent());
}


// ************************************************************************************************
// Get and wrap all embedder players in MediaPlayer classes
// ************************************************************************************************

function getAllPlayers()
{
  const entries = document.querySelectorAll(mConfig.entriesSelector);

  entries.forEach(entry => 
  {
    const postId     = entry.id;
    const entryTitle = entry.getAttribute(mConfig.trackTitleData);
    const iframes    = entry.querySelectorAll('iframe');

    iframes.forEach(iframe =>
    {
      const iframeId = iframe.id;
      let   player   = {};

      if (mConfig.youTubeIframeIdRegEx.test(iframeId)) 
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

        player = new mediaPlayers.YouTube(postId, iframeId, embeddedPlayer, iframe.src);
      }
      else if (mConfig.soundCloudIframeIdRegEx.test(iframeId))
      {
        /* eslint-disable */
        const embeddedPlayer = SC.Widget(iframeId);
        player = new mediaPlayers.SoundCloud(postId, iframeId, embeddedPlayer, iframe.src);

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
  if (players.isCurrent(player.getUid()) === false)
    players.stop();
  
  eventLog.add(eventSource, eventLogger.EVENT.PLAYER_ERROR, player.getUid());
  eventHandler(EVENT.MEDIA_UNAVAILABLE, getPlayerErrorData(player, mediaUrl));
}

function getPlayerErrorData(player, mediaUrl)
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
  eventHandler(EVENT.LOADING, getLoadingPercent());

  const tag = document.createElement('script');
  tag.id    = 'youtube-iframe-api';
  tag.src   = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
  
window.onYouTubeIframeAPIReady = function()
{
  debug.log('onYouTubeIframeAPIReady()');
  eventHandler(EVENT.LOADING, getLoadingPercent());

  // ToDo: THIS SHOULD NOT BE TRIGGERED HERE ONLY?
  getAllPlayers();
};

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
    case YT.PlayerState.BUFFERING: // eslint-disable-line no-undef
      {
        debug.log(`onYouTubePlayerStateChange: BUFFERING (uID: ${event.target.h.id})`);

        if (players.crossfade.isFading() === false)
        {
          const player = players.playerFromUid(event.target.h.id);
          player.mute(settings.masterMute);
          player.setVolume(settings.masterVolume);
        }
      }
      break;

    case YT.PlayerState.CUED: // eslint-disable-line no-undef
      debug.log(`onYouTubePlayerStateChange: CUED      (uID: ${event.target.h.id})`);
      break;

    case YT.PlayerState.PLAYING: // eslint-disable-line no-undef
      {
        debug.log(`onYouTubePlayerStateChange: PLAYING   (uID: ${event.target.h.id})`);
        
        // Call order is important on play events for state handling: Always sync first!
        playbackState.syncAll(event.target.h.id, playbackState.STATE.PLAY);

        players.current.setDuration(Math.round(event.target.getDuration()));
        playbackTimer.start();
      }
      break;

    case YT.PlayerState.PAUSED: // eslint-disable-line no-undef
      {
        debug.log(`onYouTubePlayerStateChange: PAUSED    (uID: ${event.target.h.id})`);

        if (players.isCurrent(event.target.h.id))
        {
          playbackState.syncAll(event.target.h.id, playbackState.STATE.PAUSE);
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
        debug.log(`onYouTubePlayerStateChange: ENDED     (uID: ${event.target.h.id})`);

        if (players.isCurrent(event.target.h.id))
        {
          playbackTimer.stop(true);
          eventHandler(EVENT.MEDIA_ENDED);
        }
        else
        {
          players.crossfade.stop();
        }
      }
      break;

    case YT.PlayerState.UNSTARTED: // eslint-disable-line no-undef
      {
        debug.log(`onYouTubePlayerStateChange: UNSTARTED (uID: ${event.target.h.id})`);
        
        if (eventLog.ytAutoPlayBlocked(event.target.h.id, 3000))
          eventHandler(EVENT.AUTOPLAY_BLOCKED);
      }
      break;

    default:
      debug.log(`onYouTubePlayerStateChange: Unknown state: ${event.data} for ${event.target.h.id}`);
  }
}

function onYouTubePlayerError(event)
{
  debug.log('onYouTubePlayerError: ' + event.data);

  const player = players.playerFromUid(event.target.h.id);
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
  eventHandler(EVENT.LOADING, getLoadingPercent());
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

  if (players.crossfade.isFading() && players.isCurrent(event.soundId))
  {
    // Call order is important on play events for state handling: Always sync first!
    if (eventLog.scPlayDoubleTrigger(event.soundId, (mConfig.maxPlaybackStartDelay * 1000)))
      playbackState.syncAll(event.soundId, playbackState.STATE.PLAY);
  }
  else
  {
    // Call order is important on play events for state handling: Always sync first!
    playbackState.syncAll(event.soundId, playbackState.STATE.PLAY);

    players.current.mute(settings.masterMute);
    players.current.setVolume(settings.masterVolume);
  }

  players.current.getEmbeddedPlayer().getDuration(durationMilliseconds =>
  {
    players.current.setDuration(Math.round(durationMilliseconds / 1000));
    playbackTimer.start();
  });  
}

function onSoundCloudPlayerEventPause(event)
{
  debug.log(`onSoundCloudPlayerEvent: PAUSE  (uID: ${event.soundId})`);
  eventLog.add(eventLogger.SOURCE.SOUNDCLOUD, eventLogger.EVENT.STATE_PAUSED, event.soundId);
  
  if (eventLog.scAutoPlayBlocked(event.soundId, 3000))
  {
    playbackTimer.stop(false);
    eventHandler(EVENT.AUTOPLAY_BLOCKED);
  }
  else if (eventLog.scWidgetPlayBlocked(event.soundId, 30000))
  {
    playbackTimer.stop(false);
    eventHandler(EVENT.PLAYBACK_BLOCKED, { currentTrack: players.trackFromUid(event.soundId), numTracks: players.getNumTracks() });
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
          playbackState.syncAll(event.soundId, playbackState.STATE.PAUSE);
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
    eventHandler(EVENT.MEDIA_ENDED);
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
