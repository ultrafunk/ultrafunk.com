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
  REPEAT,
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
  getRepeatMode,
};


/*************************************************************************************************/


const debug = debugLogger.newInstance('playback-controls');

const m = {
  settings: {},
  players:  {},
};

const STATE = {
  DISABLED: { CLASS: 'state-disabled', ID: 10 },
  ENABLED:  { CLASS: 'state-enabled',  ID: 20 },
  HIDDEN:   { CLASS: 'state-hidden',   ID: 30 },
  PLAYING:  { CLASS: 'state-playing',  ID: 40 },
  PAUSED:   { CLASS: 'state-paused',   ID: 50 },
};

const ctrl = {
//Progress Controls
  progressSeek:    { element: null, STATE: STATE.DISABLED, click: null },
  progressBar:     { element: null, STATE: STATE.DISABLED },
//Playback Controls
  details:         { element: null, STATE: STATE.DISABLED, artist: null, title: null },
  thumbnail:       { element: null, STATE: STATE.DISABLED, img: null },
  timer:           { element: null, STATE: STATE.DISABLED, position: null, duration: null, positionSeconds: -1, durationSeconds: -1 },
  prevTrack:       { element: null, STATE: STATE.DISABLED },
  playPause:       { element: null, STATE: STATE.DISABLED, icon: null },
  nextTrack:       { element: null, STATE: STATE.DISABLED },
  repeat:          { element: null, STATE: STATE.DISABLED, icon: null },
  shuffle:         { element: null, STATE: STATE.DISABLED },
  mute:            { element: null, STATE: STATE.DISABLED, icon: null },
};


// ************************************************************************************************
// Init and make ready all controls
// ************************************************************************************************

function init(playbackSettings, mediaPlayers, seekClickCallback)
{
  debug.log('init()');

  m.settings = playbackSettings;
  m.players  = mediaPlayers;

  const playbackProgress = document.getElementById('progress-controls');

  if (playbackProgress !== null)
  {
    ctrl.progressSeek.element = playbackProgress.querySelector('.progress-seek-control');
    ctrl.progressSeek.click   = seekClickCallback;
    ctrl.progressBar.element  = playbackProgress.querySelector('.progress-bar-control');
  }
  else
  {
    debug.error('init(): Unable to getElementById() for #progress-controls');
  }

  const playbackControls = document.getElementById('playback-controls');

  if (playbackControls !== null)
  {
    ctrl.details.element   = playbackControls.querySelector('.playback-details-control');
    ctrl.details.artist    = ctrl.details.element.querySelector('.playback-details-artist');
    ctrl.details.title     = ctrl.details.element.querySelector('.playback-details-title');
    ctrl.thumbnail.element = playbackControls.querySelector('.playback-thumbnail-control');
    ctrl.thumbnail.img     = ctrl.thumbnail.element.querySelector('img');
    ctrl.timer.element     = playbackControls.querySelector('.playback-timer-control');
    ctrl.timer.position    = ctrl.timer.element.querySelector('.playback-timer-position');
    ctrl.timer.duration    = ctrl.timer.element.querySelector('.playback-timer-duration');
    ctrl.prevTrack.element = playbackControls.querySelector('.playback-prev-control');
    ctrl.playPause.element = playbackControls.querySelector('.playback-play-pause-control');
    ctrl.playPause.icon    = ctrl.playPause.element.querySelector('span');
    ctrl.nextTrack.element = playbackControls.querySelector('.playback-next-control');
    ctrl.repeat.element    = playbackControls.querySelector('.playback-repeat-control');
    ctrl.repeat.icon       = ctrl.repeat.element.querySelector('span');
    ctrl.shuffle.element   = playbackControls.querySelector('.playback-shuffle-control');
    ctrl.mute.element      = playbackControls.querySelector('.playback-mute-control');
    ctrl.mute.icon         = ctrl.mute.element.querySelector('span');
  }
  else
  {
    debug.error('init(): Unable to getElementById() for #playback-controls');
  }
}

function ready(prevClickCallback, playPauseClickCallback, nextClickCallback, muteClickCallback)
{
  debug.log('ready()');

  setState(ctrl.progressSeek, STATE.ENABLED);
  ctrl.progressSeek.element.addEventListener('click', progressSeekClick);
  setState(ctrl.progressBar, STATE.ENABLED);
  
  setState(ctrl.details,   STATE.HIDDEN);
  setState(ctrl.thumbnail, STATE.HIDDEN);
  setState(ctrl.timer,     STATE.HIDDEN);

  if (m.settings.trackThumbnailOnMobile)
    ctrl.thumbnail.element.classList.add('show-on-mobile');

  if (m.settings.trackTimesOnMobile)
    ctrl.timer.element.classList.add('show-on-mobile');

  setState(ctrl.prevTrack, (m.players.getCurrentTrack() > 1) ? STATE.ENABLED : STATE.DISABLED);
  ctrl.prevTrack.element.addEventListener('click', prevClickCallback);

  setState(ctrl.playPause, STATE.PAUSED);
  ctrl.playPause.element.addEventListener('click', playPauseClickCallback);

  setState(ctrl.nextTrack, (m.players.getNumTracks() > 1) ? STATE.ENABLED : STATE.DISABLED);
  ctrl.nextTrack.element.addEventListener('click', () => nextClickCallback());

  setState(ctrl.repeat, STATE.ENABLED);
  ctrl.repeat.element.addEventListener('click', repeatClick);

  setState(ctrl.shuffle, STATE.ENABLED);

  setState(ctrl.mute, STATE.ENABLED);
  ctrl.mute.element.addEventListener('click', muteClickCallback);
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
  ctrl.progressBar.element.style.transform = `scaleX(${scaleX})`;
}

function progressSeekClick(event)
{
  if (ctrl.timer.durationSeconds > 0)
  {
    const progressPercent = ((event.clientX / document.documentElement.clientWidth) * 100);
    const seekPosSeconds  = Math.round((ctrl.timer.durationSeconds * progressPercent) / 100);
    ctrl.progressSeek.click(seekPosSeconds);

    if (isPlaying() === false)
    {
      updateProgressPercent(progressPercent);
      setTimer(seekPosSeconds, ctrl.timer.durationSeconds);
    }
  }
}


// ************************************************************************************************
// Details (Artist + Title) and track timer
// ************************************************************************************************

function setDetails(playersStatus)
{
  if (ctrl.details.STATE.ID === STATE.HIDDEN.ID)
  {
    setState(ctrl.details,   STATE.ENABLED);
    setState(ctrl.thumbnail, STATE.ENABLED);
    setState(ctrl.timer,     STATE.ENABLED);
  }

  ctrl.details.artist.textContent = playersStatus.artist || ''; // Artist will contain the post title if all else fails
  ctrl.details.title.textContent  = playersStatus.title  || '';
  setThumbnail(playersStatus.thumbnail);
  setTimer(-1, -1);
}

function setThumbnail(thumbnail)
{
  // Don't set thumbnail again if the image source / URL is unchanged
  if (thumbnail.src !== ctrl.thumbnail.img.src)
  {
    ctrl.thumbnail.element.classList.remove('type-default', 'type-youtube', 'type-soundcloud');
    ctrl.thumbnail.element.classList.add('loading', thumbnail.class);
    ctrl.thumbnail.img.src = thumbnail.src;
    ctrl.thumbnail.img.decode().then(() => ctrl.thumbnail.element.classList.remove('loading'));
  }
}

function setTimer(positionSeconds, durationSeconds)
{
  if ((positionSeconds !== -1) && (ctrl.timer.positionSeconds !== positionSeconds))
  {
    ctrl.timer.positionSeconds = positionSeconds;

    if (m.settings.autoplay === false)
      positionSeconds = durationSeconds - positionSeconds;
    
    setTimerText(ctrl.timer.position, positionSeconds);
  }
  else if ((positionSeconds === -1) && (ctrl.timer.positionSeconds === -1))
  {
    ctrl.timer.position.textContent = '00:00';
  }

  if ((durationSeconds !== -1) && (ctrl.timer.durationSeconds !== durationSeconds))
  {
    ctrl.timer.durationSeconds = durationSeconds;
    setTimerText(ctrl.timer.duration, durationSeconds);
  }
  else if ((durationSeconds === -1) && (ctrl.timer.durationSeconds === -1))
  {
    ctrl.timer.duration.textContent = '00:00';
  }
}

function setTimerText(element, seconds)
{
  const timeString = new Date(seconds * 1000).toISOString();
  element.textContent = (seconds > (60 * 60)) ? timeString.substr(11, 8) : timeString.substr(14, 5);
}

function clearTimer()
{
  ctrl.timer.position.textContent = '00:00';
  ctrl.timer.duration.textContent = '00:00';
  ctrl.timer.positionSeconds = 0;
  ctrl.timer.durationSeconds = 0;
}


// ************************************************************************************************
// Playback controls (prev, play/pause and next)
// ************************************************************************************************

function isPlaying()
{
  // ToDo: This might not be the best place to save / check playback state...?
  return ((ctrl.playPause.STATE.ID === STATE.PLAYING.ID) ? true : false);    
}

function updatePrevState()
{
  const playersStatus = m.players.getStatus();

  clearTimer();
  setDetails(playersStatus);

  if ((isPlaying() === false) && (playersStatus.currentTrack <= 1))
    setState(ctrl.prevTrack, STATE.DISABLED);
  
  if (playersStatus.currentTrack < playersStatus.numTracks)
    setState(ctrl.nextTrack, STATE.ENABLED);
}

function setPlayState()
{
  const playersStatus = m.players.getStatus();

  setState(ctrl.playPause, STATE.PLAYING);
  ctrl.playPause.icon.textContent = 'pause_circle_filled';
  setState(ctrl.prevTrack, STATE.ENABLED);
  setDetails(playersStatus);
}

function setPauseState()
{
  setState(ctrl.playPause, STATE.PAUSED);
  ctrl.playPause.icon.textContent = 'play_circle_filled';
}

function blinkPlayPause(toggleBlink)
{
  if (toggleBlink)
    ctrl.playPause.element.classList.toggle('time-remaining-warning');
  else
    ctrl.playPause.element.classList.remove('time-remaining-warning');
}

function updateNextState()
{
  const playersStatus = m.players.getStatus();
  
  clearTimer();
  setDetails(playersStatus);
  setState(ctrl.prevTrack, STATE.ENABLED);
  
  if (playersStatus.currentTrack >= playersStatus.numTracks)
    setState(ctrl.nextTrack, STATE.DISABLED);
}


// ************************************************************************************************
// Repeat control
// ************************************************************************************************

const REPEAT = { OFF: 0, ALL: 1, ONE: 2 };

const repeatModes = [
  { title: 'Repeat Off', icon: 'repeat'     },
  { title: 'Repeat All', icon: 'repeat'     },
  { title: 'Repeat One', icon: 'repeat_one' },
];

function getRepeatMode()
{
  return parseInt(ctrl.repeat.element.getAttribute('data-repeat-mode'));
}

function repeatClick()
{
  const index = ((getRepeatMode() + 1) < repeatModes.length) ? getRepeatMode() + 1 : 0;

  ctrl.repeat.element.setAttribute('data-repeat-mode', index);
  ctrl.repeat.element.title    = repeatModes[index].title;
  ctrl.repeat.icon.textContent = repeatModes[index].icon;
}


// ************************************************************************************************
// Mute control
// ************************************************************************************************

function updateMuteState()
{
  ctrl.mute.icon.textContent = m.settings.masterMute ? 'volume_off' : 'volume_up';
}

function updateAutoplayState()
{
  if ((isPlaying() === false) && (ctrl.timer.positionSeconds !== -1) && ((ctrl.timer.durationSeconds !== -1)))
  {
    setTimerText(ctrl.timer.position, m.settings.autoplay ? ctrl.timer.positionSeconds : (ctrl.timer.durationSeconds - ctrl.timer.positionSeconds));
    setTimerText(ctrl.timer.duration, ctrl.timer.durationSeconds);
  }
}
