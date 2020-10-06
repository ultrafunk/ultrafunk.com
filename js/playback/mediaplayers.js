//
// Embedded media player classes, support modules and related functions
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=1.12.5';


export {
//Constants
  CROSSFADE_TYPE,
//Classes
  YouTube,
  SoundCloud,
//Functions
  getPlayers,
  setArtistTitle,
};


const debug  = debugLogger.getInstance('mediaplayers');
let config   = {};
let settings = {};

const VOLUME = {
  MIN:   0,
  MAX: 100,
};

const CROSSFADE_TYPE = {
  NONE:  -1,
  AUTO:   0,
  TRACK:  1,
};

const CROSSFADE_CURVE = {
  NONE:        -1,
  EQUAL_POWER:  0,
  LINEAR:       1,
};

// Used to split details string into Artist and Title strings
const artistTitleRegEx = /\s{1,}[–·-]\s{1,}/i;


// ************************************************************************************************
// MediaPlayer parent class
// ************************************************************************************************

class MediaPlayer
{
  constructor(postId, iframeId, embeddedPlayer)
  {
    this.postId         = postId;
    this.iframeId       = iframeId;
    this.embeddedPlayer = embeddedPlayer;
    this.playable       = true;

    this.duration    = 0;
    this.artist      = null;
    this.title       = null;

    this.thumbnailSrc       = null;
    this.thumbnail          = new Image();
    this.thumbnail.decoding = 'async';
  }
  
  getPostId()           { return this.postId;                    }
  getIframeId()         { return this.iframeId;                  }
  getUid()              { return this.iframeId;                  }
  getEmbeddedPlayer()   { return this.embeddedPlayer;            }

  getPlayable()         { return this.playable;                  }
  setPlayable(playable) { this.playable = playable;              }

  getDuration()         { return this.duration;                  }
  setDuration(duration) { this.duration = duration;              }

  getArtist()           { return this.artist;                    }
  setArtist(artist)     { this.artist = artist;                  }

  getTitle()            { return this.title;                     }
  setTitle(title)       { this.title = title;                    }

  getThumbnailSrc()     { return this.thumbnailSrc;              }

  seekTo(position)      { this.embeddedPlayer.seekTo(position);  }
  setVolume(volume)     { this.embeddedPlayer.setVolume(volume); }
}


// ************************************************************************************************
// YouTube child class
// ************************************************************************************************

class YouTube extends MediaPlayer
{
  constructor(postId, iframeId, embeddedPlayer)
  {
    super(postId, iframeId, embeddedPlayer);
    this.previousPlayerState = -1;
  }

  setThumbnail(videoId)
  {
    this.thumbnailSrc  = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    this.thumbnail.src = this.thumbnailSrc;
  }

  pause() { this.embeddedPlayer.pauseVideo(); }
  stop()  { this.embeddedPlayer.stopVideo();  }

  //
  // ToDo: Remove if no longer needed??
  // Handles YouTube iframe API edge case that causes playVideo() to silently fail with no API errors
  //
  isPlaybackError(errorHandler)
  {
    debug.log(`YouTube.play() - current playerState: ${this.embeddedPlayer.getPlayerState()} - previous playerState: ${this.previousPlayerState} - playable: ${this.playable}`);

    if ((this.embeddedPlayer.getPlayerState() === -1) && (this.previousPlayerState === -1) && (this.playable === true))
    {
      debug.warn(`MediaPlayer.YouTube.play() - Unable to play track: ${this.getArtist()} - "${this.getTitle()}" with videoId: ${this.embeddedPlayer.getVideoData().video_id} -- No YouTube API error given!`);

      this.playable = false;
      errorHandler(this, this.embeddedPlayer.getVideoUrl());

      return true;
    }

    this.previousPlayerState = this.embeddedPlayer.getPlayerState();

    return false;
  }

  play(errorHandler)
  {
    if (this.isPlaybackError(errorHandler) === false)
    {
      if (this.playable === true)
        this.embeddedPlayer.playVideo();
      else
        errorHandler(this, this.embeddedPlayer.getVideoUrl());
    }
  }

  getVolume(callback)
  {
    callback(this.embeddedPlayer.getVolume());
  }

  mute(setMute)
  {
    if (setMute)
      this.embeddedPlayer.mute();
    else
      this.embeddedPlayer.unMute();
  }

  getPosition(callback)
  {
    callback((this.embeddedPlayer.getCurrentTime() * 1000), this.duration);
  }
}


// ************************************************************************************************
// SoundCloud child class
// ************************************************************************************************

class SoundCloud extends MediaPlayer
{
  constructor(postId, iframeId, embeddedPlayer, soundId)
  {
    super(postId, iframeId, embeddedPlayer);
    this.soundId = soundId;
    this.volume  = VOLUME.MAX;
    this.muted   = false;
  }

  setThumbnail()
  {
    this.embeddedPlayer.getCurrentSound(soundObject =>
    {
      const thumbnailUrl = (soundObject.artwork_url !== null) ? soundObject.artwork_url : soundObject.user.avatar_url;

      if ((thumbnailUrl !== null) && (thumbnailUrl !== undefined))
      {
        this.thumbnailSrc  = thumbnailUrl;
        this.thumbnail.src = thumbnailUrl;
      }
    });
  }

  // Override parent getUid() because SoundCloud provides its own UID
  getUid() { return this.soundId;         }
  pause()  { this.embeddedPlayer.pause(); }
  
  play(errorHandler)
  {
    // playable is set to FALSE if the widget fires SC.Widget.Events.ERROR (track does not exist)
    if (this.playable === true)
    {
      this.embeddedPlayer.getCurrentSound(soundObject =>
      {
        if (soundObject.playable === true)
          this.embeddedPlayer.play();
        else
          errorHandler(this, soundObject.permalink_url);
      });
    }
    else
    {
      errorHandler(this, 'https://soundcloud.com');
    }
  }
  
  stop()
  {
    this.embeddedPlayer.pause();
    super.seekTo(0);
  }

  // Override parent because SoundCloud seekTo() needs milliseconds instead of just seconds
  seekTo(positionSeconds)
  {
    super.seekTo(positionSeconds * 1000);
  }
  
  getVolume(callback)
  {
    this.embeddedPlayer.getVolume(volume => callback(volume));
  }

  // Override parent setVolume() because we use it for mute() as well 
  setVolume(volume)
  {
    if (volume !== 0)
      this.volume = volume;

    if ((this.muted === false) || (volume === 0))
      super.setVolume(volume);
  }

  mute(setMute)
  {
    this.muted = setMute ? true : false;

    if (setMute)
      this.setVolume(0);
    else
      this.setVolume(this.volume);
  }

  getPosition(callback)
  {
    this.embeddedPlayer.getPosition(positionMilliseconds => callback(positionMilliseconds, this.duration));
  }
}


// ************************************************************************************************
// MediaPlayer class support functions
// ************************************************************************************************

function setArtistTitle(mediaPlayer, artistTitle)
{
  if ((artistTitle !== null) && (artistTitle.length > 0))
  {
    const match = artistTitle.match(artistTitleRegEx);
      
    if (match !== null)
    {
      mediaPlayer.artist = artistTitle.slice(0, match.index);
      mediaPlayer.title  = artistTitle.slice(match.index + match[0].length);
    }
    else
    {
      mediaPlayer.artist = artistTitle;
    }
  }
}


// ************************************************************************************************
// Media players module
// ************************************************************************************************

function getPlayers(playbackConfig, playbackSettings, playTrackCallback)
{
  config   = playbackConfig;
  settings = playbackSettings;

  const crossfade = crossfadePlayers();
  const players   = mediaPlayers(crossfade, playTrackCallback);
  crossfade.setPlayers(players);

  return players;
}

const mediaPlayers = ((crossfadePlayers, playTrackCallback) =>
{
  const crossfade    = crossfadePlayers;
  const playTrack    = playTrackCallback;
  const mediaPlayers = [];
  const indexMap     = new Map();
  let playerIndex    = 0;

  return {
  // Objects
    indexMap,
  // Functions
    get crossfade()                 { return crossfade;                          },
    add,
    getPlayerIndex()                { return playerIndex;                        },
    setPlayerIndex(nextPlayerIndex) { playerIndex = nextPlayerIndex;             },
    get current()                   { return mediaPlayers[playerIndex];          },
    get next()                      { return mediaPlayers[playerIndex + 1];      },
    getNumTracks()                  { return mediaPlayers.length;                },
    getCurrentTrack()               { return playerIndex + 1;                    },
    playerFromUid(uId)              { return mediaPlayers[indexMap.get(uId)];    },
    trackFromUid(uId)               { return (indexMap.get(uId) + 1);            },
    isCurrent(uId)                  { return (uId === this.current.getUid());    },
    uIdFromIframeId,
    stop,
    mute,
    getStatus,
    prevTrack,
    nextTrack,
    jumpToTrack,
  };

  function add(player)
  {
    debug.log(player);
    
    mediaPlayers.push(player);
    indexMap.set(player.getUid(), mediaPlayers.length - 1);
  }

  function uIdFromIframeId(iframeId)
  {
    return mediaPlayers.find(player => player.iframeId === iframeId).getUid();
  }

  function stop()
  {
    this.current.stop();
    crossfade.stop();
  }
  
  function mute()
  {
    this.current.mute(settings.masterMute);
    crossfade.mute(settings.masterMute);
  }

  function getStatus()
  {
    return {
      currentTrack: this.getCurrentTrack(),
      numTracks:    this.getNumTracks(),
      artist:       this.current.getArtist(),
      title:        this.current.getTitle(),
      thumbnailSrc: this.current.getThumbnailSrc(),
    };
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
    
    if (playerIndex < this.getNumTracks())
    {
      playTrack(playMedia);
      return true;
    }
    
    return false;
  }
  
  function jumpToTrack(track, playMedia, scrollToMedia = true)
  {
    if ((track > 0) && (track <= this.getNumTracks()))
    {
      playerIndex = track - 1;
      playTrack(playMedia, scrollToMedia);
      return true;
    }
  
    return false;
  }
});


// ************************************************************************************************
// Crossfade players module
// ************************************************************************************************

const crossfadePlayers = (() =>
{
  let players         = {};
  let isFading        = false;
  let intervalId      = -1;
  let fadeOutPlayer   = null;
  let fadeInPlayer    = null;
  let fadeLength      = 0;
  let fadeStartVolume = 0;
  let fadeType        = CROSSFADE_TYPE.NONE;
  let fadeCurve       = CROSSFADE_CURVE.NONE;
  let fadeStartTime   = 0;

  return {
    setPlayers(mediaPlayers) { players = mediaPlayers; },
    isFading()               { return isFading;        },
    init,
    start,
    stop,
    mute,
  };

  function init(crossfadeType, crossfadeCurve = 0, fadeInUid = null)
  {
    if ((isFading === false) && (set(fadeInUid) === true))
    {
      debug.log(`crossfadePlayers.init() - crossfadeType: ${debug.getObjectKeyForValue(CROSSFADE_TYPE, crossfadeType)} - crossfadeCurve: ${debug.getObjectKeyForValue(CROSSFADE_CURVE, crossfadeCurve)} - fadeInUid: ${fadeInUid}`);

      isFading        = true;
      fadeStartVolume = settings.masterVolume;
      fadeType        = crossfadeType;
      fadeCurve       = crossfadeCurve;
      
      fadeInPlayer.setVolume(0);

      if (fadeInUid === null)
        players.nextTrack(true);
      else
        players.jumpToTrack(players.trackFromUid(fadeInUid), true, false);

      return { fadeOutPlayer: players.indexMap.get(fadeOutPlayer.getUid()), fadeInPlayer: players.indexMap.get(fadeInPlayer.getUid()) };
    }

    return null;
  }

  function start(fadeInUid)
  {
    if (isFading)
    {
      fadeOutPlayer.getPosition((positionMilliseconds) =>
      {
        fadeStartTime       = ((positionMilliseconds + config.updateCrossfadeInterval) / 1000);
        const timeRemaining = fadeOutPlayer.getDuration() - fadeStartTime;
        const fadeRemaining = timeRemaining - (config.updateCrossfadeInterval / 1000);
  
        if (fadeType === CROSSFADE_TYPE.AUTO)
          fadeLength = fadeRemaining;
        else if (fadeType === CROSSFADE_TYPE.TRACK)
          fadeLength = (timeRemaining > settings.trackCrossfadeLength) ? settings.trackCrossfadeLength : fadeRemaining;

        debug.log(`crossfadePlayers.start() - fadeStartTime: ${fadeStartTime.toFixed(2)} sec - timeRemaining: ${timeRemaining.toFixed(2)} sec - fadeLength: ${fadeLength.toFixed(2)} sec - fadeInUid: ${fadeInUid}`);

        intervalId = setInterval((fadeCurve === CROSSFADE_CURVE.EQUAL_POWER) ? equalPowerFade : linearFade, config.updateCrossfadeInterval);
      });
    }
  }

  function stop()
  {
    debug.log(`crossfadePlayers.stop() - isFading: ${isFading}`);

    if (isFading)
    {
      if (intervalId !== -1)
      {
        clearInterval(intervalId);
        intervalId = -1;
      }

      if (fadeOutPlayer !== null)
      {
        fadeOutPlayer.pause();
        fadeOutPlayer.seekTo(0);

        // ToDo: Temp fix for: This might POP on fade out end, check if there is a safer way to reset the volume
        setTimeout(() =>
        {
          fadeOutPlayer.setVolume(settings.masterVolume); // ToDo: fadeStartVolume is 0 because of setTimeout()
          fadeOutPlayer = null;
        }, 200);
      }
    
      if (fadeInPlayer !== null)
      {
        // ToDo: Temp fix for: This might POP on fade out end, check if there is a safer way to reset the volume
        setTimeout(() =>
        {
          fadeInPlayer.setVolume(settings.masterVolume); // ToDo: fadeStartVolume is 0 because of setTimeout()
          fadeInPlayer = null;
        }, 200);
      }
    
      isFading        = false;
      fadeLength      = 0;
      fadeStartVolume = 0;
      fadeType        = CROSSFADE_TYPE.NONE;
      fadeCurve       = CROSSFADE_CURVE.NONE;
      fadeStartTime   = 0;
    }
  }

  function mute(setMute)
  {
    if (fadeOutPlayer !== null)
      fadeOutPlayer.mute(setMute);
  }

  function set(fadeInUid)
  {
    fadeOutPlayer = players.current;
    fadeInPlayer  = (fadeInUid === null) ? players.next : players.playerFromUid(fadeInUid);

    if (fadeOutPlayer.getPlayable() && fadeInPlayer.getPlayable())
      return true;

    return false;
  }

  //
  // https://dsp.stackexchange.com/questions/14754/equal-power-crossfade
  //
  function equalPowerFade()
  {
    fadeOutPlayer.getPosition((positionMilliseconds) =>
    {
      // Clamp negative position values
      const position     = ((positionMilliseconds / 1000) - fadeStartTime);
      const fadePosition = (position >= 0) ? position : 0;

      // Clamp negative volume values
      const volume     = fadeStartVolume - (fadeStartVolume * (fadePosition / fadeLength));
      const fadeVolume = (volume >= VOLUME.MIN) ? volume : VOLUME.MIN;

      const fadeOutVolume = Math.round(Math.sqrt(fadeStartVolume * fadeVolume));
      const fadeInVolume  = Math.round(Math.sqrt(fadeStartVolume * (fadeStartVolume - fadeVolume)));

      if ((fadePosition >= fadeLength) && (fadeVolume <= VOLUME.MIN) && (fadeInVolume >= fadeStartVolume))
      {
        stop();
      }
      else
      {
        /*
        if ((fadeOutVolume >= (VOLUME.MAX - 1)) || (fadeInVolume >= (VOLUME.MAX - 1)))
          console.log(`fadePosition: ${fadePosition.toFixed(3)} - fadeVolume: ${fadeVolume.toFixed(3)} - fadeOutVolume: ${fadeOutVolume} - fadeInVolume: ${fadeInVolume}`);
        */

        fadeOutPlayer.setVolume(fadeOutVolume);
        fadeInPlayer.setVolume(fadeInVolume);
      }
    });
  }

  function linearFade()
  {
    fadeOutPlayer.getPosition((positionMilliseconds) =>
    {
      const fadePosition  = ((positionMilliseconds / 1000) - fadeStartTime);
      const fadeInVolume  = Math.round(fadeStartVolume * (fadePosition / fadeLength));
      const fadeOutVolume = fadeStartVolume - fadeInVolume;

      if ((fadePosition > fadeLength) && (fadeOutVolume < VOLUME.MIN) && (fadeInVolume > fadeStartVolume))
      {
        stop();
      }
      else
      {
        /*
        if ((fadeOutVolume >= (VOLUME.MAX - 1)) || (fadeInVolume >= (VOLUME.MAX - 1)))
          console.log(`fadePosition: ${fadePosition.toFixed(3)} - fadeInVolume: ${fadeInVolume} - fadeOutVolume: ${fadeOutVolume}`);
        */

        fadeOutPlayer.setVolume(fadeOutVolume);
        fadeInPlayer.setVolume(fadeInVolume);
      }
    });
  }
});
