//
// Embedded media player classes and handling module
//
// https://ultrafunk.com
//


import * as debugLogger     from '../shared/debuglogger.js';
import * as crossfadeModule from './crossfade.js';


export {
  YouTube,
  SoundCloud,
  Playlist,
  getYouTubeImgUrl,
  getInstance,
};


/*************************************************************************************************/


const debug = debugLogger.newInstance('mediaplayers');


// ************************************************************************************************
// MediaPlayer parent class
// ************************************************************************************************

class MediaPlayer
{
  constructor(trackId, iframeId, embeddedPlayer)
  {
    this.trackId        = trackId;
    this.iframeId       = iframeId;
    this.embeddedPlayer = embeddedPlayer;
    this.playable       = true;

    this.duration = 0;
    this.artist   = null;
    this.title    = null;

    this.thumbnailSrc       = null;
    this.thumbnailClass     = 'type-default';
    this.thumbnail          = new Image();
    this.thumbnail.decoding = 'async';
  }
  
  getTrackId()          { return this.trackId;                   }
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
  getThumbnailClass()   { return this.thumbnailClass;            }

  seekTo(position)      { this.embeddedPlayer.seekTo(position);  }
  setVolume(volume)     { this.embeddedPlayer.setVolume(volume); }

  setThumbnail(thumbnail)
  {
    this.thumbnailSrc   = thumbnail.src;
    this.thumbnailClass = thumbnail.class;
    this.thumbnail.src  = thumbnail.src;
  }
}


// ************************************************************************************************
// YouTube child class
// ************************************************************************************************

class YouTube extends MediaPlayer
{
  constructor(trackId, iframeId, embeddedPlayer, trackSourceUrl)
  {
    super(trackId, iframeId, embeddedPlayer);
    this.previousPlayerState = -1;
    super.setThumbnail(getYouTubeImgUrl(trackSourceUrl));
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
  constructor(trackId, iframeId, embeddedPlayer, iframeSrc)
  {
    super(trackId, iframeId, embeddedPlayer);
    this.soundId = this.getSoundId(iframeSrc);
    this.volume  = crossfadeModule.VOLUME.MAX;
    this.muted   = false;
  }

  getSoundId(iframeSrc)
  {
    if (iframeSrc !== undefined)
    {
      const iframeSrcParts = new URL(decodeURIComponent(iframeSrc));
      const trackUrl       = iframeSrcParts.searchParams.get('url');
      
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
    
    debug.error(`MediaPlayer.SoundCloud.getSoundId() failed for: ${this.iframeId}`);

    return null;
  }

  setThumbnail()
  {
    this.embeddedPlayer.getCurrentSound(soundObject => super.setThumbnail(getSoundCloudImgUrl(soundObject)));
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
    this.pause();
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
// Playlist child class
// ************************************************************************************************

class Playlist extends MediaPlayer
{
  constructor(embeddedPlayer)
  {
    super(null, null, embeddedPlayer);
    this.numTracks    = 3;
    this.currentTrack = 2;
  }

  get embedded()    { return this.embeddedPlayer; }
  getNumTracks()    { return this.numTracks;      }
  getCurrentTrack() { return this.currentTrack;   }

  setThumbnail(video_id)
  {
    super.setThumbnail(getYouTubeImgUrl(`youtube.com/watch?v=${video_id}`));
  }

  getStatus()
  {
    return {
      currentTrack: this.getCurrentTrack(),
      numTracks:    this.getNumTracks(),
      artist:       this.getArtist(),
      title:        this.getTitle(),
      thumbnail:    { src: this.getThumbnailSrc(), class: this.getThumbnailClass() },
    };
  }
}


// ************************************************************************************************
// MediaPlayer class support functions
// ************************************************************************************************

// Default / fallback track thumbnail object
const defThumbnailObj = { src: '/wp-content/themes/ultrafunk/inc/img/photo_filled_grey.png', class: 'type-default' };
const youTubeIdRegEx  = /[0-9A-Za-z_-]{10}[048AEIMQUYcgkosw]/;

function getYouTubeImgUrl(trackSourceUrl)
{
  const video_id = trackSourceUrl.match(youTubeIdRegEx);

  if (video_id !== null)
    return { src: `https://img.youtube.com/vi/${video_id[0]}/default.jpg`, class: 'type-youtube', uid: video_id[0] };

  return defThumbnailObj;
}

function getSoundCloudImgUrl(soundObject)
{
  const thumbnailSrc = (soundObject.artwork_url !== null) ? soundObject.artwork_url : soundObject.user.avatar_url;

  if ((thumbnailSrc !== null) && (thumbnailSrc !== undefined))
    return { src: thumbnailSrc, class: 'type-soundcloud' };

  return defThumbnailObj;
}


// ************************************************************************************************
// Media players closure
// ************************************************************************************************

const getInstance = (() =>
{
  let settings       = null;
  let playTrack      = null;
  let crossfade      = null;
  const mediaPlayers = [];
  const indexMap     = new Map();
  let playerIndex    = 0;

  return {
  // Objects
    indexMap,
  // Functions
    init,
    get crossfade()                 { return crossfade;                       },
    add,
    getPlayerIndex()                { return playerIndex;                     },
    setPlayerIndex(nextPlayerIndex) { playerIndex = nextPlayerIndex;          },
    get current()                   { return mediaPlayers[playerIndex];       },
    get next()                      { return mediaPlayers[playerIndex + 1];   },
    getNumTracks()                  { return mediaPlayers.length;             },
    getCurrentTrack()               { return playerIndex + 1;                 },
    playerFromUid(uId)              { return mediaPlayers[indexMap.get(uId)]; },
    trackFromUid(uId)               { return (indexMap.get(uId) + 1);         },
    isCurrent(uId)                  { return (uId === this.current.getUid()); },
    uIdFromIframeId,
    stop,
    mute,
    getStatus,
    prevTrack,
    nextTrack,
    jumpToTrack,
  };

  function init(playbackSettings, playTrackCallback)
  {
    debug.log('init()');

    settings  = playbackSettings;
    playTrack = playTrackCallback;
    crossfade = crossfadeModule.getInstance(playbackSettings, this);
  }

  function add(player)
  {
    debug.log(player);
    
    mediaPlayers.push(player);
    indexMap.set(player.getUid(), mediaPlayers.length - 1);
  }

  function uIdFromIframeId(iframeId)
  {
    return mediaPlayers.find(player => (player.iframeId === iframeId)).getUid();
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
      thumbnail:    { src: this.current.getThumbnailSrc(), class: this.current.getThumbnailClass() },
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
