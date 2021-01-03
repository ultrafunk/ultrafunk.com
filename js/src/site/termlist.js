//
// Termlist UI module
//
// https://ultrafunk.com
//


import * as debugLogger           from '../shared/debuglogger.js';
import { shareModal }             from './interaction.js';
import { KEY }                    from '../shared/storage.js';
import { replaceClass }           from '../shared/utils.js';
import { fetchTracks, fetchMeta } from './term-rest.js';


export {
  init,
};


/*************************************************************************************************/


const debug = debugLogger.newInstance('termlist');


// ************************************************************************************************
//
// ************************************************************************************************

function init()
{
  document.getElementById('termlist-container').addEventListener('click', (event) =>
  {
    const playButton      = event.target.closest('div.play-button');
    const shuffleButton   = event.target.closest('div.shuffle-button');
    const shareFindButton = event.target.closest('div.share-find-button');
    const termlistHeader  = event.target.closest('div.termlist-header');
  
    if (playButton !== null)
      playShuffleButtonClick(event, playButton.querySelector('a').href);
    else if (shuffleButton !== null)
      playShuffleButtonClick(event, shuffleButton.querySelector('a').href);
    else if (shareFindButton !== null)
      shareFindButtonClick(shareFindButton);
    else if (termlistHeader !== null)
      termlistHeaderClick(event);
  });
}


// ************************************************************************************************
//
// ************************************************************************************************

function playShuffleButtonClick(event, destUrl)
{
  event.preventDefault();

//ToDo: Create a playbackSetting for this? Or use SHIFT + click to skip autoplay
  sessionStorage.setItem(KEY.UF_AUTOPLAY, 'true');
  window.location.href = destUrl;
}

function shareFindButtonClick(shareFindButton)
{
  const termType = shareFindButton.getAttribute('data-term-type');
  const termName = shareFindButton.getAttribute('data-term-name');
  const termUrl  = shareFindButton.getAttribute('data-term-url');

  shareModal.show({ title: `Share / Find ${termType}`, string: termName, url: termUrl, verb: 'Find' });
}

function termlistHeaderClick(event)
{
  const termlistEntry = event.target.closest('div.termlist-entry');
  const expandToggle  = termlistEntry.querySelector('div.expand-toggle span');
  const termlistBody  = termlistEntry.querySelector('div.termlist-body');
  const isExpanded    = (termlistBody.style.display.length !== 0);

  replaceClass(termlistEntry, (isExpanded ? 'open' : 'closed'), (isExpanded ? 'closed' : 'open'));

  expandToggle.innerText     = isExpanded ? 'expand_more' : 'expand_less';
  termlistBody.style.display = isExpanded ? ''            : 'flex';

  if (!isExpanded)
    fetchDataUpdateDOM(termlistEntry, termlistBody);
}


// ************************************************************************************************
//
// ************************************************************************************************

function fetchDataUpdateDOM(termlistEntry, termlistBody)
{
  const termType      = document.getElementById('termlist-container').getAttribute('data-term-type');
  const termId        = parseInt(termlistEntry.getAttribute('data-term-id'));
  const isAllChannels = (termType === 'categories');

  fetchTracks(termType, termId, (isAllChannels ? 10 : 50), (termData) => 
  {
    debug.log(termData);

    let header  = isAllChannels ? '10 Latest Tracks' : 'All Tracks';
    let element = termlistBody.querySelector('.body-left');

    if (termData !== null)
      insertListHtml(termData, header, element);
    else
      element.innerHTML = `<b>Error!</b><br>Unable to fetch track data...`;

    if (!isAllChannels && (termData !== null))
    {
      fetchMeta(termData, termId, 50, (metaType, metadata) =>
      {
        debug.log(metadata);

        header  = (metaType === 'tags') ? 'Related Artists' : 'In Channels';
        element = (metaType === 'tags') ? termlistBody.querySelector('.artists') : termlistBody.querySelector('.channels');

        if (metadata !== null)
          insertLinksHtml(metadata, header, element);
        else
          element.innerHTML = `<b>${header}</b><br>None found`;
      });
    }
  });
}

function insertListHtml(termData, header, element)
{
  let html = `<b>${header}</b><ul>`;
  termData.forEach(item => html += `<li><a href="${item.link}">${item.title.rendered}</a></li>`);
  element.innerHTML = html + '</ul>';
}

function insertLinksHtml(termData, header, element)
{
  let html = `<b>${header}</b><br>`;
  termData.forEach(item => html += `<a href="${item.link}">${item.name}</a>, `);
  element.innerHTML = html.slice(0, (html.length - 2));
}
