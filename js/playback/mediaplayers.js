//
// Embedded media player classes, support modules and related functions
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=1.9.2';


export {
//Constants
  DEFAULT,
  TITLE_SOURCE,
//Classes
  YouTube,
  SoundCloud,
//Functions
  getPlayers,
  setArtistTitle,
  setArtistTitleFromServer,
};


const debug  = debugLogger.getInstance('mediaplayers');
let config   = {};
let settings = {};

const DEFAULT = {
  VOLUME_MAX: 100,
  VOLUME_MIN:   0,
};

// MediaPlayer constants
const TITLE_SOURCE = {
  GET_FROM_DATASET:  1,
  GET_FROM_SERVER:   2,
  ISSET_FROM_SERVER: 3,
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
    this.titleSource = TITLE_SOURCE.GET_FROM_DATASET;
    this.artist      = null;
    this.title       = null;

    this.thumbnailSrc       = null;
    this.thumbnail          = new Image();
    this.thumbnail.decoding = 'async';
  }
  
  getPostId()                 { return this.postId;                    }
  getIframeId()               { return this.iframeId;                  }
  getUid()                    { return this.iframeId;                  }
  getEmbeddedPlayer()         { return this.embeddedPlayer;            }

  getPlayable()               { return this.playable;                  }
  setPlayable(playable)       { this.playable = playable;              }

  getDuration()               { return this.duration;                  }
  setDuration(duration)       { this.duration = duration;              }

  setTitleSource(titleSource) { this.titleSource = titleSource;        }

  getArtist()                 { return this.artist;                    }
  setArtist(artist)           { this.artist = artist;                  }

  getTitle()                  { return this.title;                     }
  setTitle(title)             { this.title = title;                    }

  getThumbnailSrc()           { return this.thumbnailSrc;              }

  seekTo(position)            { this.embeddedPlayer.seekTo(position);  }
  setVolume(volume)           { this.embeddedPlayer.setVolume(volume); }

  setArtistTitleFromServer(artistTitle)
  {
    return setArtistTitleFromServer(this, artistTitle);
  }
}


// ************************************************************************************************
// YouTube child class
// ************************************************************************************************

class YouTube extends MediaPlayer
{
  constructor(postId, iframeId, embeddedPlayer)
  {
    super(postId, iframeId, embeddedPlayer);
  }

  setThumbnail(videoId)
  {
    this.thumbnailSrc  = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    this.thumbnail.src = this.thumbnailSrc;
  }

  pause() { this.embeddedPlayer.pauseVideo(); }
  stop()  { this.embeddedPlayer.stopVideo();  }

  play(errorHandler)
  {
    if (this.playable === true)
      this.embeddedPlayer.playVideo();
    else
      errorHandler(this, this.embeddedPlayer.getVideoUrl());
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
    callback(this.embeddedPlayer.getCurrentTime() * 1000, this.duration);
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
    this.volume  = DEFAULT.VOLUME_MAX;
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

function setArtistTitleFromServer(mediaPlayer, artistTitle)
{
  if (mediaPlayer.titleSource === TITLE_SOURCE.GET_FROM_SERVER)
  {
    if (artistTitle.match(artistTitleRegEx) !== null)
      setArtistTitle(mediaPlayer, artistTitle);
    else
      setArtistTitle(mediaPlayer, `${mediaPlayer.artist} - ${artistTitle}`);

    mediaPlayer.titleSource = TITLE_SOURCE.ISSET_FROM_SERVER;
    return true;
  }
  
  return false;
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
  let intervalId      = -1;
  let isFading        = false;
  let fadeOutPlayer   = null;
  let fadeInPlayer    = null;
  let fadeStartVolume = 0;
  let fadeStartTime   = 0;
  let fadeLength      = 0;

  return {
    setPlayers(mediaPlayers) { players = mediaPlayers; },
    isFading()               { return isFading;        },
    start,
    stop,
    mute,
  };

  function start(crossfadeStartTime, crossfadeLength, crossfadeCurve = 0, fadeInUid = null)
  {
    if ((isFading === false) && (set(fadeInUid) === true))
    {
      debug.log(`crossfadePlayers.start() - crossfadeLength: ${crossfadeLength} - crossfadeCurve: ${((crossfadeCurve === 0) ? 'EqualPower (0)' : 'Linear (1)')} - fadeInUid: ${fadeInUid}`);

      isFading = true;
      fadeInPlayer.setVolume(0);

      if (fadeInUid === null)
        players.nextTrack(true);
      else
        players.jumpToTrack(players.trackFromUid(fadeInUid), true, false);

      fadeStartTime   = crossfadeStartTime + config.bufferingDelay;
      fadeLength      = crossfadeLength - config.bufferingDelay - (config.updateCrossfadeInterval / 1000);
      fadeStartVolume = settings.masterVolume;

      // The easy and lazy way to compensate for buffering latency is +1 second...
      setTimeout(() =>
      {
        if (isFading)
        {
          const fadeFunction = (crossfadeCurve === 0) ? equalPowerFade : linearFade;
          intervalId = setInterval(fadeFunction, config.updateCrossfadeInterval);
        }
      }, (1000 - config.updateCrossfadeInterval));
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
      fadeStartVolume = 0;
      fadeStartTime   = 0;
      fadeLength      = 0;
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

  function equalPowerFade()
  {
    fadeOutPlayer.getPosition((positionMilliseconds) =>
    {
      // Clamp negative values
      const position     = ((positionMilliseconds / 1000) - fadeStartTime);
      const fadePosition = (position >= 0) ? position : 0;

      // Clamp negative values
      const volume     = fadeStartVolume - (fadeStartVolume * (fadePosition / fadeLength));
      const fadeVolume = (volume >= 0) ? volume : 0;

      const fadeOutVolume = Math.round(Math.sqrt(fadeStartVolume * fadeVolume));
      const fadeInVolume  = Math.round(Math.sqrt(fadeStartVolume * (fadeStartVolume - fadeVolume)));

      if ((fadePosition >= fadeLength) && (fadeVolume <= 0) && (fadeInVolume >= fadeStartVolume))
      {
        stop();
      }
      else
      {
        /*
        if ((fadeOutVolume === 100) || (fadeInVolume === 100))
          debug.log(`fadePosition: ${fadePosition.toFixed(3)} - fadeVolume: ${fadeVolume.toFixed(3)} - fadeOutVolume: ${fadeOutVolume} - fadeInVolume: ${fadeInVolume}`);
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

      if ((fadePosition > fadeLength) && (fadeOutVolume < 0) && (fadeInVolume > fadeStartVolume))
      {
        stop();
      }
      else
      {
        /*
        if ((fadeOutVolume === 100) || (fadeInVolume === 100))
          debug.log(`fadePosition: ${fadePosition.toFixed(3)} - fadeInVolume: ${fadeInVolume} - fadeOutVolume: ${fadeOutVolume}`);
        */

        fadeOutPlayer.setVolume(fadeOutVolume);
        fadeInPlayer.setVolume(fadeInVolume);
      }
    });
  }
});
