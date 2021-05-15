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

const m = {
  settings: {},
  players:  {},
};

const config = {
  crossfadePresetSelector: '.crossfade-preset-control',
  crossfadePresetData:     'data-crossfade-preset',
  crossfadeToSelector:     '.crossfade-fadeto-control',
};

const controls = {
  crossfadePreset: { elements: null },
  crossfadeTo:     { elements: null, click: null },
};


// ************************************************************************************************
// Init and make ready all controls
// ************************************************************************************************

function init(playbackSettings, mediaPlayers, crossfadeClickCallback)
{
  debug.log('init()');

  m.settings = playbackSettings;
  m.players  = mediaPlayers;
  
  controls.crossfadePreset.elements = document.querySelectorAll(config.crossfadePresetSelector);
  controls.crossfadeTo.elements     = document.querySelectorAll(config.crossfadeToSelector);

  if ((controls.crossfadePreset.elements.length > 1) && (controls.crossfadeTo.elements.length > 1))
  {
    controls.crossfadePreset.elements.forEach((element) => setCrossfadePreset(element, m.settings.trackCrossfadeDefPreset));
    controls.crossfadeTo.click = crossfadeClickCallback;
  }
}

function ready()
{
  debug.log('ready()');

  if ((controls.crossfadePreset.elements.length > 1) && (controls.crossfadeTo.elements.length > 1))
  {
    controls.crossfadePreset.elements.forEach(element =>
    {
      element.addEventListener('click', crossfadePresetClick);
      replaceClass(element, STATE.DISABLED.CLASS, STATE.ENABLED.CLASS);
    });

    controls.crossfadeTo.elements.forEach(element => element.addEventListener('click', crossfadeToClick));

    playbackEvents.addListener(playbackEvents.EVENT.MEDIA_PLAYING, updateCrossfadeToState);
    playbackEvents.addListener(playbackEvents.EVENT.MEDIA_PAUSED,  updateCrossfadeToState);
  }
}


// ************************************************************************************************
// Crossfade controls (preset and fadeTo)
// ************************************************************************************************

function setCrossfadePreset(element, presetIndex)
{
  element.setAttribute(config.crossfadePresetData, presetIndex);
  element.textContent = `${presetIndex + 1}`;
  element.title       = `Preset: ${presetList.crossfade[presetIndex].name}`;
}

function crossfadePresetClick(event)
{
  let presetIndex = parseInt(event.target.getAttribute(config.crossfadePresetData));
  ((presetIndex + 1) < presetList.crossfade.length) ? presetIndex++ : presetIndex = 0;
  setCrossfadePreset(event.target, presetIndex);
}

function crossfadeToClick(event)
{
  if (isPlaying() && (m.players.crossfade.isFading() === false))
  {
    const element = event.target.closest('single-track');

    if (element !== null)
    {
      const iframe      = element.querySelector('iframe');
      const presetIndex = element.querySelector(config.crossfadePresetSelector).getAttribute(config.crossfadePresetData);

      replaceClass(event.target.closest(`div${config.crossfadeToSelector}`), STATE.ENABLED.CLASS, STATE.DISABLED.CLASS);
      controls.crossfadeTo.click(m.players.uIdFromIframeId(iframe.id), presetList.crossfade[presetIndex]);
    }
  }
}

function updateCrossfadeToState()
{
  const isPlayingState = isPlaying();
  const currentTrack   = isPlayingState ? m.players.getStatus().currentTrack : -1;

  debug.log(`updateCrossfadeToState() - playingState: ${isPlayingState} - currentTrack: ${currentTrack}`);

  controls.crossfadeTo.elements.forEach((element, index) =>
  {
    if (currentTrack === (index + 1))
      replaceClass(element, (isPlayingState ? STATE.ENABLED.CLASS : STATE.DISABLED.CLASS), (isPlayingState ? STATE.DISABLED.CLASS : STATE.ENABLED.CLASS));
    else
      replaceClass(element, (isPlayingState ? STATE.DISABLED.CLASS : STATE.ENABLED.CLASS), (isPlayingState ? STATE.ENABLED.CLASS : STATE.DISABLED.CLASS));
  });
}
