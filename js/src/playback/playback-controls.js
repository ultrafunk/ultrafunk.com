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


const debug  = debugLogger.newInstance('playback-controls');
let settings = {};
let players  = {};

const mConfig = {
  progressControlsId: 'progress-controls',
  playbackControlsId: 'playback-controls',
};

const STATE = {
  DISABLED: { CLASS: 'state-disabled', ID: 1 },
  ENABLED:  { CLASS: 'state-enabled',  ID: 2 },
  PLAYING:  { CLASS: 'state-playing',  ID: 3 },
  PAUSED:   { CLASS: 'state-paused',   ID: 4 },
};

const mControls = {
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
  shuffle:         { element:  null, STATE: STATE.DISABLED },
  mute:            { element:  null, STATE: STATE.DISABLED, iconElement: null },
};


// ************************************************************************************************
// Init and make ready all controls
// ************************************************************************************************

function init(playbackSettings, mediaPlayers, seekClickCallback)
{
  debug.log('init()');

  settings = playbackSettings;
  players  = mediaPlayers;

  const playbackProgress = document.getElementById(mConfig.progressControlsId);

  if (playbackProgress !== null)
  {
    mControls.progressSeek.element = playbackProgress.querySelector('.progress-seek-control');
    mControls.progressSeek.click   = seekClickCallback;
    mControls.progressBar.element  = playbackProgress.querySelector('.progress-bar-control');
  }
  else
  {
    debug.error(`init(): Unable to getElementById() for '#${mConfig.progressControlsId}'`);
  }

  const playbackControls = document.getElementById(mConfig.playbackControlsId);

  if (playbackControls !== null)
  {
    mControls.details.element       = playbackControls.querySelector('.playback-details-control');
    mControls.details.artistElement = mControls.details.element.querySelector('.playback-details-artist');
    mControls.details.titleElement  = mControls.details.element.querySelector('.playback-details-title');
    mControls.thumbnail.element     = playbackControls.querySelector('.playback-thumbnail-control');
    mControls.thumbnail.img         = mControls.thumbnail.element.querySelector('img');
    mControls.timer.element         = playbackControls.querySelector('.playback-timer-control');
    mControls.timer.positionElement = mControls.timer.element.querySelector('.playback-timer-position');
    mControls.timer.durationElement = mControls.timer.element.querySelector('.playback-timer-duration');
    mControls.prevTrack.element     = playbackControls.querySelector('.playback-prev-control');
    mControls.playPause.element     = playbackControls.querySelector('.playback-play-pause-control');
    mControls.playPause.iconElement = mControls.playPause.element.querySelector('i');
    mControls.nextTrack.element     = playbackControls.querySelector('.playback-next-control');
    mControls.shuffle.element       = playbackControls.querySelector('.playback-shuffle-control');
    mControls.mute.element          = playbackControls.querySelector('.playback-mute-control');
    mControls.mute.iconElement      = mControls.mute.element.querySelector('i');
  }
  else
  {
    debug.error(`init(): Unable to getElementById() for '#${mConfig.playbackControlsId}'`);
  }
}

function ready(prevClickCallback, playPauseClickCallback, nextClickCallback, muteClickCallback)
{
  debug.log('ready()');

  setState(mControls.progressSeek, STATE.ENABLED);
  mControls.progressSeek.element.addEventListener('click', progressSeekClick);
  setState(mControls.progressBar, STATE.ENABLED);
  
  setState(mControls.details, STATE.ENABLED);
  setState(mControls.thumbnail, STATE.ENABLED);
  setState(mControls.timer, STATE.ENABLED);

  if (settings.trackThumbnailOnMobile)
    mControls.thumbnail.element.classList.add('show-on-mobile');

  if (settings.trackTimesOnMobile)
    mControls.timer.element.classList.add('show-on-mobile');

  setState(mControls.prevTrack, (players.getCurrentTrack() > 1) ? STATE.ENABLED : STATE.DISABLED);
  mControls.prevTrack.element.addEventListener('click', prevClickCallback);

  setState(mControls.playPause, STATE.PAUSED);
  mControls.playPause.element.addEventListener('click', playPauseClickCallback);

  setState(mControls.nextTrack, (players.getNumTracks() > 1) ? STATE.ENABLED : STATE.DISABLED);
  mControls.nextTrack.element.addEventListener('click', nextClickCallback);

  setState(mControls.shuffle, STATE.ENABLED);

  setState(mControls.mute, STATE.ENABLED);
  mControls.mute.element.addEventListener('click', muteClickCallback);
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
  mControls.progressBar.element.style.transform = `scaleX(${scaleX})`;
}

function progressSeekClick(event)
{
  if (mControls.timer.durationSeconds > 0)
  {
    const progressPercent = ((event.clientX / document.documentElement.clientWidth) * 100);
    const seekPosSeconds  = Math.round((mControls.timer.durationSeconds * progressPercent) / 100);
    mControls.progressSeek.click(seekPosSeconds);

    if (isPlaying() === false)
    {
      updateProgressPercent(progressPercent);
      setTimer(seekPosSeconds, mControls.timer.durationSeconds);
    }
  }
}


// ************************************************************************************************
// Details (Artist + Title) and track timer
// ************************************************************************************************

function setDetails(playersStatus)
{
  mControls.details.artistElement.textContent = playersStatus.artist || ''; // Artist will contain the post title if all else fails
  mControls.details.titleElement.textContent  = playersStatus.title  || '';
  setThumbnail(playersStatus.thumbnail);
  setTimer(-1, -1);
}

function setThumbnail(thumbnail)
{
  // Don't set thumbnail again if the image source / URL is unchanged
  if (thumbnail.src !== mControls.thumbnail.img.src)
  {
    mControls.thumbnail.element.classList.remove('type-default', 'type-youtube', 'type-soundcloud');
    mControls.thumbnail.element.classList.add('loading', thumbnail.class);
    mControls.thumbnail.img.src = thumbnail.src;
    mControls.thumbnail.img.decode().then(() => mControls.thumbnail.element.classList.remove('loading'));
  }
}

function setTimer(positionSeconds, durationSeconds)
{
  if ((positionSeconds !== -1) && (mControls.timer.positionSeconds !== positionSeconds))
  {
    mControls.timer.positionSeconds = positionSeconds;

    if (settings.autoplay === false)
      positionSeconds = durationSeconds - positionSeconds;
    
    setTimerText(mControls.timer.positionElement, positionSeconds);
  }
  else if ((positionSeconds === -1) && (mControls.timer.positionSeconds === -1))
  {
    mControls.timer.positionElement.textContent = '00:00';
  }

  if ((durationSeconds !== -1) && (mControls.timer.durationSeconds !== durationSeconds))
  {
    mControls.timer.durationSeconds = durationSeconds;
    setTimerText(mControls.timer.durationElement, durationSeconds);
  }
  else if ((durationSeconds === -1) && (mControls.timer.durationSeconds === -1))
  {
    mControls.timer.durationElement.textContent = '00:00';
  }
}

function setTimerText(element, seconds)
{
  const timeString = new Date(seconds * 1000).toISOString();
  element.textContent = (seconds > (60 * 60)) ? timeString.substr(11, 8) : timeString.substr(14, 5);
}

function clearTimer()
{
  mControls.timer.positionElement.textContent = '00:00';
  mControls.timer.durationElement.textContent = '00:00';
  mControls.timer.positionSeconds = 0;
  mControls.timer.durationSeconds = 0;
}


// ************************************************************************************************
// Playback controls (prev, play/pause, next and mute)
// ************************************************************************************************

function isPlaying()
{
  // ToDo: This might not be the best place to save / check playback state...?
  return ((mControls.playPause.STATE.ID === STATE.PLAYING.ID) ? true : false);    
}

function updatePrevState()
{
  const playersStatus = players.getStatus();

  clearTimer();
  setDetails(playersStatus);

  if ((isPlaying() === false) && (playersStatus.currentTrack <= 1))
    setState(mControls.prevTrack, STATE.DISABLED);
  
  if (playersStatus.currentTrack < playersStatus.numTracks)
    setState(mControls.nextTrack, STATE.ENABLED);
}

function setPlayState()
{
  const playersStatus = players.getStatus();

  setState(mControls.playPause, STATE.PLAYING);
  mControls.playPause.iconElement.textContent = 'pause_circle_filled';
  setState(mControls.prevTrack, STATE.ENABLED);
  setDetails(playersStatus);
}

function setPauseState()
{
  setState(mControls.playPause, STATE.PAUSED);
  mControls.playPause.iconElement.textContent = 'play_circle_filled';
}

function blinkPlayPause(toggleBlink)
{
  if (toggleBlink)
    mControls.playPause.element.classList.toggle('time-remaining-warning');
  else
    mControls.playPause.element.classList.remove('time-remaining-warning');
}

function updateNextState()
{
  const playersStatus = players.getStatus();
  
  clearTimer();
  setDetails(playersStatus);
  setState(mControls.prevTrack, STATE.ENABLED);
  
  if (playersStatus.currentTrack >= playersStatus.numTracks)
    setState(mControls.nextTrack, STATE.DISABLED);
}

function updateMuteState()
{
  mControls.mute.iconElement.textContent = settings.masterMute ? 'volume_off' : 'volume_up';
}

function updateAutoplayState()
{
  if ((isPlaying() === false) && (mControls.timer.positionSeconds !== -1) && ((mControls.timer.durationSeconds !== -1)))
  {
    setTimerText(mControls.timer.positionElement, settings.autoplay ? mControls.timer.positionSeconds : (mControls.timer.durationSeconds - mControls.timer.positionSeconds));
    setTimerText(mControls.timer.durationElement, mControls.timer.durationSeconds);
  }
}
