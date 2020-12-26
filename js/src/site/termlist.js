//
// Termlist UI module
//
// https://ultrafunk.com
//


//import * as debugLogger from '../shared/debuglogger.js';
import { shareModal }   from './interaction.js';
import { replaceClass } from '../shared/utils.js';
import { KEY }          from '../shared/storage.js';


export {
  init,
};


/*************************************************************************************************/


//const debug = debugLogger.newInstance('termlist');


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
      shareFindButtonClick(event, shareFindButton);
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

function shareFindButtonClick(event, shareFindButton)
{
  event.preventDefault();

  const termType = shareFindButton.getAttribute('data-term-type');
  const termName = shareFindButton.getAttribute('data-term-name');
  const termUrl  = shareFindButton.getAttribute('data-term-url');

  shareModal.show({ title: `Share / Find ${termType}`, string: termName, url: termUrl, verb: 'Find' });
}

function termlistHeaderClick(event)
{
  event.preventDefault();

  const termlistEntry = event.target.closest('div.termlist-entry');
  const expandToggle  = termlistEntry.querySelector('div.expand-toggle span');
  const termlistBody  = termlistEntry.querySelector('div.termlist-body');
  const isExpanded    = (termlistBody.style.display.length !== 0);

  replaceClass(termlistEntry, (isExpanded ? 'open' : 'closed'), (isExpanded ? 'closed' : 'open'));

  expandToggle.innerText     = isExpanded ? 'expand_more' : 'expand_less';
  termlistBody.style.display = isExpanded ? ''            : 'block';
}
