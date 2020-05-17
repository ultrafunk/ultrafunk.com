//
// Playback UI controls
//
// https://ultrafunk.com
//


export { playbackControls };


let playbackControls = function()
{
  const STATE = {
    DISABLED: 'state-disabled',
    ENABLED:  'state-enabled',
    PLAY:     'state-play',
    PAUSE:    'state-pause',
  };

  const controls = {
    details:    { div: null, state: STATE.DISABLED, artist:   null, title:    null },
    timer:      { div: null, state: STATE.DISABLED, position: null, duration: null, positionSecs: -1, durationSecs: -1 },
    prevTrack:  { div: null, state: STATE.DISABLED },
    playPause:  { div: null, state: STATE.PLAY, icon: null },
    nextTrack:  { div: null, state: STATE.DISABLED },
    shuffle:    { div: null, state: STATE.DISABLED },
    progress:   { div: null, state: STATE.ENABLED  },
  };

  function setState(control, state = STATE.DISABLED)
  {
    control.div.classList.remove(control.state);
    control.div.classList.add(state);
    control.state = state;
    
    if (state === STATE.PLAY)
      controls.playPause.icon.textContent = 'play_circle_filled';
    else if (state === STATE.PAUSE)
      controls.playPause.icon.textContent = 'pause_circle_filled';
  }

  function setDetails(playbackStatus)
  {
    setTimer(-1, -1);
    controls.details.artist.textContent = playbackStatus.artist || ''; // Artist will contain the post title if all else fails
    controls.details.title.textContent  = playbackStatus.title  || '';
  }

  function getTimeString(seconds, from, length)
  {
    // ToDo: This can probably be optimized a bit?
    return (new Date(seconds * 1000).toISOString().substr(from, length));
  }

  function setTimer(positionSecs, durationSecs)
  {
    if ((positionSecs !== -1) && (controls.timer.positionSecs !== positionSecs))
    {
      controls.timer.positionSecs = positionSecs;
      controls.timer.position.textContent = (positionSecs > (60 * 60)) ? getTimeString(positionSecs, 11, 8) : getTimeString(positionSecs, 14, 5);
    }
    else if ((positionSecs === -1) && (controls.timer.positionSecs === -1))
    {
      controls.timer.position.textContent = '00:00';
    }

    if ((durationSecs !== -1) && (controls.timer.durationSecs !== durationSecs))
    {
      controls.timer.durationSecs = durationSecs;
      controls.timer.duration.textContent = (durationSecs > (60 * 60)) ? getTimeString(durationSecs, 11, 8) : getTimeString(durationSecs, 14, 5);
    }
    else if ((durationSecs === -1) && (controls.timer.durationSecs === -1))
    {
      controls.timer.duration.textContent = '00:00';
    }
  }

  function clearTimer()
  {
    controls.timer.position.textContent = '00:00';
    controls.timer.duration.textContent = '00:00';
  }

  function isPlaying()
  {
    // ToDo: THIS NEEDS TO BE CONTROLLED IN playback.js instead of relying on UI state!?!?
    return ((controls.playPause.state === STATE.PAUSE) ? true : false);    
  }
  
  return {

    init: function(controlsId)
    {
      const playbackControls = document.getElementById(controlsId);
    
      if (playbackControls !== null)
      {
        controls.details.div    = playbackControls.querySelector('.details-control');
        controls.details.artist = controls.details.div.querySelector('.details-artist');
        controls.details.title  = controls.details.div.querySelector('.details-title');
        controls.timer.div      = playbackControls.querySelector('.timer-control');
        controls.timer.position = controls.timer.div.querySelector('.timer-position');
        controls.timer.duration = controls.timer.div.querySelector('.timer-duration');
        controls.prevTrack.div  = playbackControls.querySelector('.prev-control');
        controls.playPause.div  = playbackControls.querySelector('.play-pause-control');
        controls.playPause.icon = controls.playPause.div.querySelector('i');
        controls.nextTrack.div  = playbackControls.querySelector('.next-control');
        controls.shuffle.div    = playbackControls.querySelector('.shuffle-control');
        controls.progress.div   = playbackControls.querySelector('.progress-control');
      }
      else
      {
        console.error(`PlayerControls: Unable to getElementById() for '#${controlsId}'`);
      }
    },

    ready: function(prevClick, playPauseClick, nextClick, numTracks)
    {
      setState(controls.details, STATE.ENABLED);
      controls.details.div.style.display = 'inline-block';

      setState(controls.timer, STATE.ENABLED);
      controls.timer.div.style.display = 'inline-block';

      setState(controls.prevTrack, STATE.DISABLED);
      controls.prevTrack.div.style.display = 'inline-block';
      controls.prevTrack.div.addEventListener('click', prevClick);

      setState(controls.playPause, STATE.PLAY);
      controls.playPause.div.style.display = 'inline-block';
      controls.playPause.div.addEventListener('click', playPauseClick);

      setState(controls.nextTrack, ((numTracks > 1) ? STATE.ENABLED : STATE.DISABLED));
      controls.nextTrack.div.style.display = 'inline-block';
      controls.nextTrack.div.addEventListener('click', nextClick);

      setState(controls.shuffle, STATE.ENABLED);
      controls.shuffle.div.style.display = 'inline-block';

      setState(controls.progress, STATE.DISABLED);
      controls.progress.div.style.display = 'none';
    },

    setDetails: function(playbackStatus)
    {
      setDetails(playbackStatus);
    },

    setTimer: function(position, duration)
    {
      setTimer(position, duration);
    },

    isPlaying: function()
    {
      return isPlaying();
    },
    
    updatePrevState: function(playbackStatus)
    {
      clearTimer();
      setDetails(playbackStatus);
    
      if ((isPlaying() === false) && (playbackStatus.currentTrack <= 1))
        setState(controls.prevTrack, STATE.DISABLED);
      
      if (playbackStatus.currentTrack < playbackStatus.numTracks)
        setState(controls.nextTrack, STATE.ENABLED);
    },

    updatePlayState: function(playbackStatus)
    {
      setState(controls.playPause, STATE.PAUSE);
      setState(controls.prevTrack, STATE.ENABLED);
      setDetails(playbackStatus);
    },
    
    updatePauseState: function()
    {
      setState(controls.playPause, STATE.PLAY);
    },

    updateNextState: function(playbackStatus)
    {
      clearTimer();
      setDetails(playbackStatus);
      setState(controls.prevTrack, STATE.ENABLED);
      
      if (playbackStatus.currentTrack >= playbackStatus.numTracks)
        setState(controls.nextTrack, STATE.DISABLED);
    },

    updateProgress: function()
    {
      controls.progress.div.append('.');
    },

    blinkPlayPause: function()
    {
      controls.playPause.div.classList.toggle('time-remaining-warning');
    },
    
    stopBlinkPlayPause: function()
    {
      controls.playPause.div.classList.remove('time-remaining-warning');
    },
  };
};

