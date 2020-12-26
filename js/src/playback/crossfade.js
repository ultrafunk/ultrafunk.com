//
// Track to track crossfade module
//
// https://ultrafunk.com
//


import * as debugLogger from '../shared/debuglogger.js';
//import { showSnackbar } from '../shared/snackbar.js';


export {
  VOLUME,
  TYPE as CROSSFADE_TYPE,
  getInstance,
};


/*************************************************************************************************/


const debug = debugLogger.newInstance('crossfade');

const VOLUME = {
  MIN:   0,
  MAX: 100,
};

const TYPE = {
  NONE:  -1,
  AUTO:   0,
  TRACK:  1,
};

const CURVE = {
  NONE:        -1,
  EQUAL_POWER:  0,
  LINEAR:       1,
};

const mConfig = {
  intervalEqPow:   33, // Milliseconds between each crossfade update event
  intervalLinear: 100,
};


// ************************************************************************************************
// Crossfade closure
// ************************************************************************************************

const getInstance = ((playbackSettings, mediaPlayers) =>
{
  const settings = playbackSettings;
  const players  = mediaPlayers;

  let isFading        = false;
  let intervalId      = -1;
  let fadeOutPlayer   = null;
  let fadeInPlayer    = null;
  let fadeLength      = 0;
  let fadeStartVolume = 0;
  let fadeType        = TYPE.NONE;
  let fadePreset      = null;
  let fadeStartTime   = 0;

  /*
  let perfCounter   = 0;
  let perfTimeTotal = 0;
  */

  return {
    isFading() { return isFading; },
    init,
    start,
    stop,
    mute,
  };
  
  function init(crossfadeType, crossfadePreset, fadeInUid = null)
  {
    if ((isFading === false) && (set(fadeInUid) === true))
    {
      debug.log(`init() - type: ${debug.getObjectKeyForValue(TYPE, crossfadeType)} - fadeInUid: ${fadeInUid} - preset: ${crossfadePreset.length} sec ${debug.getObjectKeyForValue(CURVE, crossfadePreset.curve)} (Name: ${crossfadePreset.name})`);
  
      isFading        = true;
      fadeStartVolume = settings.masterVolume;
      fadeType        = crossfadeType;
      fadePreset      = crossfadePreset;
      
      fadeInPlayer.setVolume(0);
  
      if (fadeInUid === null)
        players.nextTrack(true);
      else
        players.jumpToTrack(players.trackFromUid(fadeInUid), true, false);
  
      return { fadeOutPlayer: players.indexMap.get(fadeOutPlayer.getUid()), fadeInPlayer: players.indexMap.get(fadeInPlayer.getUid()) };
    }
  
    return null;
  }
  
  function start()
  {
    if (isFading)
    {
      fadeOutPlayer.getPosition((positionMilliseconds) =>
      {
        const updateInterval = (fadePreset.curve === CURVE.EQUAL_POWER) ? mConfig.intervalEqPow : mConfig.intervalLinear;
        fadeStartTime        = ((positionMilliseconds + updateInterval) / 1000);
        const timeRemaining  = fadeOutPlayer.getDuration() - fadeStartTime;
        const fadeRemaining  = timeRemaining - (updateInterval / 1000);
  
        if (fadeType === TYPE.AUTO)
          fadeLength = fadeRemaining;
        else if (fadeType === TYPE.TRACK)
          fadeLength = (timeRemaining > fadePreset.length) ? fadePreset.length : fadeRemaining;
  
        debug.log(`start() - fadeStartTime: ${fadeStartTime.toFixed(2)} sec - timeRemaining: ${timeRemaining.toFixed(2)} sec - fadeLength: ${fadeLength.toFixed(2)} sec - updateInterval: ${updateInterval} ms`);
  
        intervalId = setInterval((fadePreset.curve === CURVE.EQUAL_POWER) ? equalPowerFade : linearFade, updateInterval);
      });
    }
  }
  
  function stop()
  {
    debug.log(`stop() - isFading: ${isFading}`);
  
    if (isFading)
    {
      /*
      const perfMean   = perfTimeTotal / perfCounter;
      const perfString = `${fadePreset.name} | <b>Intervals:</b> ${perfCounter} | <b>Total Time:</b> ${perfTimeTotal.toFixed(0)} ms | <b>Mean:</b> ${perfMean.toFixed(2)} ms`;
      showSnackbar(perfString, 30);
      debug.log(perfString);
      */

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
        fadeInPlayer = null;
    
      isFading        = false;
      fadeLength      = 0;
      fadeStartVolume = 0;
      fadeType        = TYPE.NONE;
      fadePreset      = null;
      fadeStartTime   = 0;

      /*
      perfCounter   = 0;
      perfTimeTotal = 0;
      */
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
    /*
    let startTime = performance.now();
    perfCounter++;
    */

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
  
      /*
      if (debug.isDebug())
      {
        if ((fadeOutVolume >= (VOLUME.MAX - 1)) || (fadeInVolume >= (VOLUME.MAX - 1)))
          debug.log(`fadePosition: ${fadePosition.toFixed(3)} - fadeVolume: ${fadeVolume.toFixed(3)} - fadeOutVolume: ${fadeOutVolume} - fadeInVolume: ${fadeInVolume}`);
      }
      */

      if ((fadePosition >= fadeLength) && (fadeVolume <= VOLUME.MIN) && (fadeInVolume >= fadeStartVolume))
      {
        fadeOutPlayer.setVolume(VOLUME.MIN);
        fadeInPlayer.setVolume(fadeStartVolume);
        stop();
      }
      else
      {
        fadeOutPlayer.setVolume(fadeOutVolume);
        fadeInPlayer.setVolume(fadeInVolume);
      }

      /*
      perfTimeTotal += (performance.now() - startTime);
      */
    });
  }
  
  function linearFade()
  {
    /*
    let startTime = performance.now();
    perfCounter++;
    */

    fadeOutPlayer.getPosition((positionMilliseconds) =>
    {
      const fadePosition  = ((positionMilliseconds / 1000) - fadeStartTime);
      const fadeInVolume  = Math.round(fadeStartVolume * (fadePosition / fadeLength));
      const fadeOutVolume = fadeStartVolume - fadeInVolume;
  
      /*
      if (debug.isDebug())
      {
        if ((fadeOutVolume >= (VOLUME.MAX - 1)) || (fadeInVolume >= (VOLUME.MAX - 1)))
          debug.log(`fadePosition: ${fadePosition.toFixed(3)} - fadeInVolume: ${fadeInVolume} - fadeOutVolume: ${fadeOutVolume}`);
      }
      */
  
      if ((fadePosition > fadeLength) && (fadeOutVolume < VOLUME.MIN) && (fadeInVolume > fadeStartVolume))
      {
        fadeOutPlayer.setVolume(VOLUME.MIN);
        fadeInPlayer.setVolume(fadeStartVolume);
        stop();
      }
      else
      {
        fadeOutPlayer.setVolume(fadeOutVolume);
        fadeInPlayer.setVolume(fadeInVolume);
      }

      /*
      perfTimeTotal += (performance.now() - startTime);
      */
    });
  }
});
