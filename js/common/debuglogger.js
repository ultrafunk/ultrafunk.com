//
// Debug logging helper classes
//
// https://ultrafunk.com
//


export { getInstance };


const DEBUG = false;


// ************************************************************************************************
// 
// ************************************************************************************************

class DebugLog
{
  constructor(caller = 'unknown')
  {
    this.DEBUG  = DEBUG;
    this.caller = padString(caller.toUpperCase(), 11, '.');
  }
  
  isDebug() { return this.DEBUG; }

  error(data)
  {
    console.error(`${this.caller}:`, data);
  }
}

class DevBuild extends DebugLog
{
  constructor(caller) { super(caller); }

  log(data)
  {
    console.log(`${this.caller}:`, data);
  }

  logEventLog(eventLog, eventSource, eventType)
  {
    const entries = [];
    
    for (let i = 0; i < eventLog.length; i++)
    {
      const data = {
        eventSource: this.getObjectKeyForValue(eventSource, eventLog[i].eventSource),
        timeStamp:   eventLog[i].timeStamp,
        eventType:   this.getObjectKeyForValue(eventType, eventLog[i].eventType),
        uId:         eventLog[i].uId,
      };

      entries.push(data);
    }
    
    this.log(entries);
  }

  getObjectKeyForValue(object, value)
  {
    const entries = Object.entries(object);
    
    for (let i = 0; i < entries.length; i++)
    {
      if (entries[i][1] === value)
        return entries[i][0];
    }
  }
}

class ProdBuild extends DebugLog
{
  constructor(caller) { super(caller); }

  log()                  {}
  logEventLog()          {}
  getObjectKeyForValue() {}
}


// ************************************************************************************************
// 
// ************************************************************************************************

function getInstance(caller)
{
  if (DEBUG)
    return new DevBuild(caller);
  else
    return new ProdBuild(caller);
}

function padString(string, maxLength, padChar)
{
  if (string.length > maxLength)
    return string.slice(0, maxLength);
  else
    return string.padEnd(maxLength, padChar);
}
