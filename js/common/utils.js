//
// Common utility functions
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=1.12.5';


export {
//Constants
  MATCH,
//Functions
  addEventListeners,
  getCssPropString,
  getCssPropValue,
  matchesMedia,
  replaceClass,
  modal,
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

function disablePageScrolling(disable)
{
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow     = disable ? 'hidden' : '';
  document.body.style.paddingRight = disable ? `${scrollbarWidth}px` : '';
  document.getElementById('site-header').style.paddingRight = disable ? `${scrollbarWidth}px` : '';
}


// ************************************************************************************************
// Modal dialog UI module
// ************************************************************************************************

const modal = (() =>
{
  const config = { id: 'modal' };

  const template = `
    <div id="${config.id}-dialog" tabindex="-1">
      <div class="${config.id}-container">
        <div class="${config.id}-header">
          <div class="${config.id}-title"></div>
          <div class="${config.id}-close-button"><span class="material-icons" title="Dismiss">close</span></div>
        </div>
        <div class="${config.id}-body"></div>
      </div>
    </div>
  `;

  const elements = { overlay: null, container: null, body: null };
  let singleChoiceClickCallback = null;
  
  return {
    show,
  };

  function show(title, singleChoiceList, singleChoiceClickCallbackFunc)
  {
    debug.log(`modal.show(): ${title}`);

    init();
    
    singleChoiceClickCallback = singleChoiceClickCallbackFunc;
    setSingleChoiceList(singleChoiceList);

    elements.container.querySelector(`.${config.id}-title`).innerHTML = title;
    elements.overlay.classList.add('show');
    elements.overlay.addEventListener('keydown', keyDown);
    elements.overlay.focus();
    disablePageScrolling(true);
  }

  function init()
  {
    if (elements.container === null)
    {
      document.body.insertAdjacentHTML('beforeend', template);
      
      elements.overlay   = document.getElementById(`${config.id}-dialog`);
      elements.container = elements.overlay.querySelector(`.${config.id}-container`);
      elements.body      = elements.overlay.querySelector(`.${config.id}-body`);

      elements.overlay.addEventListener('click', (event) =>
      {
        if (event.target === elements.overlay)
          close();
      });

      elements.overlay.addEventListener('animationend', () =>
      {
        if (elements.overlay.classList.contains('hide'))
        {
          elements.overlay.className = '';
          disablePageScrolling(false);
        }
      });

      elements.overlay.querySelector(`.${config.id}-close-button`).addEventListener('click', close);
    }
  }

  function setSingleChoiceList(singleChoiceList)
  {
    let listHtml = '';

    singleChoiceList.forEach(entry => listHtml += `<div id="${entry.id}" class="${config.id}-single-choice">${entry.description}</div>`);
    elements.body.innerHTML = listHtml;

    singleChoiceList.forEach(entry => elements.body.querySelector(`#${entry.id}`).addEventListener('click', singleChoiceListClick));
  }

  function singleChoiceListClick()
  {
    close();
    setTimeout(() => singleChoiceClickCallback(this.id), 150);
  }

  function keyDown(event)
  {
    event.stopPropagation();

    if (event.key === 'Escape')
      close();
  }

  function close()
  {
    elements.overlay.removeEventListener('keydown', keyDown);
    elements.overlay.classList.replace('show', 'hide');
  }
})();


// ************************************************************************************************
// Snackbar UI module
// ************************************************************************************************

const snackbar = (() =>
{
  const config = { id: 'snackbar' };

  const template = `
    <div id="${config.id}">
      <div class="${config.id}-container">
        <div class="${config.id}-message"></div>
        <div class="${config.id}-action-button"></div>
        <div class="${config.id}-close-button"><span class="material-icons" title="Dismiss">close</span></div>
      </div>
    </div>
  `;

  const elements = { snackbar: null, actionButton: null, closeButton: null };
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
    reset();

    elements.snackbar.querySelector(`.${config.id}-message`).innerHTML = message;
    elements.snackbar.classList.add('show');
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
        elements.snackbar.classList.add('hide');
        
        fadeTimeoutId = setTimeout(() =>
        {
          elements.snackbar.className = '';

          if (afterCloseCallback !== null)
          {
            afterCloseCallback();
          }
        }, 450);
      },
      (timeout * 1000));
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
      document.body.insertAdjacentHTML('beforeend', template);

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

    elements.actionButton.removeEventListener('click', actionButtonClick);
  
    if (hideSnackbar)
      elements.snackbar.classList.remove('show');
  }
})();

