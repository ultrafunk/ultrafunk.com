//
// Debug logging helper classes
//
// https://ultrafunk.com
//


export {
  newInstance,
  logErrorOnServer,
};


/*************************************************************************************************/


const DEBUG = false;


// ************************************************************************************************
// DebugLog parent and child classes
// ************************************************************************************************

class DebugLog
{
  constructor(moduleName = 'unknown')
  {
    this.moduleName = padString(moduleName.toUpperCase(), 20, '.');
  }
  
  isDebug()   { return DEBUG;                               }
  warn(data)  { console.warn(`${this.moduleName}:`,  data); }
  error(data) { console.error(`${this.moduleName}:`, data); }
}

class DevBuild extends DebugLog
{
  constructor(moduleName) { super(moduleName); }

  log(data)
  {
    console.log(`${this.moduleName}:`, data);
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
    return Object.keys(object).find(key => (object[key] === value));
  }
}

class ProdBuild extends DebugLog
{
  constructor(moduleName) { super(moduleName); }

  log()                  {}
  logEventLog()          {}
  getObjectKeyForValue() {}
}


// ************************************************************************************************
// DebugLog class support functions
// ************************************************************************************************

function newInstance(moduleName)
{
  return ((DEBUG === true) ? new DevBuild(moduleName) : new ProdBuild(moduleName));
}

function padString(string, maxLength, padChar)
{
  return ((string.length > maxLength) ? string.slice(0, maxLength) : string.padEnd(maxLength, padChar));
}

function logErrorOnServer(errorCategory, errorData)
{
  const eventAction = errorData.mediaUrl + ' | ' + errorData.mediaTitle;
  
  console.log(`DEBUGLOGGER.........: logErrorOnServer(): ${errorCategory} - ${eventAction}`);
  
  gtag('event', eventAction, // eslint-disable-line no-undef
  {
    event_category: errorCategory,
    event_label:    'Ultrafunk Client Error',
  });
}
