//
// Debug logging helper classes
//
// https://ultrafunk.com
//


export {
  getInstance,
  logErrorOnServer,
};


/*************************************************************************************************/


const DEBUG = false;


// ************************************************************************************************
// DebugLog parent and child classes
// ************************************************************************************************

class DebugLog
{
  constructor(caller = 'unknown')
  {
    this.caller = padString(caller.toUpperCase(), 15, '.');
  }
  
  isDebug()   { return DEBUG;                           }
  warn(data)  { console.warn(`${this.caller}:`,  data); }
  error(data) { console.error(`${this.caller}:`, data); }
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
        eventType:   this.getObjectKeyForValue(eventType, eventLog[i].eventType),
        uId:         eventLog[i].uId,
        timeStamp:   eventLog[i].timeStamp,
      };

      entries.push(data);
    }
    
    this.log(entries);
  }

  getObjectKeyForValue(object, value)
  {
    return Object.keys(object).find(key => object[key] === value);
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
// DebugLog class support functions
// ************************************************************************************************

function getInstance(caller)
{
  return ((DEBUG === true) ? new DevBuild(caller) : new ProdBuild(caller));
}

function padString(string, maxLength, padChar)
{
  return ((string.length > maxLength) ? string.slice(0, maxLength) : string.padEnd(maxLength, padChar));
}

function logErrorOnServer(errorCategory, errorData)
{
  const eventAction = errorData.mediaUrl + ' | ' + errorData.mediaTitle;
  
  console.log(`DEBUGLOGGER....: logErrorOnServer(): ${errorCategory} - ${eventAction}`);
  
  gtag('event', eventAction, // eslint-disable-line no-undef
  {
    event_category: errorCategory,
    event_label:    'Ultrafunk Client Error',
  });
}
