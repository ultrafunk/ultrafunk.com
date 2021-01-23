//
// Termlist UI module
//
// https://ultrafunk.com
//


import * as debugLogger from '../shared/debuglogger.js';
import { KEY }          from '../shared/storage.js';
import { shareModal }   from './interaction.js';
import { replaceClass } from '../shared/utils.js';

import {
  setArtistTitle,
  getYouTubeImgUrl,
} from '../playback/mediaplayers.js';

import {
  fetchTermPosts,
  fetchTermMeta,
  readTermCache,
  writeTermCache,
  hasTermCache,
  deleteTermCache,
} from './term-rest.js';


export {
  init,
};


/*************************************************************************************************/


const debug            = debugLogger.newInstance('termlist');
const artistTitleRegEx = /\s{1,}[–·-]\s{1,}|\s{1,}(&#8211;)\s{1,}/i;
const iframeSrcRegEx   = /(?<=src=").*?(?=[?"])/i;


// ************************************************************************************************
// Setup module
// ************************************************************************************************

function init()
{
  debug.log('init()');

  document.getElementById('termlist-container').addEventListener('click', (event) =>
  {
    const playButton = event.target.closest('div.play-button');
    if (playButton !== null ) return playShuffleButtonClick(event, playButton.querySelector('a').href);

    const shuffleButton = event.target.closest('div.shuffle-button');
    if (shuffleButton !== null ) return playShuffleButtonClick(event, shuffleButton.querySelector('a').href);

    const shareFindButton = event.target.closest('div.share-find-button');
    if (shareFindButton !== null ) return shareFindButtonClick(shareFindButton);
   
    const termlistHeader = event.target.closest('div.termlist-header');
    if (termlistHeader !== null ) return termlistHeaderClick(event);

    const thumbnailPlay = event.target.closest('div.thumbnail');
    if (thumbnailPlay !== null ) return playShuffleButtonClick(event, thumbnailPlay.getAttribute('data-track-url'));

    const linkElement = event.target.closest('a');
    if (linkElement !== null) return saveState();
  });

  restoreState();
}


// ************************************************************************************************
// Save and restore Termlist state
// ************************************************************************************************

function saveState()
{
  if (hasTermCache())
  {
    const termListState = {
      pageUrl:     window.location.href,
      scrollPos:   Math.round(window.pageYOffset),
      openTermIds: [],
    };

    document.querySelectorAll('.termlist-entry').forEach(element =>
    {
      if (element.classList.contains('open'))
        termListState.openTermIds.push(element.id);
    });
    
    sessionStorage.setItem(KEY.UF_TERMLIST_STATE, JSON.stringify(termListState));
    writeTermCache();
  }
}

function restoreState()
{
  readTermCache();
  
  if (performance.navigation.type !== performance.navigation.TYPE_RELOAD)
  {
    const termListState = JSON.parse(sessionStorage.getItem(KEY.UF_TERMLIST_STATE));
 
    if ((termListState !== null) && (termListState.pageUrl === window.location.href))
    {
      history.scrollRestoration = 'manual';
      termListState.openTermIds.forEach(item => document.getElementById(item).querySelector('div.termlist-header').click());
      window.scroll({ top: termListState.scrollPos, left: 0, behavior: 'auto' });
    }
    else
    {
      history.scrollRestoration = 'auto';
    }
  }

  sessionStorage.removeItem(KEY.UF_TERMLIST_STATE);
  deleteTermCache();
}


// ************************************************************************************************
// Click event functions
// ************************************************************************************************

function playShuffleButtonClick(event, destUrl)
{
  event.preventDefault();
  saveState();

  // ToDo: Create a playbackSetting for this? Or use SHIFT + click to skip autoplay
  if (event.shiftKey === false)
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
// Fetch data via REST API and update DOM with results
// ************************************************************************************************

function fetchDataUpdateDOM(termlistEntry, termlistBody)
{
  const termType      = document.getElementById('termlist-container').getAttribute('data-term-type');
  const termId        = parseInt(termlistEntry.getAttribute('data-term-id'));
  const isAllChannels = (termType === 'categories');

  fetchTermPosts(termType, termId, (isAllChannels ? 10 : 50), (termData) => 
  {
    let header  = isAllChannels ? 'Latest Tracks' : 'All Tracks';
    let element = termlistBody.querySelector('.body-left');

    if (termData !== null)
      insertThumbnailListHtml(header, termData, element);
    else
      element.innerHTML = `<b>Error!</b><br>Unable to fetch track data...`;

    if (!isAllChannels && (termData !== null))
    {
      fetchTermMeta(termData, termId, 50, (metaType, metadata) =>
      {
        header  = (metaType === 'tags') ? 'Related Artists' : 'In Channels';
        element = (metaType === 'tags') ? termlistBody.querySelector('.artists') : termlistBody.querySelector('.channels');

        if (metadata !== null)
          insertLinksHtml(header, metadata, element);
        else
          element.innerHTML = `<b>${header}</b><br>None found`;
      });
    }
  });
}

function getThumbnailUrl(contentHtml)
{
  if (contentHtml.includes('id="soundcloud-uid'))
    return '/wp-content/themes/ultrafunk/inc/img/soundcloud_icon.png';
  else
    return getYouTubeImgUrl(contentHtml.match(iframeSrcRegEx));
}

function insertThumbnailListHtml(header, termData, destElement)
{
  const artistTitle = {};
  let html = `<b>${header}</b>`;

  termData.forEach(item =>
  {
    setArtistTitle(item.title.rendered, artistTitle, artistTitleRegEx);

    html += `
    <div class="track">
      <div class="thumbnail" data-track-url="${item.link}" title="Play Track">
        <img src="${getThumbnailUrl(item.content.rendered)}">
        <div class="thumbnail-overlay"><span class="material-icons">play_arrow</span></div>
      </div>
      <div class="artist-title text-nowrap-ellipsis">
        <a href="${item.link}" title="Go to track"><span><b>${artistTitle.artist}</b></span><br><span>${artistTitle.title}</span></a>
      </div>
    </div>`;
  });
  
  destElement.innerHTML = html;
}

function insertLinksHtml(header, termData, destElement)
{
  let html = `<b>${header}</b><br>`;
  termData.forEach(item => html += `<a href="${item.link}">${item.name}</a>, `);
  destElement.innerHTML = html.slice(0, (html.length - 2));
}
