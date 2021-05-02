//
// Set and get storage values
// Read, write and parse storage JSON data
//
// https://ultrafunk.com
//


import * as debugLogger from './debuglogger.js';

import {
  playbackSchema,
  siteSchema,
  validateSettings as validateSettingsDeep,
} from  './settings.js';


export {
  KEY,
  isAvailable,
  setCookie,
  deleteCookie,
  getValue,
  setValue,
  readJson,
  writeJson,
  readWriteSettingsProxy,
  addSettingsObserver,
};


/*************************************************************************************************/


const debug     = debugLogger.newInstance('storage');
const observers = {};

const KEY = {
//sessionStorage keys
  UF_AUTOPLAY:          'UF_AUTOPLAY',
  UF_TERMLIST_CACHE:    'UF_TERMLIST_CACHE',
  UF_TERMLIST_STATE:    'UF_TERMLIST_STATE',
//localStorage keys
  UF_PLAYBACK_SETTINGS: 'UF_PLAYBACK_SETTINGS',
  UF_SITE_SETTINGS:     'UF_SITE_SETTINGS',
  UF_PRESET_LIST:       'UF_PRESET_LIST',
  UF_SITE_THEME:        'UF_SITE_THEME',
  UF_GALLERY_LAYOUT:    'UF_GALLERY_LAYOUT',
//document.cookie keys
  UF_TRACKS_PER_PAGE:   'UF_TRACKS_PER_PAGE',
  UF_PREFERRED_PLAYER:  'UF_PREFERRED_PLAYER',
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

function getValue(keyName, defaultValue = null, setDefault = false)
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

function readJson(keyName, defaultValue = null, setDefault = false)
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

      // ToDo: Return error state to specify (for the user) that default settings are used??
      if (defaultValue !== null)
        parsedKeyValue = defaultValue;
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
// Recursive merge and cleanup for settings objects on new version
// ************************************************************************************************

function mergeSettings(oldSettings, newSettings, settingsKey)
{
  debug.log(`mergeSettings(): Merging ${settingsKey} from version ${oldSettings.version} to version ${newSettings.version}`);

  const mergedSettings = { version: newSettings.version };

  mergeDeep(oldSettings, newSettings, mergedSettings);
  cleanDeep(mergedSettings, newSettings);

  return mergedSettings;
}

function mergeDeep(oldSettings, newSettings, destination)
{
  for (const key in newSettings)
  {
    if (typeof newSettings[key] === 'object')
    {
      if (oldSettings && (typeof oldSettings[key] === 'object'))
      {
        debug.log(`mergeDeep() - Merging: ${key}`);
        destination[key] = { ...newSettings[key], ...oldSettings[key] };
        mergeDeep(oldSettings[key], newSettings[key], destination[key]);
      }
      else
      {
        debug.log(`mergeDeep() - Copying: ${key}`);
        destination[key] = { ...newSettings[key] };
        mergeDeep({}, newSettings[key], destination[key]);
      }
    }
  }
}

// Delete all orphaned Settings properties / objects that are no longer in use after merge
function cleanDeep(mergedSettings, newSettings)
{
  for (const key in mergedSettings)
  {
    if ((key in newSettings) === false)
    {
      debug.log(`cleanDeep() - Deleting: ${key} (${(typeof mergedSettings[key] === 'object') ? 'object' : 'property'})`);
      delete mergedSettings[key];
    }
    
    if (typeof mergedSettings[key] === 'object')
      cleanDeep(mergedSettings[key], newSettings[key]);
  }
}

function validateSettings(settingsKey, settingsObject, defaultSettings)
{
  try
  {
    let invalidSettingsCount = 0;

    switch(settingsKey)
    {
      case KEY.UF_PLAYBACK_SETTINGS:
        invalidSettingsCount = validateSettingsDeep(settingsObject, playbackSchema);
        break;

      case KEY.UF_SITE_SETTINGS:
        invalidSettingsCount = validateSettingsDeep(settingsObject, siteSchema);
        break;
    }

    if (invalidSettingsCount > 0)
      writeJson(settingsKey, settingsObject);
  }
  catch(exception)
  {
    debug.error(`validateSettings() exception: ${exception} -- using default settings`);

    writeJson(settingsKey, defaultSettings);

    return defaultSettings;
  }

  return settingsObject;
}


// ************************************************************************************************
// Read and write settings proxy
// ************************************************************************************************

function readWriteSettingsProxy(settingsKey, defaultSettings = null, setDefault = false)
{
  const parsedJson = readJson(settingsKey, defaultSettings, setDefault);

  if ((parsedJson !== null) && (defaultSettings !== null) && (parsedJson.version !== undefined))
  {
    let settingsObject = parsedJson;
    
    // If version is new, perform settings merge and cleanup
    if (parsedJson.version < defaultSettings.version)
    {
      debug.log(parsedJson);

      settingsObject = mergeSettings(parsedJson, defaultSettings, settingsKey);
      writeJson(settingsKey, settingsObject);

      debug.log(settingsObject);
    }

    return onSettingsChange(settingsKey, validateSettings(settingsKey, settingsObject, defaultSettings));
  }

  if (defaultSettings !== null)
  {
    debug.warn(`readWriteSettingsProxy() - Failed for: ${settingsKey} -- using default settings`);

    writeJson(settingsKey, defaultSettings);

    return onSettingsChange(settingsKey, defaultSettings);
  }

  debug.error(`readWriteSettingsProxy() - Fatal error for: ${settingsKey} -- unable to read settings!`);

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
// Add and call settings observers on property changes
// ************************************************************************************************

function addSettingsObserver(property, observer)
{
  debug.log(`addSettingsObserver() for property: ${property}`);

  if ((property in observers) === false)
    observers[property] = [];

  observers[property].push(observer);
}

function callSettingsObservers(property, oldValue, newValue)
{
  if (property in observers)
  {
    debug.log(`callSettingsObserver() for property: ${property} - oldValue: ${oldValue} - newValue: ${newValue}`);
    observers[property].forEach((observer) => observer(oldValue, newValue));
  }
}
