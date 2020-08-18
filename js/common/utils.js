//
// Common utility functions
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=1.10.1';


export {
//Constants
  MATCH,
//Functions
  addEventListeners,
  getCssPropString,
  getCssPropValue,
  matchesMedia,
  replaceClass,
  snackbar,
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


// ************************************************************************************************
// Misc. utility functions
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


// ************************************************************************************************
// Snackbar UI module
// ************************************************************************************************

const snackbar = (() =>
{
  const config = {
    afterId: 'site-footer',
    id:      'snackbar',
  };

  const html = `
    <div id="${config.id}">
      <div class="${config.id}-wrapper">
        <div class="${config.id}-message"></div>
        <div class="${config.id}-action-button"></div>
        <div class="${config.id}-close-button">
          <span class="material-icons" title="Dismiss">close</span>
        </div>
      </div>
    </div>
  `;

  const elements          = { snackbar: null, actionButton: null, closeButton: null };
  let actionClickCallback = null;
  let afterCloseCallback  = null;
  let visibleTimeoutId    = -1;
  let fadeTimeoutId       = -1;
  
  return {
    show,
  };
  
  function show(message, timeout = 5, actionText = null, actionClickCallbackFunc = null, afterCloseCallbackFunc = null)
  {
    debug.log(`snackbar.show(): ${message} (${timeout} sec)`);
  
    init();
  
    if (elements.snackbar === null)
    {
      debug.error(`snackbar.show(): Unable to show snackbar with id: ${config.id}`);
    }
    else
    {
      reset();

      elements.snackbar.querySelector(`.${config.id}-message`).innerHTML = message;
      elements.snackbar.classList.add('fadein');
      elements.actionButton.style.display = 'none';
      afterCloseCallback = afterCloseCallbackFunc;
  
      if ((actionText !== null) && (actionClickCallbackFunc !== null))
      {
        actionClickCallback = actionClickCallbackFunc;
        elements.actionButton.style.display = 'block';
        elements.actionButton.textContent   = actionText;
        elements.actionButton.addEventListener('click', actionButtonClick);
      }
      else
      {
        // Fix edge case when actionButton is hidden...
        matchesMedia(MATCH.SITE_MAX_WIDTH_MOBILE) ? elements.closeButton.style.paddingLeft = '10px' : elements.closeButton.style.paddingLeft = '20px';
      }
      
      if (timeout !== 0)
      {
        visibleTimeoutId = setTimeout(() =>
        {
          elements.snackbar.classList.add('fadeout');
          fadeTimeoutId = setTimeout(() =>
          {
            elements.snackbar.classList.value = '';

            if (afterCloseCallback !== null)
            {
              afterCloseCallback();
            }
          }, 450);
        },
        (timeout * 1000));
      }
    }
  }

  function actionButtonClick()
  {
    actionClickCallback();
    reset(true);
  }

  function init()
  {
    if (elements.snackbar === null)
    {
      const afterElement = document.getElementById(config.afterId);
    
      if (afterElement !== null)
      {
        afterElement.insertAdjacentHTML('afterend', html);
        elements.snackbar     = document.getElementById(config.id);
        elements.actionButton = elements.snackbar.querySelector(`.${config.id}-action-button`);
        elements.closeButton  = elements.snackbar.querySelector(`.${config.id}-close-button`);
        
        elements.closeButton.addEventListener('click', () =>
        {
          if (afterCloseCallback !== null)
            afterCloseCallback();
            
          reset(true);
        });
      }
      else
      {
        debug.error(`snackbar.init(): Unable to insert snackbar HTML after: ${config.afterId}`);
      }
    }
  }
  
  function reset(hideSnackbar = false)
  {
    if (visibleTimeoutId !== -1)
    {
      clearTimeout(visibleTimeoutId);
      visibleTimeoutId = -1;
    }
  
    if (fadeTimeoutId !== -1)
    {
      clearTimeout(fadeTimeoutId);
      fadeTimeoutId = -1;
    }
  
    if (hideSnackbar)
      elements.snackbar.classList.remove('fadein');
  }
})();

