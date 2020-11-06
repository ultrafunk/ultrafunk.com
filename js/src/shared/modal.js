//
// Modal dialog UI module
//
// https://ultrafunk.com
//


import * as debugLogger from '../shared/debuglogger.js';


export {
  showModal,
};


/*************************************************************************************************/


const debug = debugLogger.getInstance('modal');

const mConfig = {
  id: 'modal',
};

const mTemplate = `
  <div id="${mConfig.id}-dialog" tabindex="-1">
    <div class="${mConfig.id}-container">
      <div class="${mConfig.id}-header">
        <div class="${mConfig.id}-title"></div>
        <div class="${mConfig.id}-close-button"><span class="material-icons" title="Dismiss">close</span></div>
      </div>
      <div class="${mConfig.id}-body"></div>
    </div>
  </div>
`;

const mElements = {
  overlay:   null,
  container: null,
  body:      null,
};

let selectedClick = null;


// ************************************************************************************************
//
// ************************************************************************************************

function showModal(title, singleChoiceList, selectedClickCallback)
{
  debug.log(`showModal(): ${title}`);

  init();
  
  selectedClick = selectedClickCallback;
  setSingleChoiceList(singleChoiceList);

  mElements.container.querySelector(`.${mConfig.id}-title`).innerHTML = title;
  mElements.overlay.classList.add('show');
  mElements.overlay.addEventListener('keydown', keyDown);
  mElements.overlay.focus();
  disablePageScrolling(true);
}

function init()
{
  if (mElements.container === null)
  {
    document.body.insertAdjacentHTML('beforeend', mTemplate);
    
    mElements.overlay   = document.getElementById(`${mConfig.id}-dialog`);
    mElements.container = mElements.overlay.querySelector(`.${mConfig.id}-container`);
    mElements.body      = mElements.overlay.querySelector(`.${mConfig.id}-body`);

    mElements.overlay.addEventListener('click', (event) =>
    {
      if (event.target === mElements.overlay)
        close();
    });

    mElements.overlay.addEventListener('animationend', () =>
    {
      if (mElements.overlay.classList.contains('hide'))
      {
        mElements.overlay.className = '';
        disablePageScrolling(false);
      }
    });

    mElements.overlay.querySelector(`.${mConfig.id}-close-button`).addEventListener('click', close);
  }
}

function setSingleChoiceList(singleChoiceList)
{
  let listHtml = '';

  singleChoiceList.forEach(entry => listHtml += `<div id="${entry.id}" class="${mConfig.id}-single-choice">${entry.description}</div>`);
  mElements.body.innerHTML = listHtml;

  singleChoiceList.forEach(entry => mElements.body.querySelector(`#${entry.id}`).addEventListener('click', singleChoiceListClick));
}

function singleChoiceListClick()
{
  close();
  setTimeout(() => selectedClick(this.id), 150);
}

function keyDown(event)
{
  event.stopPropagation();

  if (event.key === 'Escape')
    close();
}

function close()
{
  mElements.overlay.removeEventListener('keydown', keyDown);
  mElements.overlay.classList.replace('show', 'hide');
}

function disablePageScrolling(disable)
{
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow     = disable ? 'hidden' : '';
  document.body.style.paddingRight = disable ? `${scrollbarWidth}px` : '';
  document.getElementById('site-header').style.paddingRight = disable ? `${scrollbarWidth}px` : '';
}
