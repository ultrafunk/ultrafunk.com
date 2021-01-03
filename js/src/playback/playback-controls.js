//
// Playback UI controls
//
// https://ultrafunk.com
//


import * as debugLogger        from '../shared/debuglogger.js';
import { addSettingsObserver } from '../shared/storage.js';
import { replaceClass }        from '../shared/utils.js';
import { presetList }          from '../shared/settings.js';


export {
  init,
  ready,
  updateProgressPosition,
  updateProgressPercent,
  setDetails,
  setTimer,
  isPlaying,
  updatePrevState,
  setPlayState,
  setPauseState,
  blinkPlayPause,
  updateNextState,
};


/*************************************************************************************************/


const debug  = debugLogger.newInstance('playback-controls');
let settings = {};
let players  = {};

const mConfig = {
  progressControlsId:      'progress-controls',
  playbackControlsId:      'playback-controls',
  crossfadePresetSelector: '.crossfade-controls .preset-control',
  crossfadePresetData:     'data-crossfade-preset',
  crossfadeToSelector:     '.crossfade-controls .fadeto-control',
};

const STATE = {
  DISABLED: 'state-disabled',
  ENABLED:  'state-enabled',
  PLAY:     'state-play',
  PAUSE:    'state-pause',
};

const controls = {
//Progress Controls
  progressSeek:    { element:  null, state: STATE.DISABLED, click: null },
  progressBar:     { element:  null, state: STATE.DISABLED },
//Playback Controls
  details:         { element:  null, state: STATE.DISABLED, artistElement: null, titleElement: null },
  thumbnail:       { element:  null, state: STATE.DISABLED, img: null },
  timer:           { element:  null, state: STATE.DISABLED, positionElement: null, durationElement: null, positionSeconds: -1, durationSeconds: -1 },
  prevTrack:       { element:  null, state: STATE.DISABLED },
  playPause:       { element:  null, state: STATE.DISABLED, iconElement: null },
  nextTrack:       { element:  null, state: STATE.DISABLED },
  shuffle:         { element:  null, state: STATE.DISABLED },
  mute:            { element:  null, state: STATE.DISABLED, iconElement: null },
//Crossfade Controls
  crossfadePreset: { elements: null },
  crossfadeTo:     { elements: null, click: null },
};


// ************************************************************************************************
// Init and make ready all controls
// ************************************************************************************************

function init(playbackSettings, mediaPlayers, seekClickCallback, crossfadeClickCallback)
{
  debug.log('init()');

  settings = playbackSettings;
  players  = mediaPlayers;

  const playbackProgress = document.getElementById(mConfig.progressControlsId);

  if (playbackProgress !== null)
  {
    controls.progressSeek.element = playbackProgress.querySelector('.seek-control');
    controls.progressSeek.click   = seekClickCallback;
    controls.progressBar.element  = playbackProgress.querySelector('.bar-control');
  }
  else
  {
    debug.error(`init(): Unable to getElementById() for '#${mConfig.progressControlsId}'`);
  }

  const playbackControls = document.getElementById(mConfig.playbackControlsId);

  if (playbackControls !== null)
  {
    controls.details.element       = playbackControls.querySelector('.details-control');
    controls.details.artistElement = controls.details.element.querySelector('.details-artist');
    controls.details.titleElement  = controls.details.element.querySelector('.details-title');
    controls.thumbnail.element     = playbackControls.querySelector('.thumbnail-control');
    controls.thumbnail.img         = controls.thumbnail.element.querySelector('img');
    controls.timer.element         = playbackControls.querySelector('.timer-control');
    controls.timer.positionElement = controls.timer.element.querySelector('.timer-position');
    controls.timer.durationElement = controls.timer.element.querySelector('.timer-duration');
    controls.prevTrack.element     = playbackControls.querySelector('.prev-control');
    controls.playPause.element     = playbackControls.querySelector('.play-pause-control');
    controls.playPause.iconElement = controls.playPause.element.querySelector('i');
    controls.nextTrack.element     = playbackControls.querySelector('.next-control');
    controls.shuffle.element       = playbackControls.querySelector('.shuffle-control');
    controls.mute.element          = playbackControls.querySelector('.mute-control');
    controls.mute.iconElement      = controls.mute.element.querySelector('i');
  }
  else
  {
    debug.error(`init(): Unable to getElementById() for '#${mConfig.playbackControlsId}'`);
  }

  controls.crossfadePreset.elements = document.querySelectorAll(mConfig.crossfadePresetSelector);
  controls.crossfadeTo.elements     = document.querySelectorAll(mConfig.crossfadeToSelector);

  if ((controls.crossfadePreset.elements.length > 1) && (controls.crossfadeTo.elements.length > 1))
  {
    controls.crossfadePreset.elements.forEach((element) => setCrossfadePreset(element, settings.trackCrossfadeDefPreset));
    controls.crossfadeTo.click = crossfadeClickCallback;
  }
}

function ready(prevClick, playPauseClick, nextClick, muteClick)
{
  debug.log('ready()');

  setState(controls.progressSeek, STATE.ENABLED);
  controls.progressSeek.element.addEventListener('click', progressSeekClick);
  setState(controls.progressBar, STATE.ENABLED);
  
  setState(controls.details, STATE.ENABLED);
  setState(controls.thumbnail, STATE.ENABLED);
  setState(controls.timer, STATE.ENABLED);

  if (settings.trackThumbnailOnMobile)
    controls.thumbnail.element.classList.add('show-on-mobile');

  if (settings.trackTimesOnMobile)
    controls.timer.element.classList.add('show-on-mobile');

  setState(controls.prevTrack, STATE.DISABLED);
  controls.prevTrack.element.addEventListener('click', prevClick);

  setState(controls.playPause, STATE.PLAY);
  controls.playPause.element.addEventListener('click', playPauseClick);

  setState(controls.nextTrack, ((players.getNumTracks() > 1) ? STATE.ENABLED : STATE.DISABLED));
  controls.nextTrack.element.addEventListener('click', nextClick);

  setState(controls.shuffle, STATE.ENABLED);

  setState(controls.mute, STATE.ENABLED);
  controls.mute.element.addEventListener('click', muteClick);
  updateMuteState();

  if (players.getNumTracks() > 1)
  {
    controls.crossfadePreset.elements.forEach(element =>
    {
      element.addEventListener('click', crossfadePresetClick);
      replaceClass(element, STATE.DISABLED, STATE.ENABLED);
    });

    controls.crossfadeTo.elements.forEach(element => element.addEventListener('click', crossfadeToClick));
  }

  addSettingsObserver('autoplay',   updateAutoplayState);
  addSettingsObserver('masterMute', updateMuteState);
}

function setState(control, state = STATE.DISABLED)
{
  replaceClass(control.element, control.state, state);
  control.state = state;
  
  if (state === STATE.PLAY)
    controls.playPause.iconElement.textContent = 'play_circle_filled';
  else if (state === STATE.PAUSE)
    controls.playPause.iconElement.textContent = 'pause_circle_filled';
}


// ************************************************************************************************
// Progress bar and position seek
// ************************************************************************************************

function updateProgressPosition(positionMilliseconds, durationSeconds)
{
  // Prevent division by zero
  if (durationSeconds === 0)
    updateProgressBar(0);
  else
    updateProgressBar(positionMilliseconds / (durationSeconds * 1000));
}

function updateProgressPercent(progressPercent)
{
  updateProgressBar(progressPercent / 100);
}

function updateProgressBar(scaleX)
{
  controls.progressBar.element.style.transform = `scaleX(${scaleX})`;
}

function progressSeekClick(event)
{
  if (controls.timer.durationSeconds > 0)
  {
    const progressPercent = ((event.clientX / document.documentElement.clientWidth) * 100);
    const seekPosSeconds  = Math.round((controls.timer.durationSeconds * progressPercent) / 100);
    controls.progressSeek.click(seekPosSeconds);

    if (isPlaying() === false)
    {
      updateProgressPercent(progressPercent);
      setTimer(seekPosSeconds, controls.timer.durationSeconds);
    }
  }
}


// ************************************************************************************************
// Details (Artist + Title) and track timer
// ************************************************************************************************

function setDetails(playbackStatus)
{
  controls.details.artistElement.textContent = playbackStatus.artist || ''; // Artist will contain the post title if all else fails
  controls.details.titleElement.textContent  = playbackStatus.title  || '';
  setThumbnail(playbackStatus.thumbnailSrc);
  setTimer(-1, -1);
}

function setThumbnail(thumbnailSrc)
{
  if (thumbnailSrc !== controls.thumbnail.img.src)
  {
    controls.thumbnail.element.classList.add('loading');

    if (thumbnailSrc !== null)
      controls.thumbnail.img.src = thumbnailSrc;
    else
      controls.thumbnail.img.src = '/wp-content/themes/ultrafunk/inc/img/photo_filled_grey.png';
  
    controls.thumbnail.img.decode().then(() => { controls.thumbnail.element.classList.remove('loading'); });
  }
}

function setTimer(positionSeconds, durationSeconds)
{
  if ((positionSeconds !== -1) && (controls.timer.positionSeconds !== positionSeconds))
  {
    controls.timer.positionSeconds = positionSeconds;

    if (settings.autoplay === false)
      positionSeconds = durationSeconds - positionSeconds;
    
    setTimerText(controls.timer.positionElement, positionSeconds);
  }
  else if ((positionSeconds === -1) && (controls.timer.positionSeconds === -1))
  {
    controls.timer.positionElement.textContent = '00:00';
  }

  if ((durationSeconds !== -1) && (controls.timer.durationSeconds !== durationSeconds))
  {
    controls.timer.durationSeconds = durationSeconds;
    setTimerText(controls.timer.durationElement, durationSeconds);
  }
  else if ((durationSeconds === -1) && (controls.timer.durationSeconds === -1))
  {
    controls.timer.durationElement.textContent = '00:00';
  }
}

function setTimerText(element, seconds)
{
  const timeString = new Date(seconds * 1000).toISOString();
  element.textContent = (seconds > (60 * 60)) ? timeString.substr(11, 8) : timeString.substr(14, 5);
}

function clearTimer()
{
  controls.timer.positionElement.textContent = '00:00';
  controls.timer.durationElement.textContent = '00:00';
}


// ************************************************************************************************
// Playback controls (prev, play/pause, next and mute)
// ************************************************************************************************

function isPlaying()
{
  // ToDo: THIS NEEDS TO BE CONTROLLED IN playback.js instead of relying on UI state!?!?
  return ((controls.playPause.state === STATE.PAUSE) ? true : false);    
}

function updatePrevState()
{
  const playersStatus = players.getStatus();

  clearTimer();
  setDetails(playersStatus);

  if ((isPlaying() === false) && (playersStatus.currentTrack <= 1))
    setState(controls.prevTrack, STATE.DISABLED);
  
  if (playersStatus.currentTrack < playersStatus.numTracks)
    setState(controls.nextTrack, STATE.ENABLED);
}

function setPlayState()
{
  const playersStatus = players.getStatus();

  setState(controls.playPause, STATE.PAUSE);
  setState(controls.prevTrack, STATE.ENABLED);
  setDetails(playersStatus);
  updateCrossfadeToState(true, playersStatus.currentTrack);
}

function setPauseState()
{
  setState(controls.playPause, STATE.PLAY);
  updateCrossfadeToState(false);
}

function blinkPlayPause(toggleBlink)
{
  if (toggleBlink)
    controls.playPause.element.classList.toggle('time-remaining-warning');
  else
    controls.playPause.element.classList.remove('time-remaining-warning');
}

function updateNextState()
{
  const playersStatus = players.getStatus();
  
  clearTimer();
  setDetails(playersStatus);
  setState(controls.prevTrack, STATE.ENABLED);
  
  if (playersStatus.currentTrack >= playersStatus.numTracks)
    setState(controls.nextTrack, STATE.DISABLED);
}

function updateMuteState()
{
  controls.mute.iconElement.textContent = settings.masterMute ? 'volume_off' : 'volume_up';
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
      controls.crossfadeTo.click(players.uIdFromIframeId(iframe.id), presetList.crossfade[presetIndex]);
    }
  }
}

function updateCrossfadeToState(isPlaying, currentTrack = -1)
{
  controls.crossfadeTo.elements.forEach((element, index) =>
  {
    if (currentTrack === (index + 1))
      replaceClass(element, (isPlaying ? STATE.ENABLED : STATE.DISABLED), (isPlaying ? STATE.DISABLED : STATE.ENABLED));
    else
      replaceClass(element, (isPlaying ? STATE.DISABLED : STATE.ENABLED), (isPlaying ? STATE.ENABLED : STATE.DISABLED));
  });
}


// ************************************************************************************************
// Autoplay state changes
// ************************************************************************************************

function updateAutoplayState()
{
  if ((isPlaying() === false) && (controls.timer.positionSeconds !== -1) && ((controls.timer.durationSeconds !== -1)))
  {
    setTimerText(controls.timer.positionElement, settings.autoplay ? controls.timer.positionSeconds : (controls.timer.durationSeconds - controls.timer.positionSeconds));
    setTimerText(controls.timer.durationElement, controls.timer.durationSeconds);
  }
}

