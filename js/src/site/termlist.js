//
// Termlist UI module
//
// https://ultrafunk.com
//


import * as debugLogger   from '../shared/debuglogger.js';
import * as termRest      from './term-rest.js';
import { shareModal }     from './interaction.js';
import { PREF_PLAYER }    from '../shared/settings.js';
import { replaceClass }   from '../shared/utils.js';
import { KEY, setCookie } from '../shared/storage.js';

import {
  setArtistTitle,
  getYouTubeImgUrl,
} from '../playback/mediaplayers.js';


export {
  init,
};


/*************************************************************************************************/


const debug  = debugLogger.newInstance('termlist');

const m = {
  settings:          {},
  termlistContainer: null,
};


// ************************************************************************************************
// Setup module
// ************************************************************************************************

function init(siteSettings)
{
  debug.log('init()');

  m.settings          = siteSettings;
  m.termlistContainer = document.getElementById('termlist-container');

  m.termlistContainer.addEventListener('click', (event) =>
  {
    const playButton = event.target.closest('div.play-button');
    if (playButton !== null ) return playButtonClick(event, playButton.querySelector('a').href);

    const shuffleButton = event.target.closest('div.shuffle-button');
    if (shuffleButton !== null ) return shuffleButtonClick(event, shuffleButton.querySelector('a').href);

    const shareFindButton = event.target.closest('div.share-find-button');
    if (shareFindButton !== null ) return shareFindButtonClick(shareFindButton);
   
    const termlistHeader = event.target.closest('div.termlist-header');
    if (termlistHeader !== null ) return termlistHeaderClick(event);

    const playTrackButton = event.target.closest('div.thumbnail');
    if (playTrackButton !== null ) return playTrackButtonClick(event, playTrackButton);

    const linkElement = event.target.closest('a');
    if (linkElement !== null) return linkClicked(event, linkElement);
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

function getPrefPlayerPath(url)
{
  return (m.settings.user.preferredPlayer === PREF_PLAYER.LIST) ? url.replace(/ultrafunk\.com\//, 'ultrafunk.com/list/') : url;
}


// ************************************************************************************************
// Click event functions
// ************************************************************************************************

function playButtonClick(event, destUrl, trackId = null)
{
  event.preventDefault();
  saveState();
//ToDo: Create a playbackSetting for this? Or use SHIFT + click to skip autoplay
  sessionStorage.setItem(KEY.UF_AUTOPLAY, JSON.stringify({ autoplay: (event.shiftKey === false), trackId: trackId, position: 0 }));
  window.location.href = getPrefPlayerPath(destUrl);
}

function shuffleButtonClick(event, destUrl)
{
  setCookie('UF_RESHUFFLE', 'true');
  playButtonClick(event, destUrl);
}

function shareFindButtonClick(element)
{
  const termPath = element.getAttribute('data-term-path');
  const termName = element.getAttribute('data-term-name');
  const termUrl  = getPrefPlayerPath(element.getAttribute('data-term-url'));

  shareModal.show({ title: `Share / Find ${termPath}`, string: termName, url: termUrl, verb: 'Find' });
}

function playTrackButtonClick(event, element)
{
  const termPath = (m.termlistContainer.getAttribute('data-term-type') === 'categories') ? 'channel' : 'artist';
  const termSlug = element.getAttribute('data-term-slug');
  const termUid  = element.getAttribute('data-term-uid');

  if (termUid !== null)
    return playButtonClick(event, `/list/${termPath}/${termSlug}/`, termUid); // ToDo: Add support for settings.user.preferredPlayer here, not hardcoded to /list/
  else
    return playButtonClick(event, element.getAttribute('data-term-url'));
}

function linkClicked(event, element)
{
  saveState();

  if (element.closest('.permalink') !== null)
  {
    event.preventDefault();
    window.location.href = getPrefPlayerPath(element.href);
  }
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
  const termType      = m.termlistContainer.getAttribute('data-term-type');
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


// ************************************************************************************************
//
// ************************************************************************************************

const artistTitleRegEx = /\s{1,}[–·-]\s{1,}|\s{1,}(&#8211;)\s{1,}/;
const iframeSrcRegEx   = /(?<=src=").*?(?=[?"])/i;

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
  termData.forEach(item => html += `<a href="${getPrefPlayerPath(item.link)}">${item.name}</a>, `);
  destElement.innerHTML = html.slice(0, (html.length - 2));
}
