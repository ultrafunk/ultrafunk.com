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
    details:    { div: null, state: STATE.DISABLED, artist: null, title: null },
    prevTrack:  { div: null, state: STATE.DISABLED },
    playPause:  { div: null, state: STATE.PLAY, icon: null },
    nextTrack:  { div: null, state: STATE.DISABLED },
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

  function setDetails(playbackData)
  {
    controls.details.artist.textContent = playbackData.artist || ''; // Artist will contain the post title if all else fails
    controls.details.title.textContent  = playbackData.title  || '';
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
        controls.prevTrack.div  = playbackControls.querySelector('.prev-control');
        controls.playPause.div  = playbackControls.querySelector('.play-pause-control');
        controls.playPause.icon = controls.playPause.div.querySelector('i');
        controls.nextTrack.div  = playbackControls.querySelector('.next-control');
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

      setState(controls.prevTrack, STATE.DISABLED);
      controls.prevTrack.div.style.display = 'inline-block';
      controls.prevTrack.div.addEventListener('click', prevClick);

      setState(controls.playPause, STATE.PLAY);
      controls.playPause.div.style.display = 'inline-block';
      controls.playPause.div.addEventListener('click', playPauseClick);

      setState(controls.nextTrack, ((numTracks > 1) ? STATE.ENABLED : STATE.DISABLED));
      controls.nextTrack.div.style.display = 'inline-block';
      controls.nextTrack.div.addEventListener('click', nextClick);

      setState(controls.progress, STATE.DISABLED);
      controls.progress.div.style.display = 'none';
    },

    setDetails: function(playbackData)
    {
      setDetails(playbackData);
    },
    
    isPlaying: function()
    {
      return isPlaying();
    },
    
    updatePrevState: function(playbackStatus, playbackData)
    {
      setDetails(playbackData);
    
      if ((isPlaying() === false) && (playbackStatus.currentTrack <= 1))
        setState(controls.prevTrack, STATE.DISABLED);
      
      if (playbackStatus.currentTrack < playbackStatus.numTracks)
        setState(controls.nextTrack, STATE.ENABLED);
    },

    updatePlayState: function(playbackData)
    {
      setState(controls.playPause, STATE.PAUSE);
      setState(controls.prevTrack, STATE.ENABLED);
      setDetails(playbackData);
    },
    
    updatePauseState: function()
    {
      setState(controls.playPause, STATE.PLAY);
    },

    updateNextState: function(playbackStatus, playbackData)
    {
      setDetails(playbackData);
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

