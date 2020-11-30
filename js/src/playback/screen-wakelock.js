//
// Experimental Screen Wake Lock API support: https://web.dev/wakelock/
//
// https://ultrafunk.com
//


import * as debugLogger from '../shared/debuglogger.js';
import { showSnackbar } from '../shared/snackbar.js';


export {
  enable,
//disable,
  stateVisible,
};


/*************************************************************************************************/


const debug  = debugLogger.newInstance('screen-wakelock');
let wakeLock = null;


// ************************************************************************************************
// 
// ************************************************************************************************

function isSupported()
{
  return (('wakeLock' in navigator) && ('request' in navigator.wakeLock));
}

async function enable(settings)
{
  if (isSupported())
  {
    if (document.visibilityState === 'visible')
    {
      /*
      if (wakeLock !== null)
        wakeLock.release();
      */

      if (await request() !== true)
      {
        debug.log('enable(): Screen Wake Lock request failed');
      //showSnackbar('Keep Screen On failed', 3);
      }
    }
  }
  else
  {
    debug.log('enable(): Screen Wake Lock is not supported');
    showSnackbar('Keep Screen On is not supported', 5, 'Turn Off', () => settings.user.keepMobileScreenOn = false);
  }
}

/*
function disable()
{
  debug.log('disable()');

  if (wakeLock !== null)
    wakeLock.release();
}
*/

function stateVisible()
{
  debug.log('stateVisible()');

  if (isSupported() && (wakeLock === null))
    request();
}

async function request()
{
  try
  {
    wakeLock = await navigator.wakeLock.request('screen');

    debug.log('request(): Screen Wake Lock is Enabled');
  //showSnackbar('Keep Screen On success', 3);

    wakeLock.addEventListener('release', () =>
    {
      debug.log('request(): Screen Wake Lock was Released');
    //showSnackbar('Keep Screen On was released', 3);
      wakeLock = null;
    });

    return true;
  }
  catch (exception)
  {
    debug.error(`request(): ${exception.name} - ${exception.message}`);
  }

  return false;
}
