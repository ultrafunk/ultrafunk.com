//
// Snackbar UI module
//
// https://ultrafunk.com
//


import * as debugLogger        from '../common/debuglogger.js';
import { MATCH, matchesMedia } from '../common/utils.js';


export {
  showSnackbar,
};


/*************************************************************************************************/


const debug = debugLogger.getInstance('snackbar');

const config = {
  id: 'snackbar',
};

const template = `
  <div id="${config.id}">
    <div class="${config.id}-container">
      <div class="${config.id}-message"></div>
      <div class="${config.id}-action-button"></div>
      <div class="${config.id}-close-button"><span class="material-icons" title="Dismiss">close</span></div>
    </div>
  </div>
`;

const elements = {
  snackbar:     null,
  actionButton: null,
  closeButton:  null,
};

let actionClickCallback = null;
let afterCloseCallback  = null;
let visibleTimeoutId    = -1;
let fadeTimeoutId       = -1;


// ************************************************************************************************
// 
// ************************************************************************************************

function showSnackbar(message, timeout = 5, actionText = null, actionClickCallbackFunc = null, afterCloseCallbackFunc = null)
{
  debug.log(`showSnackbar(): ${message} (${timeout} sec.)`);

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

function actionButtonClick()
{
  actionClickCallback();
  reset(true);
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
