//
// Set and get storage values
// Read, write and parse storage JSON data
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=1.5.6';


export {
//Constants
  KEY,
//Functions
  isAvailable,
  getValue,
  setValue,
  readWriteJsonProxy,
  parseEventData,
};


const debug = debugLogger.getInstance('storage');

const KEY = {
  UF_PLAYBACK_SETTINGS: 'UF_PLAYBACK_SETTINGS',
  UF_SITE_SETTINGS:     'UF_SITE_SETTINGS',
  UF_SITE_THEME:        'UF_SITE_THEME',
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
// 
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
// Read and write localStorage JSON data
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
  debug.log(`removeOrphanedObjectProps() for ${keyName}`);

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

function readWriteJsonProxy(keyName, defaultValue = null, setDefault = true)
{
  const parsedJson = readJson(keyName, defaultValue, setDefault);

  if ((parsedJson !== null) && (defaultValue !== null))
  {
    let onChangeObject = null;
    
    // If version is new, perform object merge and cleanup
    if (parsedJson.version < defaultValue.version)
    {
      debug.log(parsedJson);
      onChangeObject = mergeObjectProps(parsedJson, defaultValue, keyName);
      removeOrphanedObjectProps(onChangeObject, defaultValue, keyName);
      debug.log(onChangeObject);

      writeJson(keyName, onChangeObject);
    }
    else
    {
      onChangeObject = parsedJson;
    }

    return onChangeWrite(onChangeObject, keyName);
  }

  debug.error(`readWriteJsonProxy() failed for: ${keyName}`);

  return null;
}

const onChangeWrite = (onChangeObject, writeKeyName) =>
{ 
  const handler =
  {
    get(target, property, receiver)
    {
    //debug.log(`onChangeWrite(): Get property: ${property}`);
      
      if (property in target)
      {      
        const value = Reflect.get(target, property, receiver);
        
        if (typeof value === 'object')
          return new Proxy(value, handler);

        return value;
      }

      debug.error(`onChangeWrite(): Get unknown property: ${property}`);
    },
    
    set(target, property, newValue, receiver)
    {
    //debug.log(`onChangeWrite(): Set property: ${property}`);

      if (property in target)
      {
        const oldValue = Reflect.get(target, property, receiver);

        // Only update and write data if it has changed
        if (newValue !== oldValue)
        {
          Reflect.set(target, property, newValue);
          writeJson(writeKeyName, onChangeObject);
        }

        return true;
      }

      debug.error(`onChangeWrite(): Set unknown property: ${property}`);
      return true;
    },
  };

  return new Proxy(onChangeObject, handler);
};

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
// 
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

