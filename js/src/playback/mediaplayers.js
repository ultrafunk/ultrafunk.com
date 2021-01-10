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
  setArtistTitle,
  getYouTubeImgUrl,
  getInstance,
};


/*************************************************************************************************/


const debug = debugLogger.newInstance('mediaplayers');

// Used to split details string into Artist and Title strings
const artistTitleRegEx = /\s{1,}[–·-]\s{1,}/i;


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

  seekTo(position)      { this.embeddedPlayer.seekTo(position);  }
  setVolume(volume)     { this.embeddedPlayer.setVolume(volume); }

  setThumbnail(thumbnailSrc)
  {
    this.thumbnailSrc  = thumbnailSrc;
    this.thumbnail.src = thumbnailSrc;
  }
}


// ************************************************************************************************
// YouTube child class
// ************************************************************************************************

class YouTube extends MediaPlayer
{
  constructor(trackId, iframeId, embeddedPlayer, iframeSrc)
  {
    super(trackId, iframeId, embeddedPlayer);
    this.previousPlayerState = -1;
    this.setThumbnail(getYouTubeImgUrl(iframeSrc));
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
    this.embeddedPlayer.getCurrentSound(soundObject =>
    {
      const thumbnailUrl = (soundObject.artwork_url !== null) ? soundObject.artwork_url : soundObject.user.avatar_url;

      if ((thumbnailUrl !== null) && (thumbnailUrl !== undefined))
        super.setThumbnail(thumbnailUrl);
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
// MediaPlayer class support functions
// ************************************************************************************************

function setArtistTitle(artistTitle, destination, matchRegEx = artistTitleRegEx)
{
  if ((artistTitle !== null) && (artistTitle.length > 0))
  {
    destination.artist = artistTitle;
    destination.title  = '';

    const match = artistTitle.match(matchRegEx);

    if (match !== null)
    {
      destination.artist = artistTitle.slice(0, match.index);
      destination.title  = artistTitle.slice(match.index + match[0].length);
    }
  }
}

function getYouTubeImgUrl(iframeSrc, fallbackUrl = '/wp-content/themes/ultrafunk/inc/img/photo_filled_grey.png')
{
  const iframeSrcParts = new URL(decodeURIComponent(iframeSrc));
  const pathnameParts  = iframeSrcParts.pathname.split('/embed/');

  if ((pathnameParts.length === 2) && (pathnameParts[1].length === 11))
  {
    return `https://img.youtube.com/vi/${pathnameParts[1]}/default.jpg`;
  }
  else
  {
    debug.warn('getYouTubeImgUrl() failed for: ' + iframeSrc);
    return fallbackUrl;
  }
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
