//
// Playback UI controls
//
// https://ultrafunk.com
//


import * as debugLogger        from '../common/debuglogger.js?ver=1.12.3';
import { addSettingsObserver } from '../common/storage.js?ver=1.12.3';
import { replaceClass }        from '../common/utils.js?ver=1.12.3';


export {
  init,
  ready,
  updateProgressPosition,
  updateProgressPercent,
  setDetails,
  setTimer,
  isPlaying,
  updatePrevState,
  updatePlayState,
  updatePauseState,
  blinkPlayPause,
  updateNextState,
};


const debug  = debugLogger.getInstance('playback-ctrls');
let config   = {};
let settings = {};

const STATE = {
  DISABLED: 'state-disabled',
  ENABLED:  'state-enabled',
  PLAY:     'state-play',
  PAUSE:    'state-pause',
};

const controls = {
  progressSeek:   { element:  null, state: STATE.DISABLED, clickCallback: null },
  progressBar:    { element:  null, state: STATE.DISABLED },
  details:        { element:  null, state: STATE.DISABLED, artistElement: null, titleElement: null },
  thumbnail:      { element:  null, state: STATE.DISABLED, img: null },
  timer:          { element:  null, state: STATE.DISABLED, positionElement: null, durationElement: null, positionSeconds: -1, durationSeconds: -1 },
  prevTrack:      { element:  null, state: STATE.DISABLED },
  playPause:      { element:  null, state: STATE.DISABLED, iconElement: null },
  nextTrack:      { element:  null, state: STATE.DISABLED },
  shuffle:        { element:  null, state: STATE.DISABLED },
  mute:           { element:  null, state: STATE.DISABLED, iconElement: null },
  trackCrossfade: { elements: null, clickCallback: null },
};


// ************************************************************************************************
// Init and make ready all controls
// ************************************************************************************************

function init(playbackConfig, playbackSettings, seekClickCallback, crossfadeClickCallback)
{
  config   = playbackConfig;
  settings = playbackSettings;

  // Quick'n'dirty preload of this single CSS background image...
  new Image().src = "/wp-content/themes/ultrafunk/inc/img/play_pause_bg_filler.png";

  const playbackProgress = document.getElementById(config.progressControlsId);

  if (playbackProgress !== null)
  {
    controls.progressSeek.element       = playbackProgress.querySelector('.seek-control');
    controls.progressSeek.clickCallback = seekClickCallback;
    controls.progressBar.element        = playbackProgress.querySelector('.bar-control');
  }
  else
  {
    debug.error(`playbackControls.init(): Unable to getElementById() for '#${config.progressControlsId}'`);
  }

  const playbackControls = document.getElementById(config.playbackControlsId);

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
    debug.error(`playbackControls.init(): Unable to getElementById() for '#${config.playbackControlsId}'`);
  }

  controls.trackCrossfade.elements = document.querySelectorAll(config.entryMetaControlsSelector);

  if (controls.trackCrossfade.elements.length !== 0)
    controls.trackCrossfade.clickCallback = crossfadeClickCallback;
}

function ready(prevClick, playPauseClick, nextClick, muteClick, numTracks)
{
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

  setState(controls.nextTrack, ((numTracks > 1) ? STATE.ENABLED : STATE.DISABLED));
  controls.nextTrack.element.addEventListener('click', nextClick);

  setState(controls.shuffle, STATE.ENABLED);

  setState(controls.mute, STATE.ENABLED);
  controls.mute.element.addEventListener('click', muteClick);
  updateMuteState();

  if (controls.trackCrossfade.elements.length > 1)
    controls.trackCrossfade.elements.forEach(element => element.addEventListener('click', trackCrossfadeClick));

  addSettingsObserver('autoPlay',   updateAutoPlayState);
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
    controls.progressSeek.clickCallback(seekPosSeconds);

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
  controls.thumbnail.element.classList.add('loading');

  if (thumbnailSrc !== null)
    controls.thumbnail.img.src = thumbnailSrc;
  else
    controls.thumbnail.img.src = '/wp-content/themes/ultrafunk/inc/img/photo_filled_grey.png';

  controls.thumbnail.img.decode().then(() => { controls.thumbnail.element.classList.remove('loading'); });
}

function setTimer(positionSeconds, durationSeconds)
{
  if ((positionSeconds !== -1) && (controls.timer.positionSeconds !== positionSeconds))
  {
    controls.timer.positionSeconds = positionSeconds;

    if (settings.autoPlay === false)
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

function updatePrevState(playbackStatus)
{
  clearTimer();
  setDetails(playbackStatus);

  if ((isPlaying() === false) && (playbackStatus.currentTrack <= 1))
    setState(controls.prevTrack, STATE.DISABLED);
  
  if (playbackStatus.currentTrack < playbackStatus.numTracks)
    setState(controls.nextTrack, STATE.ENABLED);
}

function updatePlayState(playbackStatus)
{
  setState(controls.playPause, STATE.PAUSE);
  setState(controls.prevTrack, STATE.ENABLED);
  setDetails(playbackStatus);
  updateTrackCrossfadeState(true, playbackStatus.currentTrack);
}

function updatePauseState()
{
  setState(controls.playPause, STATE.PLAY);
  updateTrackCrossfadeState(false);
}

function blinkPlayPause(toggleBlink)
{
  if (toggleBlink)
    controls.playPause.element.classList.toggle('time-remaining-warning');
  else
    controls.playPause.element.classList.remove('time-remaining-warning');
}

function updateNextState(playbackStatus)
{
  clearTimer();
  setDetails(playbackStatus);
  setState(controls.prevTrack, STATE.ENABLED);
  
  if (playbackStatus.currentTrack >= playbackStatus.numTracks)
    setState(controls.nextTrack, STATE.DISABLED);
}

function updateMuteState()
{
  controls.mute.iconElement.textContent = settings.masterMute ? 'volume_off' : 'volume_up';
}

function trackCrossfadeClick(event)
{
  if (isPlaying())
  {
    const element = event.target.closest('article').querySelector('iframe');

    if (element !== null)
      controls.trackCrossfade.clickCallback(element.id);
  }
}

function updateTrackCrossfadeState(isPlaying, currentTrack = -1)
{
  controls.trackCrossfade.elements.forEach((element, index) =>
  {
    if (currentTrack === (index + 1))
      replaceClass(element, (isPlaying ? STATE.ENABLED : STATE.DISABLED), (isPlaying ? STATE.DISABLED : STATE.ENABLED));
    else
      replaceClass(element, (isPlaying ? STATE.DISABLED : STATE.ENABLED), (isPlaying ? STATE.ENABLED : STATE.DISABLED));
  });
}


// ************************************************************************************************
// AutoPlay state changes
// ************************************************************************************************

function updateAutoPlayState()
{
  if ((isPlaying() === false) && (controls.timer.positionSeconds > 0))
  {
    setTimerText(controls.timer.positionElement, settings.autoPlay ? controls.timer.positionSeconds : (controls.timer.durationSeconds - controls.timer.positionSeconds));
    setTimerText(controls.timer.durationElement, controls.timer.durationSeconds);
  }
}

