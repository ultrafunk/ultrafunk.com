//
// Snackbar UI module
//
// https://ultrafunk.com
//


import * as debugLogger        from './debuglogger.js';
import { MATCH, matchesMedia } from './utils.js';


export {
  showSnackbar,
  dismissSnackbar,
};


/*************************************************************************************************/


const debug = debugLogger.newInstance('snackbar');

const mConfig = {
  id: 'snackbar',
};

const mTemplate = `
  <div id="${mConfig.id}">
    <div class="${mConfig.id}-container">
      <div class="${mConfig.id}-message"></div>
      <div class="${mConfig.id}-action-button"></div>
      <div class="${mConfig.id}-close-button"><span class="material-icons" title="Dismiss">close</span></div>
    </div>
  </div>
`;

const mElements = {
  snackbar:     null,
  actionButton: null,
  closeButton:  null,
};

let snackbarId       = 0;
let actionClick      = null;
let afterClose       = null;
let visibleTimeoutId = -1;
let fadeTimeoutId    = -1;


// ************************************************************************************************
// 
// ************************************************************************************************

function showSnackbar(message, timeout = 5, actionText = null, actionClickCallback = null, afterCloseCallback = null)
{
  debug.log(`showSnackbar(): ${message} (${timeout} sec.)`);

  init();
  reset();

  mElements.snackbar.querySelector(`.${mConfig.id}-message`).innerHTML = message;
  mElements.snackbar.classList.add('show');
  mElements.actionButton.style.display = 'none';
  afterClose = afterCloseCallback;

  if ((actionText !== null) && (actionClickCallback !== null))
  {
    actionClick = actionClickCallback;
    mElements.actionButton.style.display = 'block';
    mElements.actionButton.textContent   = actionText;
    mElements.actionButton.addEventListener('click', actionButtonClick);
  }
  else
  {
    // Fix edge case when actionButton is hidden...
    matchesMedia(MATCH.SITE_MAX_WIDTH_MOBILE) ? mElements.closeButton.style.paddingLeft = '10px' : mElements.closeButton.style.paddingLeft = '20px';
  }
  
  if (timeout !== 0)
  {
    visibleTimeoutId = setTimeout(() =>
    {
      mElements.snackbar.classList.add('hide');
      
      fadeTimeoutId = setTimeout(() =>
      {
        mElements.snackbar.className = '';

        if (afterClose !== null)
        {
          afterClose();
        }
      }, 450);
    },
    (timeout * 1000));
  }

  return ++snackbarId;
}

function init()
{
  if (mElements.snackbar === null)
  {
    document.body.insertAdjacentHTML('beforeend', mTemplate);

    mElements.snackbar     = document.getElementById(mConfig.id);
    mElements.actionButton = mElements.snackbar.querySelector(`.${mConfig.id}-action-button`);
    mElements.closeButton  = mElements.snackbar.querySelector(`.${mConfig.id}-close-button`);
    
    mElements.closeButton.addEventListener('click', () =>
    {
      if (afterClose !== null)
        afterClose();
        
      reset(true);
    });
  }
}

function actionButtonClick()
{
  actionClick();
  reset(true);
}

function isShowing()
{
  return ((mElements.snackbar !== null) && (mElements.snackbar.classList.length === 1) && mElements.snackbar.classList.contains('show'));
}

function dismissSnackbar(dismissId = 0)
{
  if (isShowing())
  {
    if ((snackbarId === 0) || (snackbarId === dismissId))
    {
      mElements.snackbar.classList.add('hide');
      fadeTimeoutId = setTimeout(() => mElements.snackbar.className = '', 450);
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

  mElements.actionButton.removeEventListener('click', actionButtonClick);

  if (hideSnackbar)
    mElements.snackbar.classList.remove('show');
}
