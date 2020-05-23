//
// Common utility functions
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=1.6.3';


export {
//Constants
  MATCH,
//Functions
  addEventListeners,
  getCssPropString,
  getCssPropValue,
  matchesMedia,
  getObjectFromKeyValue,
  showSnackbar,
};


const debug = debugLogger.getInstance('utils');

const MATCH = {
  SITE_MIN_WIDTH_WIDE:   1,
  SITE_MAX_WIDTH:        2,
  SITE_MAX_WIDTH_MOBILE: 3,
};

const siteMinWidthWide   = window.matchMedia(`(min-width: ${getCssPropString('--site-min-width-wide')})`);
const siteMaxWidth       = window.matchMedia(`(max-width: ${getCssPropString('--site-max-width')})`);
const siteMaxWidthMobile = window.matchMedia(`(max-width: ${getCssPropString('--site-max-width-mobile')})`);

const config = {
  snackbarAfterId: 'colophon',
  snackbarId:      'snackbar',
};

const elements = {
  snackbar: null,
};


// ************************************************************************************************
// 
// ************************************************************************************************

// Plain JS function equivalent to jQuery(selectors).eventX();
// Adds event listeners of 'type' to all matching selectors 
function addEventListeners(selectors, type, listener, data = null)
{
  const elementList = document.querySelectorAll(selectors);
  elementList.forEach(element => { element.addEventListener(type, (event) => listener(event, data)); });
}

function getCssPropString(prop)
{
  let string = getComputedStyle(document.documentElement).getPropertyValue(prop);

  if (string.length !== 0)
    string = string.replace(/'|"/g, '').trim();
  else
    debug.error(`getCssPropString(${prop}): Returned CSS property string is empty`);

  return string;
}

function getCssPropValue(prop)
{
  const string = getCssPropString(prop);
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
  let matches = false;

  switch (matchMedia)
  {
    case MATCH.SITE_MIN_WIDTH_WIDE:
      return siteMinWidthWide.matches;
      
    case MATCH.SITE_MAX_WIDTH:
      return siteMaxWidth.matches;

    case MATCH.SITE_MAX_WIDTH_MOBILE:
      return siteMaxWidthMobile.matches;
  }

  return matches;
}

function getObjectFromKeyValue(object, key, value, defaultObject)
{
  const values = Object.values(object);

  for (let i = 0; i < values.length; i++)
  {
    if (values[i][key] === value)
      return values[i];
  }

  return defaultObject;
}


// ************************************************************************************************
// Snackbar UI
// ************************************************************************************************

let snackbarVisibleTimeoutId = -1;
let snackbarFadeTimeoutId    = -1;

const snackbarHtml = `
  <div id="${config.snackbarId}">
    <div class="${config.snackbarId}-wrapper">
      <div class="${config.snackbarId}-message">
      </div>
      <div class="${config.snackbarId}-button">
        <span class="material-icons" title="Dismiss">close</span>
      </div>
    </div>
  </div>
`;

function initSnackbar()
{
  if (elements.snackbar === null)
  {
    const afterElement = document.getElementById(config.snackbarAfterId);
  
    if (afterElement !== null)
    {
      afterElement.insertAdjacentHTML('afterend', snackbarHtml);
      elements.snackbar = document.getElementById(config.snackbarId);
      elements.snackbar.querySelector(`.${config.snackbarId}-button`).addEventListener('click', () => resetSnackbar(true));
    }
    else
    {
      debug.error(`initSnackbar(): Unable to insert snackbar HTML after: ${config.snackbarAfterId}`);
    }
  }
}

function resetSnackbar(hideSnackbar = false)
{
  if (snackbarVisibleTimeoutId !== -1)
  {
    clearTimeout(snackbarVisibleTimeoutId);
    snackbarVisibleTimeoutId = -1;
  }

  if (snackbarFadeTimeoutId !== -1)
  {
    clearTimeout(snackbarFadeTimeoutId);
    snackbarFadeTimeoutId = -1;
  }

  if (hideSnackbar)
    elements.snackbar.classList.remove('fadein');
}

function showSnackbar(message, timeout = 5)
{
  debug.log(`showSnackbar(): ${message} (${timeout} sec)`);

  initSnackbar();

  if (elements.snackbar === null)
  {
    debug.error(`showSnackbar(): Unable to show snackbar with id: ${config.snackbarId}`);
  }
  else
  {
    resetSnackbar();
    elements.snackbar.querySelector(`.${config.snackbarId}-message`).innerHTML = message;
    elements.snackbar.classList.add('fadein');
    
    if (timeout !== 0)
    {
      snackbarVisibleTimeoutId = setTimeout(() =>
      {
        elements.snackbar.classList.add('fadeout');
        snackbarFadeTimeoutId = setTimeout(() => { elements.snackbar.classList.value = ''; }, 450);
      },
      (timeout * 1000));
    }
  }
}
