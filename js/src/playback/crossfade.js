//
// Track to track crossfade module
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js';


export {
//Constants
  VOLUME,
  CROSSFADE_TYPE,
  CROSSFADE_CURVE,
//Functions
  getInstance,
};


/*************************************************************************************************/


const debug = debugLogger.getInstance('crossfade');

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


// ************************************************************************************************
// Crossfade closure
// ************************************************************************************************

const getInstance = ((playbackConfig, playbackSettings, mediaPlayers) =>
{
  let config   = playbackConfig;
  let settings = playbackSettings;
  let players  = mediaPlayers;

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
    isFading() { return isFading; },
    init,
    start,
    stop,
    mute,
  };
  
  function init(crossfadeType, crossfadeCurve = 0, fadeInUid = null)
  {
    if ((isFading === false) && (set(fadeInUid) === true))
    {
      debug.log(`init() - crossfadeType: ${debug.getObjectKeyForValue(CROSSFADE_TYPE, crossfadeType)} - crossfadeCurve: ${debug.getObjectKeyForValue(CROSSFADE_CURVE, crossfadeCurve)} - fadeInUid: ${fadeInUid}`);
  
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
  
        debug.log(`start() - fadeStartTime: ${fadeStartTime.toFixed(2)} sec - timeRemaining: ${timeRemaining.toFixed(2)} sec - fadeLength: ${fadeLength.toFixed(2)} sec - fadeInUid: ${fadeInUid}`);
  
        intervalId = setInterval((fadeCurve === CROSSFADE_CURVE.EQUAL_POWER) ? equalPowerFade : linearFade, config.updateCrossfadeInterval);
      });
    }
  }
  
  function stop()
  {
    debug.log(`stop() - isFading: ${isFading}`);
  
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
  
      if ((fadePosition > fadeLength) && (fadeOutVolume < VOLUME.MIN) && (fadeInVolume > fadeStartVolume))
      {
        stop();
      }
      else
      {
        /*
        if ((fadeOutVolume >= (VOLUME.MAX - 1)) || (fadeInVolume >= (VOLUME.MAX - 1)))
          debug.log(`fadePosition: ${fadePosition.toFixed(3)} - fadeInVolume: ${fadeInVolume} - fadeOutVolume: ${fadeOutVolume}`);
        */
  
        fadeOutPlayer.setVolume(fadeOutVolume);
        fadeInPlayer.setVolume(fadeInVolume);
      }
    });
  }
});

