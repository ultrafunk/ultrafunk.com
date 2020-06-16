//
// Embedded media player classes
//
// https://ultrafunk.com
//


export {
//Constants
  DEFAULT,
  DATA_SOURCE,
//Classes
  YouTube,
  SoundCloud,
};


const DEFAULT = {
  VOLUME_MAX: 100,
  VOLUME_MIN:   0,
};

// MediaPlayer constants
const DATA_SOURCE = {
  GET_FROM_POST_TITLE: 1,
  GET_FROM_SERVER:     2,
  ISSET_FROM_SERVER:   3,
};

// Used to split details string into Artist and Title strings
const artistTitleRegEx = /\s{1,}[–·-]\s{1,}/i;


// ************************************************************************************************
// MediaPlayer base class
// ************************************************************************************************

class MediaPlayer
{
  constructor(postId, iframeId, embeddedPlayer)
  {
    this.postId         = postId;
    this.iframeId       = iframeId;
    this.embeddedPlayer = embeddedPlayer;
    this.playable       = true;

    this.duration   = 0;
    this.dataSource = DATA_SOURCE.GET_FROM_POST_TITLE;
    this.artist     = null;
    this.title      = null;
  }
  
  getPostId()               { return this.postId;           }
  getIframeId()             { return this.iframeId;         }
  getUid()                  { return this.iframeId;         }
  getEmbeddedPlayer()       { return this.embeddedPlayer;   }

  setPlayable(playable)     { this.playable = playable;     }

  getDuration()             { return this.duration;         }
  setDuration(duration)     { this.duration = duration;     }

  getDataSource()           { return this.dataSource;       }
  setDataSource(dataSource) { this.dataSource = dataSource; }

  getArtist()               { return this.artist;           }
  setArtist(artist)         { this.artist = artist;         }

  getTitle()                { return this.title;            }
  setTitle(title)           { this.title = title;           }

  setArtistTitle(artistTitle)
  {
    if ((artistTitle !== null) && (artistTitle.length > 0))
    {
      const match = artistTitle.match(artistTitleRegEx);
        
      if (match !== null)
      {
        this.artist = artistTitle.slice(0, match.index);
        this.title  = artistTitle.slice(match.index + match[0].length);
      }
      else
      {
        this.artist = artistTitle;
      }
    }
  }

  setArtistTitleFromServer(artistTitle)
  {
    if (this.dataSource === DATA_SOURCE.GET_FROM_SERVER)
    {
      if (artistTitle.match(artistTitleRegEx) !== null)
        this.setArtistTitle(artistTitle);
      else
        this.setArtistTitle(`${this.artist} - ${artistTitle}`);

      this.dataSource = DATA_SOURCE.ISSET_FROM_SERVER;
      return true;
    }
    
    return false;
  }

  seekTo(position)  { this.embeddedPlayer.seekTo(position);  }
  setVolume(volume) { this.embeddedPlayer.setVolume(volume); }
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

  pause() { this.embeddedPlayer.pauseVideo(); }
  stop()  { this.embeddedPlayer.stopVideo();  }

  play(playerErrorCallback)
  {
    if (this.playable === true)
      this.embeddedPlayer.playVideo();
    else
      playerErrorCallback(this, this.embeddedPlayer.getVideoUrl());
  }

  getVolumeCallback(volumeCallback)
  {
    volumeCallback(this.embeddedPlayer.getVolume());
  }

  mute(setMute)
  {
    if (setMute)
      this.embeddedPlayer.mute();
    else
      this.embeddedPlayer.unMute();
  }

  getPositionCallback(positionCallback)
  {
    positionCallback(this.embeddedPlayer.getCurrentTime() * 1000, this.duration);
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
  }

  // Override parent getUid() because SoundCloud provides its own UID
  getUid() { return this.soundId;         }
  pause()  { this.embeddedPlayer.pause(); }
  
  play(playerErrorCallback)
  {
    // playable is set to FALSE if the widget fires SC.Widget.Events.ERROR (track does not exist)
    if (this.playable === true)
    {
      this.embeddedPlayer.getCurrentSound(soundObject =>
      {
        if (soundObject.playable === true)
          this.embeddedPlayer.play();
        else
          playerErrorCallback(this, soundObject.permalink_url);
      });
    }
    else
    {
      playerErrorCallback(this, 'https://soundcloud.com');
    }
  }
  
  stop()
  {
    this.embeddedPlayer.pause();
    this.seekTo(0);
  }

  // Override parent because SoundCloud seekTo() needs milliseconds instead of just seconds
  seekTo(positionSeconds)
  {
    this.embeddedPlayer.seekTo(positionSeconds * 1000);
  }
  
  getVolumeCallback(volumeCallback)
  {
    this.embeddedPlayer.getVolume(volume => volumeCallback(volume));
  }

  // Override parent setVolume() because we use it for mute() as well 
  setVolume(volume)
  {
    if (volume !== 0)
      this.volume = volume;

    this.embeddedPlayer.setVolume(volume);
  }

  mute(setMute)
  {
    if (setMute)
      this.setVolume(0);
    else
      this.setVolume(this.volume);
  }

  getPositionCallback(positionCallback)
  {
    this.embeddedPlayer.getPosition(positionMilliseconds => positionCallback(positionMilliseconds, this.duration));
  }
}
