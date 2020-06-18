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
  blinkPlayPause,
  updateNextState,
  updateMuteState,
  updateAutoPlayState,
};


const settings = {
  autoPlay: false,
};

const STATE = {
  DISABLED: 'state-disabled',
  ENABLED:  'state-enabled',
  PLAY:     'state-play',
  PAUSE:    'state-pause',
};

const controls = {
  progressSeek: { element: null, state: STATE.DISABLED, clickCallback: null },
  progressBar:  { element: null, state: STATE.DISABLED },
  details:      { element: null, state: STATE.DISABLED, artistElement: null, titleElement: null },
  timer:        { element: null, state: STATE.DISABLED, positionElement: null, durationElement: null, positionSeconds: -1, durationSeconds: -1 },
  prevTrack:    { element: null, state: STATE.DISABLED },
  playPause:    { element: null, state: STATE.DISABLED, iconElement: null },
  nextTrack:    { element: null, state: STATE.DISABLED },
  shuffle:      { element: null, state: STATE.DISABLED },
  mute:         { element: null, state: STATE.DISABLED, iconElement: null },
};


// ************************************************************************************************
// Init and make ready all controls
// ************************************************************************************************

function init(progressId, controlsId, seekClickCallback)
{
  const playbackProgress = document.getElementById(progressId);

  if (playbackProgress !== null)
  {
    controls.progressSeek.element       = playbackProgress.querySelector('.seek-control');
    controls.progressSeek.clickCallback = seekClickCallback;
    controls.progressBar.element        = playbackProgress.querySelector('.bar-control');
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
  setState(controls.progressSeek, STATE.ENABLED);
  controls.progressSeek.element.addEventListener('click', progressSeekClick);
  setState(controls.progressBar, STATE.ENABLED);
  
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


// ************************************************************************************************
// Progress bar and position seek
// ************************************************************************************************

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
  setTimer(-1, -1);
  controls.details.artistElement.textContent = playbackStatus.artist || ''; // Artist will contain the post title if all else fails
  controls.details.titleElement.textContent  = playbackStatus.title  || '';
}

//
// ToDo: playback-controls.js should probably have its own window.addEventListener('resize')
//       so that it can implement CSS media-query max-width transitions on its own instead of
//       using (element.clientWidth === 0) and other "tricks"...
//
function setTimer(positionSeconds, durationSeconds)
{
  // Just bail early if the control is not visible, no need to update the DOM
  if (controls.timer.element.clientWidth === 0)
    return;

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
}

function updatePauseState()
{
  setState(controls.playPause, STATE.PLAY);
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

function updateMuteState(isMuted)
{
  controls.mute.iconElement.textContent = isMuted ? 'volume_off' : 'volume_up';
}


// ************************************************************************************************
//
// ************************************************************************************************

function updateAutoPlayState(autoPlay)
{
  settings.autoPlay = autoPlay;

  if ((isPlaying() === false) && (controls.timer.positionSeconds > 0))
  {
    setTimerText(controls.timer.positionElement, (autoPlay === true) ? controls.timer.positionSeconds : (controls.timer.durationSeconds - controls.timer.positionSeconds));
    setTimerText(controls.timer.durationElement, controls.timer.durationSeconds);
  }

  if (autoPlay)
  {
    controls.progressBar.element.classList.remove('no-autoplay');
    controls.playPause.element.classList.remove('no-autoplay');
  }
  else
  {
    controls.progressBar.element.classList.add('no-autoplay');
    controls.playPause.element.classList.add('no-autoplay');
  }
}

