//
// Termlist UI module
//
// https://ultrafunk.com
//


import * as debugLogger from '../shared/debuglogger.js';
import * as termRest    from './term-rest.js';
import { KEY }          from '../shared/storage.js';
import { shareModal }   from './interaction.js';
import { replaceClass } from '../shared/utils.js';

import {
  setArtistTitle,
  getYouTubeImgUrl,
} from '../playback/mediaplayers.js';


export {
  init,
};


/*************************************************************************************************/


const debug            = debugLogger.newInstance('termlist');
const artistTitleRegEx = /\s{1,}[–·-]\s{1,}|\s{1,}(&#8211;)\s{1,}/;
const iframeSrcRegEx   = /(?<=src=").*?(?=[?"])/i;
let termlistContainer  = null;


// ************************************************************************************************
// Setup module
// ************************************************************************************************

function init()
{
  debug.log('init()');

  termlistContainer = document.getElementById('termlist-container');

  termlistContainer.addEventListener('click', (event) =>
  {
    const playButton = event.target.closest('div.play-button');
    if (playButton !== null ) return playShuffleButtonClick(event, playButton.querySelector('a').href);

    const shuffleButton = event.target.closest('div.shuffle-button');
    if (shuffleButton !== null ) return playShuffleButtonClick(event, shuffleButton.querySelector('a').href);

    const shareFindButton = event.target.closest('div.share-find-button');
    if (shareFindButton !== null ) return shareFindButtonClick(shareFindButton);
   
    const termlistHeader = event.target.closest('div.termlist-header');
    if (termlistHeader !== null ) return termlistHeaderClick(event);

    const playTrackButton = event.target.closest('div.thumbnail');
    if (playTrackButton !== null ) return playTrackButtonClick(event, playTrackButton);

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
  if (termRest.hasCache())
  {
    const termlistState = {
      pageUrl:     window.location.href,
      scrollPos:   Math.round(window.pageYOffset),
      openTermIds: [],
    };

    document.querySelectorAll('.termlist-entry').forEach(element =>
    {
      if (element.classList.contains('open'))
        termlistState.openTermIds.push(element.id);
    });
    
    sessionStorage.setItem(KEY.UF_TERMLIST_STATE, JSON.stringify(termlistState));
    termRest.writeCache();
  }
}

function restoreState()
{
  termRest.readCache();
  
  if (performance.navigation.type !== performance.navigation.TYPE_RELOAD)
  {
    const termlistState = JSON.parse(sessionStorage.getItem(KEY.UF_TERMLIST_STATE));
 
    if ((termlistState !== null) && (termlistState.pageUrl === window.location.href))
    {
      history.scrollRestoration = 'manual';
      termlistState.openTermIds.forEach(item => document.getElementById(item).querySelector('div.termlist-header').click());
      window.scroll({ top: termlistState.scrollPos, left: 0, behavior: 'auto' });
    }
    else
    {
      history.scrollRestoration = 'auto';
    }
  }

  sessionStorage.removeItem(KEY.UF_TERMLIST_STATE);
  termRest.deleteCache();
}


// ************************************************************************************************
// Click event functions
// ************************************************************************************************

function playShuffleButtonClick(event, destUrl, trackId = null)
{
  event.preventDefault();
  saveState();
//ToDo: Create a playbackSetting for this? Or use SHIFT + click to skip autoplay
  sessionStorage.setItem(KEY.UF_AUTOPLAY, JSON.stringify({ autoplay: (event.shiftKey === false), trackId: trackId, position: 0 }));
  window.location.href = destUrl;
}

function shareFindButtonClick(element)
{
  const termPath = element.getAttribute('data-term-path');
  const termName = element.getAttribute('data-term-name');
  const termUrl  = element.getAttribute('data-term-url');

  shareModal.show({ title: `Share / Find ${termPath}`, string: termName, url: termUrl, verb: 'Find' });
}

function playTrackButtonClick(event, element)
{
  const termPath = (termlistContainer.getAttribute('data-term-type') === 'categories') ? 'channel' : 'artist';
  const termSlug = element.getAttribute('data-term-slug');
  const termUid  = element.getAttribute('data-term-uid');

  if (termUid !== null)
    return playShuffleButtonClick(event, `/list/${termPath}/${termSlug}/`, termUid);
  else
    return playShuffleButtonClick(event, element.getAttribute('data-term-url'));
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
  const termType      = termlistContainer.getAttribute('data-term-type');
  const termId        = parseInt(termlistEntry.getAttribute('data-term-id'));
  const termSlug      = termlistEntry.getAttribute('data-term-slug');
  const isAllChannels = (termType === 'categories');

  termRest.fetchPosts(termType, termId, (isAllChannels ? 10 : 50), (termData) => 
  {
    let header  = isAllChannels ? 'Latest Tracks' : 'All Tracks';
    let element = termlistBody.querySelector('.body-left');

    if (termData !== null)
      insertThumbnailListHtml(header, termSlug, termData, element);
    else
      element.innerHTML = `<b>Error!</b><br>Unable to fetch track data...`;

    if (!isAllChannels && (termData !== null))
    {
      termRest.fetchMeta(termData, termId, 50, (metaType, metadata) =>
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

function getThumbnail(contentHtml)
{
  if (contentHtml.includes('id="soundcloud-uid'))
    return { src: '/wp-content/themes/ultrafunk/inc/img/soundcloud_icon.png', class: 'type-soundcloud' };
  else
    return getYouTubeImgUrl(contentHtml.match(iframeSrcRegEx));
}

function insertThumbnailListHtml(header, termSlug, termData, destElement)
{
  const artistTitle = {};
  let html = `<b>${header}</b>`;

  termData.forEach(item =>
  {
    setArtistTitle(item.title.rendered, artistTitle, artistTitleRegEx);
    const thumbnail   = getThumbnail(item.content.rendered);
    const dataTermUid = (thumbnail?.uid !== undefined) ? `data-term-uid="${thumbnail.uid}"` : '' ;

    html += `
    <div class="track">
      <div class="thumbnail ${thumbnail.class}" data-term-url="${item.link}" data-term-slug="${termSlug}" ${dataTermUid} title="Play Track">
        <img src="${thumbnail.src}">
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
