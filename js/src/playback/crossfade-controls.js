//
// Crossfade UI controls
//
// https://ultrafunk.com
//


import * as debugLogger     from '../shared/debuglogger.js';
import * as playbackEvents  from './playback-events.js';
import { presetList }       from '../shared/settings.js';
import { replaceClass }     from '../shared/utils.js';
import { STATE, isPlaying } from './playback-controls.js';


export {
  init,
  ready,
};


/*************************************************************************************************/


const debug  = debugLogger.newInstance('crossfade-controls');
let settings = {};
let players  = {};

const mConfig = {
  crossfadePresetSelector: '.crossfade-controls .preset-control',
  crossfadePresetData:     'data-crossfade-preset',
  crossfadeToSelector:     '.crossfade-controls .fadeto-control',
};

const mControls = {
  crossfadePreset: { elements: null },
  crossfadeTo:     { elements: null, click: null },
};


// ************************************************************************************************
// Init and make ready all controls
// ************************************************************************************************

function init(playbackSettings, mediaPlayers, crossfadeClickCallback)
{
  debug.log('init()');

  settings = playbackSettings;
  players  = mediaPlayers;
  
  mControls.crossfadePreset.elements = document.querySelectorAll(mConfig.crossfadePresetSelector);
  mControls.crossfadeTo.elements     = document.querySelectorAll(mConfig.crossfadeToSelector);

  if ((mControls.crossfadePreset.elements.length > 1) && (mControls.crossfadeTo.elements.length > 1))
  {
    mControls.crossfadePreset.elements.forEach((element) => setCrossfadePreset(element, settings.trackCrossfadeDefPreset));
    mControls.crossfadeTo.click = crossfadeClickCallback;
  }
}

function ready()
{
  debug.log('ready()');

  if ((mControls.crossfadePreset.elements.length > 1) && (mControls.crossfadeTo.elements.length > 1))
  {
    mControls.crossfadePreset.elements.forEach(element =>
    {
      element.addEventListener('click', crossfadePresetClick);
      replaceClass(element, STATE.DISABLED, STATE.ENABLED);
    });

    mControls.crossfadeTo.elements.forEach(element => element.addEventListener('click', crossfadeToClick));

    playbackEvents.addListener(playbackEvents.EVENT.MEDIA_PLAYING, updateCrossfadeToState);
    playbackEvents.addListener(playbackEvents.EVENT.MEDIA_PAUSED,  updateCrossfadeToState);
  }
}


// ************************************************************************************************
// Crossfade controls (preset and fadeTo)
// ************************************************************************************************

function setCrossfadePreset(element, presetIndex)
{
  element.setAttribute(mConfig.crossfadePresetData, presetIndex);
  element.textContent = `${presetIndex + 1}`;
  element.title       = `Preset: ${presetList.crossfade[presetIndex].name}`;
}

function crossfadePresetClick(event)
{
  let presetIndex = parseInt(event.target.getAttribute(mConfig.crossfadePresetData));
  ((presetIndex + 1) < presetList.crossfade.length) ? presetIndex++ : presetIndex = 0;
  setCrossfadePreset(event.target, presetIndex);
}

function crossfadeToClick(event)
{
  if (isPlaying() && (players.crossfade.isFading() === false))
  {
    const element = event.target.closest('single-track');

    if (element !== null)
    {
      const iframe      = element.querySelector('iframe');
      const presetIndex = element.querySelector(mConfig.crossfadePresetSelector).getAttribute(mConfig.crossfadePresetData);

      replaceClass(event.target.closest('div.fadeto-control'), STATE.ENABLED, STATE.DISABLED);
      mControls.crossfadeTo.click(players.uIdFromIframeId(iframe.id), presetList.crossfade[presetIndex]);
    }
  }
}

function updateCrossfadeToState()
{
  const isPlayingState = isPlaying();
  const currentTrack   = isPlayingState ? players.getStatus().currentTrack : -1;

  debug.log(`updateCrossfadeToState() - playingState: ${isPlayingState} - currentTrack: ${currentTrack}`);

  mControls.crossfadeTo.elements.forEach((element, index) =>
  {
    if (currentTrack === (index + 1))
      replaceClass(element, (isPlayingState ? STATE.ENABLED : STATE.DISABLED), (isPlayingState ? STATE.DISABLED : STATE.ENABLED));
    else
      replaceClass(element, (isPlayingState ? STATE.DISABLED : STATE.ENABLED), (isPlayingState ? STATE.ENABLED : STATE.DISABLED));
  });
}
