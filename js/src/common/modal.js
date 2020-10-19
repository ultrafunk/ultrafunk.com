//
// Modal dialog UI module
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js';


export {
  showModal,
};


/*************************************************************************************************/


const debug = debugLogger.getInstance('modal');

const config = {
  id: 'modal',
};

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

const elements = {
  overlay:   null,
  container: null,
  body:      null,
};

let selectedClickCallback = null;


// ************************************************************************************************
//
// ************************************************************************************************

function showModal(title, singleChoiceList, selectedClickCallbackFunc)
{
  debug.log(`showModal(): ${title}`);

  init();
  
  selectedClickCallback = selectedClickCallbackFunc;
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
  setTimeout(() => selectedClickCallback(this.id), 150);
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

function disablePageScrolling(disable)
{
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow     = disable ? 'hidden' : '';
  document.body.style.paddingRight = disable ? `${scrollbarWidth}px` : '';
  document.getElementById('site-header').style.paddingRight = disable ? `${scrollbarWidth}px` : '';
}
