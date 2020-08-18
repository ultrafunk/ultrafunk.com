//
// Event logging and matching
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=1.10.1';


export {
//Constants
  SOURCE,
  EVENT,
//Classes
  Interaction,
  Playback,
};


const debug = debugLogger.getInstance('eventlogger');

const SOURCE = {
// Default source
  UNKNOWN: 1000,
// interaction.js event sources
  KEYBOARD: 100,
  MOUSE:    110,
// playback.js event sources
  YOUTUBE:    1,
  SOUNDCLOUD: 2,
  ULTRAFUNK:  50,
};

const EVENT = {
// Default event
  UNKNOWN:         -2000,
// interaction.js event types
  KEY_ARROW_LEFT:  80,
  KEY_ARROW_RIGHT: 81,
  MOUSE_CLICK:     82,
// playback.js event types
  STATE_ERROR:     -5,
  STATE_UNSTARTED: -1, // YT.PlayerState.UNSTARTED
  STATE_ENDED:     0,  // YT.PlayerState.ENDED
  STATE_PLAYING:   1,  // YT.PlayerState.PLAYING
  STATE_PAUSED:    2,  // YT.PlayerState.PAUSED
  STATE_BUFFERING: 3,  // YT.PlayerState.BUFFERING
  STATE_CUED:      5,  // YT.PlayerState.CUED
  RESUME_AUTOPLAY: 50,
  PLAYER_ERROR:    60,
};

const entry = {
  eventSource: SOURCE.UNKNOWN,
  timeStamp:   0,
  eventType:   EVENT.UNKNOWN,
  uId:         null,
};


// ************************************************************************************************
// EventLog parent class
// ************************************************************************************************

class EventLog
{
  constructor(maxEntries = 10)
  {
    this.log        = [];
    this.maxEntries = maxEntries;
    this.matchCount = 0;
  }
  
  // Simple and inefficient, but good enough...
  add(eventSource, timeStamp, eventType, uId)
  {
    const logEntry = Object.create(entry);

    logEntry.eventSource = eventSource;
    logEntry.timeStamp   = timeStamp;
    logEntry.eventType   = eventType;
    logEntry.uId         = uId;
    
    if (this.log.length < this.maxEntries)
    {
      this.log.push(logEntry);
    }
    else
    {
      this.log.shift();
      this.log.push(logEntry);
    }
  }
  
  clear()
  {
    this.log = [];
  }
}


// ************************************************************************************************
// Interaction child class
// ************************************************************************************************

class Interaction extends EventLog
{
  constructor(maxEntries)
  {
    super(maxEntries);
  }

  doubleClicked(eventSource, eventType, deltaTime)
  {
    debug.logEventLog(this.log, SOURCE, EVENT);

    const lastPos   = this.log.length - 1;
    this.matchCount = 0;

    if (lastPos >= 1)
    {
      if ((this.log[lastPos - 1].eventSource === eventSource) &&
          (this.log[lastPos - 1].eventType   === eventType))
            this.matchCount++;
      
      if ((this.log[lastPos].eventSource === eventSource) &&
          (this.log[lastPos].eventType   === eventType))
            this.matchCount++;

      if ((this.log[lastPos].timeStamp - this.log[lastPos - 1].timeStamp) <= deltaTime)
        this.matchCount++;
    }

    return ((this.matchCount === 3) ? true : false);
  }
}


// ************************************************************************************************
// Playback child class
// ************************************************************************************************

class Playback extends EventLog
{
  constructor(maxEntries)
  {
    super(maxEntries);
  }

  ytAutoPlayBlocked(uId, deltaTime)
  {
    debug.logEventLog(this.log, SOURCE, EVENT);

    const lastPos   = this.log.length - 1;
    this.matchCount = 0;
    
    if (lastPos >= 3)
    {
      if ((this.log[lastPos - 3].eventSource === SOURCE.ULTRAFUNK)      &&
          (this.log[lastPos - 3].eventType   === EVENT.RESUME_AUTOPLAY) &&
          (this.log[lastPos - 3].uId         === null))
            this.matchCount++;

      if ((this.log[lastPos - 2].eventSource === SOURCE.YOUTUBE)        &&
          (this.log[lastPos - 2].eventType   === EVENT.STATE_UNSTARTED) &&
          (this.log[lastPos - 2].uId         === uId))
            this.matchCount++;

      if ((this.log[lastPos - 1].eventSource === SOURCE.YOUTUBE)        &&
          (this.log[lastPos - 1].eventType   === EVENT.STATE_BUFFERING) &&
          (this.log[lastPos - 1].uId         === uId))
            this.matchCount++;

      if ((this.log[lastPos].eventSource === SOURCE.YOUTUBE)        &&
          (this.log[lastPos].eventType   === EVENT.STATE_UNSTARTED) &&
          (this.log[lastPos].uId         === uId))
            this.matchCount++;
            
      if ((this.log[lastPos].timeStamp - this.log[lastPos - 3].timeStamp) <= deltaTime)
        this.matchCount++;
    }
    
    return ((this.matchCount === 5) ? true : false);
  }
  
  scAutoPlayBlocked(uId, deltaTime)
  {
    debug.logEventLog(this.log, SOURCE, EVENT);

    const lastPos   = this.log.length - 1;
    this.matchCount = 0;
    
    if (lastPos >= 3)
    {
      if ((this.log[lastPos - 3].eventSource === SOURCE.ULTRAFUNK)      &&
          (this.log[lastPos - 3].eventType   === EVENT.RESUME_AUTOPLAY) &&
          (this.log[lastPos - 3].uId         === null))
            this.matchCount++;
      
      if ((this.log[lastPos - 2].eventSource === SOURCE.SOUNDCLOUD)   &&
          (this.log[lastPos - 2].eventType   === EVENT.STATE_PLAYING) &&
          (this.log[lastPos - 2].uId         === uId))
            this.matchCount++;

      if ((this.log[lastPos - 1].eventSource === SOURCE.SOUNDCLOUD)  &&
          (this.log[lastPos - 1].eventType   === EVENT.STATE_PAUSED) &&
          (this.log[lastPos - 1].uId         === uId))
            this.matchCount++;

      if ((this.log[lastPos].eventSource === SOURCE.SOUNDCLOUD)  &&
          (this.log[lastPos].eventType   === EVENT.STATE_PAUSED) &&
          (this.log[lastPos].uId         === uId))
            this.matchCount++;
            
      if ((this.log[lastPos].timeStamp - this.log[lastPos - 3].timeStamp) <= deltaTime)
        this.matchCount++;
    }
    
    return ((this.matchCount === 5) ? true : false);
  }

  scWidgetPlayBlocked(uId, deltaTime)
  {
    debug.logEventLog(this.log, SOURCE, EVENT);

    const lastPos   = this.log.length - 1;
    this.matchCount = 0;
    
    if (lastPos >= 2)
    {
      if ((this.log[lastPos - 2].eventSource === SOURCE.SOUNDCLOUD)   &&
          (this.log[lastPos - 2].eventType   === EVENT.STATE_PLAYING) &&
          (this.log[lastPos - 2].uId         === uId))
            this.matchCount++;

      if ((this.log[lastPos - 1].eventSource === SOURCE.SOUNDCLOUD)  &&
          (this.log[lastPos - 1].eventType   === EVENT.STATE_PAUSED) &&
          (this.log[lastPos - 1].uId         === uId))
            this.matchCount++;

      if ((this.log[lastPos].eventSource === SOURCE.SOUNDCLOUD)  &&
          (this.log[lastPos].eventType   === EVENT.STATE_PAUSED) &&
          (this.log[lastPos].uId         === uId))
            this.matchCount++;
            
      if ((this.log[lastPos].timeStamp - this.log[lastPos - 2].timeStamp) <= deltaTime)
        this.matchCount++;
    }
    
    return ((this.matchCount === 4) ? true : false);
  }
}
