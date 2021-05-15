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

const m = {
  snackbarId:       0,
  actionClick:      null,
  afterClose:       null,
  visibleTimeoutId: -1,
  fadeTimeoutId:    -1,
};

const config = {
  id: 'snackbar',
};

const template = `
  <div id="${config.id}">
    <div class="${config.id}-container">
      <div class="${config.id}-message"></div>
      <div class="${config.id}-action-text"></div>
      <div class="${config.id}-close-icon"><span class="material-icons" title="Dismiss">close</span></div>
    </div>
  </div>
`;

const elements = {
  snackbar:   null,
  actionText: null,
  closeIcon:  null,
};


// ************************************************************************************************
// 
// ************************************************************************************************

function showSnackbar(message, timeout = 5, actionText = null, actionClickCallback = null, afterCloseCallback = null)
{
  debug.log(`showSnackbar(): ${message} (${timeout} sec.)`);

  init();
  reset();

  elements.snackbar.querySelector(`.${config.id}-message`).innerHTML = message;
  elements.snackbar.classList.add('show');
  elements.actionText.style.display = 'none';
  m.afterClose = afterCloseCallback;

  if ((actionText !== null) && (actionClickCallback !== null))
  {
    m.actionClick = actionClickCallback;
    elements.actionText.style.display = 'block';
    elements.actionText.textContent   = actionText;
    elements.actionText.addEventListener('click', actionTextClick);
  }
  else
  {
    // Fix edge case when actionText is hidden...
    matchesMedia(MATCH.SITE_MAX_WIDTH_MOBILE) ? elements.closeIcon.style.paddingLeft = '10px' : elements.closeIcon.style.paddingLeft = '20px';
  }
  
  if (timeout !== 0)
  {
    m.visibleTimeoutId = setTimeout(() =>
    {
      elements.snackbar.classList.add('hide');
      
      m.fadeTimeoutId = setTimeout(() =>
      {
        elements.snackbar.className = '';

        if (m.afterClose !== null)
        {
          m.afterClose();
        }
      }, 450);
    },
    (timeout * 1000));
  }

  return ++m.snackbarId;
}

function init()
{
  if (elements.snackbar === null)
  {
    document.body.insertAdjacentHTML('beforeend', template);

    elements.snackbar   = document.getElementById(config.id);
    elements.actionText = elements.snackbar.querySelector(`.${config.id}-action-text`);
    elements.closeIcon  = elements.snackbar.querySelector(`.${config.id}-close-icon`);
    
    elements.closeIcon.addEventListener('click', () =>
    {
      if (m.afterClose !== null)
        m.afterClose();
        
      reset(true);
    });
  }
}

function actionTextClick()
{
  m.actionClick();
  reset(true);
}

function isShowing()
{
  return ((elements.snackbar !== null) && (elements.snackbar.classList.length === 1) && elements.snackbar.classList.contains('show'));
}

function dismissSnackbar(dismissId = 0)
{
  if (isShowing())
  {
    if ((m.snackbarId === 0) || (m.snackbarId === dismissId))
    {
      elements.snackbar.classList.add('hide');
      m.fadeTimeoutId = setTimeout(() => elements.snackbar.className = '', 450);
    }
  }
}

function reset(hideSnackbar = false)
{
  if (m.visibleTimeoutId !== -1)
  {
    clearTimeout(m.visibleTimeoutId);
    m.visibleTimeoutId = -1;
  }

  if (m.fadeTimeoutId !== -1)
  {
    clearTimeout(m.fadeTimeoutId);
    m.fadeTimeoutId = -1;
  }

  elements.actionText.removeEventListener('click', actionTextClick);

  if (hideSnackbar)
    elements.snackbar.classList.remove('show');
}
