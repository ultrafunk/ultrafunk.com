//
// Set and get storage values
// Read, write and parse storage JSON data
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=1.12.2';


export {
//Constants
  KEY,
//Functions
  isAvailable,
  setCookie,
  deleteCookie,
  getValue,
  setValue,
  readJson,
  writeJson,
  readWriteSettingsProxy,
  addSettingsObserver,
  parseEventData,
};


const debug     = debugLogger.getInstance('storage');
const observers = [];

const KEY = {
  UF_PLAYBACK_SETTINGS: 'UF_PLAYBACK_SETTINGS',
  UF_SITE_SETTINGS:     'UF_SITE_SETTINGS',
  UF_SITE_THEME:        'UF_SITE_THEME',
  UF_TRACK_LAYOUT:      'UF_TRACK_LAYOUT',
  UF_TRACKS_PER_PAGE:   'UF_TRACKS_PER_PAGE',
};


// ************************************************************************************************
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
// ************************************************************************************************

function isAvailable(storageType)
{
  let storage;

  try
  {
    storage = window[storageType];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  }
  catch(exception)
  {
    return exception instanceof DOMException && (
      // everything except Firefox
      exception.code === 22 ||
      // Firefox
      exception.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      exception.name === 'QuotaExceededError' ||
      // Firefox
      exception.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      (storage && storage.length !== 0);
  }
}


// ************************************************************************************************
// Set and delete cookie key => value pairs
// ************************************************************************************************

function setCookie(keyName, keyValue = '', maxAge = (60 * 60 * 24 * 365), path = '/')
{
  document.cookie = `${keyName}=${keyValue}; Max-Age=${maxAge}; Path=${path}; Secure; SameSite=Strict`;
}

function deleteCookie(keyName, path = '/')
{
  document.cookie = `${keyName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
}


// ************************************************************************************************
// get / set local storage key => value pairs
// ************************************************************************************************

function getValue(keyName, defaultValue = null, setDefault = true)
{
  const keyValue = localStorage.getItem(keyName);

  if (keyValue === null)
  {
    if (setDefault && (defaultValue !== null))
      setValue(keyName, defaultValue);
    
    return defaultValue;
  }
  
  return keyValue;
}

function setValue(keyName, keyValue)
{
  try
  {
    localStorage.setItem(keyName, keyValue);
  }
  catch(exception)
  {
    debug.error(exception);
  }
}


// ************************************************************************************************
// Read (parse) and write (stringify) JSON data from local storage
// ************************************************************************************************

function readJson(keyName, defaultValue = null, setDefault = true)
{
  debug.log(`readJson(): ${keyName} - ${defaultValue} - ${setDefault}`);
  
  const keyValue     = localStorage.getItem(keyName);
  let parsedKeyValue = null;

  if (keyValue === null)
  {
    if (setDefault && (defaultValue !== null))
      writeJson(keyName, defaultValue);

    return defaultValue;
  }
  else
  {
    try
    {
      parsedKeyValue = JSON.parse(keyValue);
    }
    catch(exception)
    {
      debug.error(exception);
    }
  }

  return parsedKeyValue;
}

function writeJson(keyName, keyData)
{
  debug.log(`writeJson(): ${keyName} - ${keyData}`);

  try
  {
    localStorage.setItem(keyName, JSON.stringify(keyData));
  }
  catch(exception)
  {
    debug.error(exception);
  }
}


// ************************************************************************************************
// Merge and cleanup settings objects on new version
// ************************************************************************************************

function mergeObjectProps(oldObject, newObject, keyName)
{
  debug.log(`mergeObjectProps(): Merging ${keyName} from version ${oldObject.version} to version ${newObject.version}`);

  const mergedObject = { ...oldObject,      ...newObject      };
  mergedObject.user  = { ...newObject.user, ...oldObject.user };
  mergedObject.priv  = { ...newObject.priv, ...oldObject.priv };

  if (keyName === KEY.UF_SITE_SETTINGS)
  {
    mergedObject.priv.banners = { ...newObject.priv.banners, ...oldObject.priv.banners };
  }
  else if (keyName === KEY.UF_PLAYBACK_SETTINGS)
  {
    // Handle playback settings only properties here
  }
  
  return mergedObject;
}

function deleteOrphanedKeys(oldObject, newObject)
{
  Object.keys(oldObject).forEach((key) => 
  {
    if ((key in newObject) === false)
    {
      debug.log(`deleteOrphanedKeys(): Deleting '${key}'`);
      delete oldObject[key];
    }
  });
}

function removeOrphanedObjectProps(oldObject, newObject, keyName)
{
  deleteOrphanedKeys(oldObject,      newObject);
  deleteOrphanedKeys(oldObject.user, newObject.user);
  deleteOrphanedKeys(oldObject.priv, newObject.priv);

  if (keyName === KEY.UF_SITE_SETTINGS)
  {
    deleteOrphanedKeys(oldObject.priv.banners, newObject.priv.banners);
  }
  else if (keyName === KEY.UF_PLAYBACK_SETTINGS)
  {
    // Handle playback settings only keys / properties here
  }
}


// ************************************************************************************************
// Read and write settings proxy
// ************************************************************************************************

function readWriteSettingsProxy(settingsKey, defaultSettings = null, setDefault = true)
{
  const parsedJson = readJson(settingsKey, defaultSettings, setDefault);

  if ((parsedJson !== null) && (defaultSettings !== null))
  {
    let settingsObject = null;
    
    // If version is new, perform object merge and cleanup
    if (parsedJson.version < defaultSettings.version)
    {
      debug.log(parsedJson);
      settingsObject = mergeObjectProps(parsedJson, defaultSettings, settingsKey);
      removeOrphanedObjectProps(settingsObject, defaultSettings, settingsKey);
      debug.log(settingsObject);

      writeJson(settingsKey, settingsObject);
    }
    else
    {
      settingsObject = parsedJson;
    }

    return onSettingsChange(settingsKey, settingsObject);
  }

  debug.error(`readWriteSettingsProxy() failed for: ${settingsKey}`);

  return null;
}


// ************************************************************************************************
// Proxy traps (handlers) for settings get and set
// ************************************************************************************************

const onSettingsChange = (settingsKey, settingsObject) =>
{ 
  const handler =
  {
    get(target, property, receiver)
    {
    //debug.log(`onSettingsChange(): Get property: ${property}`);
      
      if (property in target)
      {      
        const value = Reflect.get(target, property, receiver);
        
        if (typeof value === 'object')
          return new Proxy(value, handler);

        return value;
      }

      debug.error(`onSettingsChange(): Get unknown property: ${property}`);
    },
    
    set(target, property, newValue, receiver)
    {
    //debug.log(`onSettingsChange(): Set property: ${property}`);

      if (property in target)
      {
        const oldValue = Reflect.get(target, property, receiver);

        // Only update and write data if it has changed
        if (newValue !== oldValue)
        {
          Reflect.set(target, property, newValue);
          writeJson(settingsKey, settingsObject);
          callSettingsObservers(property, oldValue, newValue);
        }

        return true;
      }

      debug.error(`onSettingsChange(): Set unknown property: ${property}`);
      return true;
    },
  };

  return new Proxy(settingsObject, handler);
};


// ************************************************************************************************
// Add and call settings observers on changes
// ************************************************************************************************

function addSettingsObserver(property, observer)
{
  debug.log(`addSettingsObserver() for property: ${property}`);
  observers.push({ property: property, observer: observer });
}

function callSettingsObservers(property, oldValue, newValue)
{
  observers.forEach(entry =>
  {
    if (entry.property === property)
    {
      debug.log(`callSettingsObserver() for property: ${property} - oldValue: ${oldValue} - newValue: ${newValue}`);
      entry.observer(oldValue, newValue);
    }
  });
}


// ************************************************************************************************
// Helper for windowEventStorage
// ************************************************************************************************

function parseEventData(event, keyName)
{
  let oldData = null;

  if (event.key === keyName)
  {
    try 
    {
      oldData = JSON.parse(event.oldValue);
    }
    catch(exception)
    {
      debug.error(exception);
    }
  }

  return oldData;
}

