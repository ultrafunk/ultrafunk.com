//
// Modal dialog UI module
//
// https://ultrafunk.com
//


import * as debugLogger from './debuglogger.js';


export {
  showModal,
};


/*************************************************************************************************/


const debug = debugLogger.newInstance('modal');

const m = {
  selectedClick: null,
};

const config = {
  id: 'modal',
};

const template = `
  <div id="${config.id}-dialog" tabindex="-1">
    <div class="${config.id}-dialog-container">
      <div class="${config.id}-dialog-header">
        <div class="${config.id}-dialog-title"></div>
        <div class="${config.id}-dialog-close-icon"><span class="material-icons" title="Dismiss">close</span></div>
      </div>
      <div class="${config.id}-dialog-body"></div>
    </div>
  </div>
`;

const elements = {
  overlay:   null,
  container: null,
  body:      null,
};


// ************************************************************************************************
//
// ************************************************************************************************

function showModal(title, singleChoiceList, selectedClickCallback)
{
  debug.log(`showModal(): ${title}`);

  init();
  
  m.selectedClick = selectedClickCallback;
  setSingleChoiceList(singleChoiceList);

  elements.container.querySelector(`.${config.id}-dialog-title`).innerHTML = title;
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
    elements.container = elements.overlay.querySelector(`.${config.id}-dialog-container`);
    elements.body      = elements.overlay.querySelector(`.${config.id}-dialog-body`);

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

    elements.overlay.querySelector(`.${config.id}-dialog-close-icon`).addEventListener('click', close);
  }
}

function setSingleChoiceList(singleChoiceList)
{
  let listHtml = '';

  singleChoiceList.forEach(entry =>
  {
    const entryIcon      = (entry.icon !== undefined) ? `<span class="material-icons">${entry.icon}</span>` : '';
    const entryIconClass = (entryIcon.length !== 0)   ? 'icon'                                              : '';

    if (entry.id === null)
      listHtml += `<div class="${config.id}-${entry.class} ${entryIconClass}">${entryIcon}${entry.text}</div>`;
    else
      listHtml += `<div id="${entry.id}" class="${config.id}-dialog-single-choice ${entryIconClass}">${entryIcon}<span class="text">${entry.text}</span></div>`;
  });
  
  elements.body.innerHTML = listHtml;

  singleChoiceList.forEach(entry =>
  {
    if (entry.id !== null)
      elements.body.querySelector(`#${entry.id}`).addEventListener('click', singleChoiceListClick);
  });
}

function singleChoiceListClick()
{
  close();
  setTimeout(() => m.selectedClick(this.id), 150);
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
//document.documentElement.style.touchAction  = disable ? 'none'   : '';
  document.documentElement.style.overflowY    = disable ? 'hidden' : '';
  document.documentElement.style.paddingRight = disable ? `${scrollbarWidth}px` : '';
  document.getElementById('site-header').style.paddingRight = disable ? `${scrollbarWidth}px` : '';
}
