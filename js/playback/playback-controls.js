//
// Playback UI controls
//
// https://ultrafunk.com
//


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
  updateNextState,
  updateMuteState,
  updateAutoPlayState,
  blinkPlayPause,
};


const STATE = {
  DISABLED: 'state-disabled',
  ENABLED:  'state-enabled',
  PLAY:     'state-play',
  PAUSE:    'state-pause',
};

const controls = {
  progress:   { seekElement: null, barElement: null, seekClickCallback: null },
  details:    { element: null, state: STATE.DISABLED, artistElement:   null, titleElement:    null },
  timer:      { element: null, state: STATE.DISABLED, positionElement: null, durationElement: null, positionSeconds: -1, durationSeconds: -1 },
  prevTrack:  { element: null, state: STATE.DISABLED },
  playPause:  { element: null, state: STATE.DISABLED, iconElement: null },
  nextTrack:  { element: null, state: STATE.DISABLED },
  shuffle:    { element: null, state: STATE.DISABLED },
  mute:       { element: null, state: STATE.DISABLED, iconElement: null },
};


// ************************************************************************************************
//
// ************************************************************************************************

function init(progressId, controlsId, seekClickCallback)
{
  const playbackProgress = document.getElementById(progressId);

  if (playbackProgress !== null)
  {
    controls.progress.seekElement       = playbackProgress.querySelector('.seek-control');
    controls.progress.barElement        = playbackProgress.querySelector('.bar-control');
    controls.progress.seekClickCallback = seekClickCallback;
  }
  else
  {
    console.error(`playbackControls.init(): Unable to getElementById() for '#${progressId}'`);
  }

  const playbackControls = document.getElementById(controlsId);

  if (playbackControls !== null)
  {
    controls.details.element       = playbackControls.querySelector('.details-control');
    controls.details.artistElement = controls.details.element.querySelector('.details-artist');
    controls.details.titleElement  = controls.details.element.querySelector('.details-title');
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
    console.error(`playbackControls.init(): Unable to getElementById() for '#${controlsId}'`);
  }
}

function ready(prevClick, playPauseClick, nextClick, muteClick, numTracks, isMuted)
{
  controls.progress.seekElement.addEventListener('click', progressSeekClick);
  
  setState(controls.details, STATE.ENABLED);
  setState(controls.timer, STATE.ENABLED);

  setState(controls.prevTrack, STATE.DISABLED);
  controls.prevTrack.element.addEventListener('click', prevClick);

  setState(controls.playPause, STATE.PLAY);
  controls.playPause.element.addEventListener('click', playPauseClick);

  setState(controls.nextTrack, ((numTracks > 1) ? STATE.ENABLED : STATE.DISABLED));
  controls.nextTrack.element.addEventListener('click', nextClick);

  setState(controls.shuffle, STATE.ENABLED);

  setState(controls.mute, STATE.ENABLED);
  controls.mute.element.addEventListener('click', muteClick);
  updateMuteState(isMuted);
}

function updateProgressPosition(posMilliseconds, durationSeconds)
{
  // Prevent division by zero
  if (durationSeconds === 0)
    updateProgressBar(0);
  else
    updateProgressBar(posMilliseconds / (durationSeconds * 1000));
}

function updateProgressPercent(progressPercent)
{
  updateProgressBar(progressPercent / 100);
}

function updateProgressBar(scaleX)
{
  controls.progress.barElement.style.transform = `scaleX(${scaleX})`;
}

function progressSeekClick(event)
{
  if (controls.timer.durationSeconds > 0)
  {
    const progressPercent = ((event.clientX / document.documentElement.clientWidth) * 100);
    const seekPosSeconds  = Math.round((controls.timer.durationSeconds * progressPercent) / 100);
    controls.progress.seekClickCallback(seekPosSeconds);

    if (isPlaying() === false)
      updateProgressPercent(progressPercent);
  }
}

function setState(control, state = STATE.DISABLED)
{
  control.element.classList.remove(control.state);
  control.element.classList.add(state);
  control.state = state;
  
  if (state === STATE.PLAY)
    controls.playPause.iconElement.textContent = 'play_circle_filled';
  else if (state === STATE.PAUSE)
    controls.playPause.iconElement.textContent = 'pause_circle_filled';
}

function setDetails(playbackStatus)
{
  setTimer(-1, -1);
  controls.details.artistElement.textContent = playbackStatus.artist || ''; // Artist will contain the post title if all else fails
  controls.details.titleElement.textContent  = playbackStatus.title  || '';
}

function getTimeString(seconds, from, length)
{
  // ToDo: This can probably be optimized a bit?
  return (new Date(seconds * 1000).toISOString().substr(from, length));
}

function setTimer(positionSeconds, durationSeconds, autoPlay = false)
{
  if ((positionSeconds !== -1) && (controls.timer.positionSeconds !== positionSeconds))
  {
    controls.timer.positionSeconds = positionSeconds;

    if (autoPlay === false)
      positionSeconds = durationSeconds - positionSeconds;
    
    controls.timer.positionElement.textContent = (positionSeconds > (60 * 60)) ? getTimeString(positionSeconds, 11, 8) : getTimeString(positionSeconds, 14, 5);
  }
  else if ((positionSeconds === -1) && (controls.timer.positionSeconds === -1))
  {
    controls.timer.positionElement.textContent = '00:00';
  }

  if ((durationSeconds !== -1) && (controls.timer.durationSeconds !== durationSeconds))
  {
    controls.timer.durationSeconds = durationSeconds;
    controls.timer.durationElement.textContent = (durationSeconds > (60 * 60)) ? getTimeString(durationSeconds, 11, 8) : getTimeString(durationSeconds, 14, 5);
  }
  else if ((durationSeconds === -1) && (controls.timer.durationSeconds === -1))
  {
    controls.timer.durationElement.textContent = '00:00';
  }
}

function clearTimer()
{
  controls.timer.positionElement.textContent = '00:00';
  controls.timer.durationElement.textContent = '00:00';
}

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
}

function updatePauseState()
{
  setState(controls.playPause, STATE.PLAY);
}

function updateNextState(playbackStatus)
{
  clearTimer();
  setDetails(playbackStatus);
  setState(controls.prevTrack, STATE.ENABLED);
  
  if (playbackStatus.currentTrack >= playbackStatus.numTracks)
    setState(controls.nextTrack, STATE.DISABLED);
}

function updateMuteState(isMuted)
{
  controls.mute.iconElement.textContent = isMuted ? 'volume_off' : 'volume_up';
}

function updateAutoPlayState(autoPlay)
{
  if (autoPlay)
  {
    controls.progress.barElement.classList.remove('no-autoplay');
    controls.playPause.element.classList.remove('no-autoplay');
  }
  else
  {
    controls.progress.barElement.classList.add('no-autoplay');
    controls.playPause.element.classList.add('no-autoplay');
  }
}

function blinkPlayPause(toggleBlink)
{
  if (toggleBlink)
    controls.playPause.element.classList.toggle('time-remaining-warning');
  else
    controls.playPause.element.classList.remove('time-remaining-warning');
}
