//
// Playback UI controls
//
// https://ultrafunk.com
//


import * as debugLogger        from '../shared/debuglogger.js';
import { replaceClass }        from '../shared/utils.js';
import { addSettingsObserver } from '../shared/storage.js';


export {
  STATE,
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


const debug = debugLogger.newInstance('playback-controls');

const m = {
  settings: {},
  players:  {},
};

const config = {
  progressControlsId: 'progress-controls',
  playbackControlsId: 'playback-controls',
};

const STATE = {
  DISABLED: { CLASS: 'state-disabled', ID: 10 },
  ENABLED:  { CLASS: 'state-enabled',  ID: 20 },
  HIDDEN:   { CLASS: 'state-hidden',   ID: 30 },
  PLAYING:  { CLASS: 'state-playing',  ID: 40 },
  PAUSED:   { CLASS: 'state-paused',   ID: 50 },
};

const controls = {
//Progress Controls
  progressSeek:    { element:  null, STATE: STATE.DISABLED, click: null },
  progressBar:     { element:  null, STATE: STATE.DISABLED },
//Playback Controls
  details:         { element:  null, STATE: STATE.DISABLED, artistElement: null, titleElement: null },
  thumbnail:       { element:  null, STATE: STATE.DISABLED, img: null },
  timer:           { element:  null, STATE: STATE.DISABLED, positionElement: null, durationElement: null, positionSeconds: -1, durationSeconds: -1 },
  prevTrack:       { element:  null, STATE: STATE.DISABLED },
  playPause:       { element:  null, STATE: STATE.DISABLED, iconElement: null },
  nextTrack:       { element:  null, STATE: STATE.DISABLED },
  repeat:          { element:  null, STATE: STATE.DISABLED, iconElement: null },
  shuffle:         { element:  null, STATE: STATE.DISABLED },
  mute:            { element:  null, STATE: STATE.DISABLED, iconElement: null },
};


// ************************************************************************************************
// Init and make ready all controls
// ************************************************************************************************

function init(playbackSettings, mediaPlayers, seekClickCallback)
{
  debug.log('init()');

  m.settings = playbackSettings;
  m.players  = mediaPlayers;

  const playbackProgress = document.getElementById(config.progressControlsId);

  if (playbackProgress !== null)
  {
    controls.progressSeek.element = playbackProgress.querySelector('.progress-seek-control');
    controls.progressSeek.click   = seekClickCallback;
    controls.progressBar.element  = playbackProgress.querySelector('.progress-bar-control');
  }
  else
  {
    debug.error(`init(): Unable to getElementById() for '#${config.progressControlsId}'`);
  }

  const playbackControls = document.getElementById(config.playbackControlsId);

  if (playbackControls !== null)
  {
    controls.details.element       = playbackControls.querySelector('.playback-details-control');
    controls.details.artistElement = controls.details.element.querySelector('.playback-details-artist');
    controls.details.titleElement  = controls.details.element.querySelector('.playback-details-title');
    controls.thumbnail.element     = playbackControls.querySelector('.playback-thumbnail-control');
    controls.thumbnail.img         = controls.thumbnail.element.querySelector('img');
    controls.timer.element         = playbackControls.querySelector('.playback-timer-control');
    controls.timer.positionElement = controls.timer.element.querySelector('.playback-timer-position');
    controls.timer.durationElement = controls.timer.element.querySelector('.playback-timer-duration');
    controls.prevTrack.element     = playbackControls.querySelector('.playback-prev-control');
    controls.playPause.element     = playbackControls.querySelector('.playback-play-pause-control');
    controls.playPause.iconElement = controls.playPause.element.querySelector('span');
    controls.nextTrack.element     = playbackControls.querySelector('.playback-next-control');
    controls.repeat.element        = playbackControls.querySelector('.playback-repeat-control');
    controls.repeat.iconElement    = controls.repeat.element.querySelector('span');
    controls.shuffle.element       = playbackControls.querySelector('.playback-shuffle-control');
    controls.mute.element          = playbackControls.querySelector('.playback-mute-control');
    controls.mute.iconElement      = controls.mute.element.querySelector('span');
  }
  else
  {
    debug.error(`init(): Unable to getElementById() for '#${config.playbackControlsId}'`);
  }
}

function ready(prevClickCallback, playPauseClickCallback, nextClickCallback, muteClickCallback)
{
  debug.log('ready()');

  setState(controls.progressSeek, STATE.ENABLED);
  controls.progressSeek.element.addEventListener('click', progressSeekClick);
  setState(controls.progressBar, STATE.ENABLED);
  
  setState(controls.details,   STATE.HIDDEN);
  setState(controls.thumbnail, STATE.HIDDEN);
  setState(controls.timer,     STATE.HIDDEN);

  if (m.settings.trackThumbnailOnMobile)
    controls.thumbnail.element.classList.add('show-on-mobile');

  if (m.settings.trackTimesOnMobile)
    controls.timer.element.classList.add('show-on-mobile');

  setState(controls.prevTrack, (m.players.getCurrentTrack() > 1) ? STATE.ENABLED : STATE.DISABLED);
  controls.prevTrack.element.addEventListener('click', prevClickCallback);

  setState(controls.playPause, STATE.PAUSED);
  controls.playPause.element.addEventListener('click', playPauseClickCallback);

  setState(controls.nextTrack, (m.players.getNumTracks() > 1) ? STATE.ENABLED : STATE.DISABLED);
  controls.nextTrack.element.addEventListener('click', nextClickCallback);

  setState(controls.repeat, STATE.ENABLED);
  setState(controls.shuffle, STATE.ENABLED);

  setState(controls.mute, STATE.ENABLED);
  controls.mute.element.addEventListener('click', muteClickCallback);
  updateMuteState();

  addSettingsObserver('autoplay',   updateAutoplayState);
  addSettingsObserver('masterMute', updateMuteState);
}

function setState(control, STATE = STATE.DISABLED)
{
  replaceClass(control.element, control.STATE.CLASS, STATE.CLASS);
  control.STATE = STATE;
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

function setDetails(playersStatus)
{
  if (controls.details.STATE.ID === STATE.HIDDEN.ID)
  {
    setState(controls.details,   STATE.ENABLED);
    setState(controls.thumbnail, STATE.ENABLED);
    setState(controls.timer,     STATE.ENABLED);
  }

  controls.details.artistElement.textContent = playersStatus.artist || ''; // Artist will contain the post title if all else fails
  controls.details.titleElement.textContent  = playersStatus.title  || '';
  setThumbnail(playersStatus.thumbnail);
  setTimer(-1, -1);
}

function setThumbnail(thumbnail)
{
  // Don't set thumbnail again if the image source / URL is unchanged
  if (thumbnail.src !== controls.thumbnail.img.src)
  {
    controls.thumbnail.element.classList.remove('type-default', 'type-youtube', 'type-soundcloud');
    controls.thumbnail.element.classList.add('loading', thumbnail.class);
    controls.thumbnail.img.src = thumbnail.src;
    controls.thumbnail.img.decode().then(() => controls.thumbnail.element.classList.remove('loading'));
  }
}

function setTimer(positionSeconds, durationSeconds)
{
  if ((positionSeconds !== -1) && (controls.timer.positionSeconds !== positionSeconds))
  {
    controls.timer.positionSeconds = positionSeconds;

    if (m.settings.autoplay === false)
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
  controls.timer.positionSeconds = 0;
  controls.timer.durationSeconds = 0;
}


// ************************************************************************************************
// Playback controls (prev, play/pause, next and mute)
// ************************************************************************************************

function isPlaying()
{
  // ToDo: This might not be the best place to save / check playback state...?
  return ((controls.playPause.STATE.ID === STATE.PLAYING.ID) ? true : false);    
}

function updatePrevState()
{
  const playersStatus = m.players.getStatus();

  clearTimer();
  setDetails(playersStatus);

  if ((isPlaying() === false) && (playersStatus.currentTrack <= 1))
    setState(controls.prevTrack, STATE.DISABLED);
  
  if (playersStatus.currentTrack < playersStatus.numTracks)
    setState(controls.nextTrack, STATE.ENABLED);
}

function setPlayState()
{
  const playersStatus = m.players.getStatus();

  setState(controls.playPause, STATE.PLAYING);
  controls.playPause.iconElement.textContent = 'pause_circle_filled';
  setState(controls.prevTrack, STATE.ENABLED);
  setDetails(playersStatus);
}

function setPauseState()
{
  setState(controls.playPause, STATE.PAUSED);
  controls.playPause.iconElement.textContent = 'play_circle_filled';
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
  const playersStatus = m.players.getStatus();
  
  clearTimer();
  setDetails(playersStatus);
  setState(controls.prevTrack, STATE.ENABLED);
  
  if (playersStatus.currentTrack >= playersStatus.numTracks)
    setState(controls.nextTrack, STATE.DISABLED);
}

function updateMuteState()
{
  controls.mute.iconElement.textContent = m.settings.masterMute ? 'volume_off' : 'volume_up';
}

function updateAutoplayState()
{
  if ((isPlaying() === false) && (controls.timer.positionSeconds !== -1) && ((controls.timer.durationSeconds !== -1)))
  {
    setTimerText(controls.timer.positionElement, m.settings.autoplay ? controls.timer.positionSeconds : (controls.timer.durationSeconds - controls.timer.positionSeconds));
    setTimerText(controls.timer.durationElement, controls.timer.durationSeconds);
  }
}
