//
// Shared utility functions
//
// https://ultrafunk.com
//


import * as debugLogger from './debuglogger.js';
import { setCookie }    from './storage.js';


export {
  MATCH,
  addListener,
  addListenerAll,
  getCssPropString,
  getCssPropValue,
  matchesMedia,
  replaceClass,
  shuffleClick,
  fullscreenElement,
  keyboardShortcuts,
};


/*************************************************************************************************/


const debug = debugLogger.newInstance('utils');

const MATCH = {
  SITE_MIN_WIDTH_WIDE:   1,
  SITE_MAX_WIDTH:        2,
  SITE_MAX_WIDTH_MOBILE: 3,
};

const siteMinWidthWide   = window.matchMedia(`(min-width: ${getCssPropString('--site-min-width-wide')})`);
const siteMaxWidth       = window.matchMedia(`(max-width: ${getCssPropString('--site-max-width')})`);
const siteMaxWidthMobile = window.matchMedia(`(max-width: ${getCssPropString('--site-max-width-mobile')})`);


// ************************************************************************************************
// Misc. utility functions
// ************************************************************************************************

function addListener(selectors, type, listener, data = null)
{
  document.querySelector(selectors)?.addEventListener(type, (event) => listener(event, data));
}

// Plain JS function equivalent to jQuery(selectors).eventX();
// Adds event listeners of 'type' to all matching selectors 
function addListenerAll(selectors, type, listener, data = null)
{
  const elementList = document.querySelectorAll(selectors);
  elementList.forEach(element => { element.addEventListener(type, (event) => listener(event, data)); });
}

function getCssPropString(prop, element = document.documentElement)
{
  let string = getComputedStyle(element).getPropertyValue(prop);

  if (string.length !== 0)
    string = string.replace(/'|"/g, '').trim();
  else
    debug.error(`getCssPropString(${prop}): Returned CSS property string is empty`);

  return string;
}

function getCssPropValue(prop, element = document.documentElement)
{
  const string = getCssPropString(prop, element);
  let value    = NaN;

  if (string.length !== 0)
    value = parseInt(string);

  if (isNaN(value))
    debug.error(`getCssPropValue(${prop}): Returned CSS property value is NaN`);

  return value;
}

// Match against live CSS media queries defined in style.css
function matchesMedia(matchMedia)
{
  switch (matchMedia)
  {
    case MATCH.SITE_MIN_WIDTH_WIDE:
      return siteMinWidthWide.matches;
      
    case MATCH.SITE_MAX_WIDTH:
      return siteMaxWidth.matches;

    case MATCH.SITE_MAX_WIDTH_MOBILE:
      return siteMaxWidthMobile.matches;
  }

  return false;
}

function replaceClass(element, removeClass, addClass)
{
  element.classList.remove(removeClass);
  element.classList.add(addClass);
}

function shuffleClick(event)
{
  event.preventDefault();
  setCookie('UF_RESHUFFLE', 'true');
  window.location.href = event.target.closest('a').href;
}


// ************************************************************************************************
// Fullscreen Element module
// ************************************************************************************************

const fullscreenElement = (() =>
{
  const fseEvent = new Event('fullscreenElement');
  let fseTarget  = null;

  return {
    init,
    enter,
    exit,        
    toggle,
  };

  function init()
  {
    document.addEventListener('fullscreenchange',       fullscreenChange);
    document.addEventListener('webkitfullscreenchange', fullscreenChange);
  }

  function fullscreenChange()
  {
    fseTarget = (document.fullscreenElement !== null) ? document.fullscreenElement.id : null;
    fseEvent.fullscreenTarget = fseTarget;
    document.dispatchEvent(fseEvent);
  }

  function enter(fullscreenElement)
  {
    fullscreenElement.requestFullscreen();
  }
  
  function exit()
  {
    if (fseTarget !== null)
    {
      document.exitFullscreen();
      fseTarget = null;
    }
  }

  function toggle(fullscreenElement)
  {
    (fseTarget === null) ? enter(fullscreenElement) : exit();
  }
})();


// ************************************************************************************************
// Allow / Deny keyboard shortcuts event handling
// ************************************************************************************************

const keyboardShortcuts = (() =>
{
  let allow = false;

  return {
    allow() { return allow; },
    init,
  };

  function init(settings)
  {
    allow = settings.keyboardShortcuts;
    document.addEventListener('allowKeyboardShortcuts', () => { if (settings.keyboardShortcuts) allow = true;  });
    document.addEventListener('denyKeyboardShortcuts',  () => { if (settings.keyboardShortcuts) allow = false; });
  }
})();
