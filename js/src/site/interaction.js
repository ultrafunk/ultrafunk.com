//
// Ultrafunk site interaction
//
// https://ultrafunk.com
//


import * as debugLogger  from '../shared/debuglogger.js';
import * as utils        from '../shared/utils.js';
import { showModal }     from '../shared/modal.js';
import { showSnackbar }  from '../shared/snackbar.js';
import { KEY, setValue } from '../shared/storage.js';


export {
  init,
  settingsUpdated,
  siteTheme,
  trackLayout,
  shareModal,
};


/*************************************************************************************************/


const debug         = debugLogger.newInstance('site-interaction');
const htmlClassList = document.documentElement.classList;
let settings        = {};


// ************************************************************************************************
//
// ************************************************************************************************

function init(siteSettings)
{
  debug.log('init()');

  settings = siteSettings;

  initPlayerSelection();
  siteTheme.init();
  trackLayout.init();

  utils.addEventListeners('.entry-meta-controls .track-share-control', 'click', trackShareControlClick);
}

function settingsUpdated(updatedSettings)
{
  settings = updatedSettings;
  siteTheme.setCurrent();
  trackLayout.setCurrent();
}

function trackShareControlClick(event)
{
  const artistTrackTitle = event.target.getAttribute('data-artist-track-title');
  const trackUrl         = event.target.getAttribute('data-track-url');
 
  shareModal.show({ string: artistTrackTitle, filterString: true, url: trackUrl });
}


// ************************************************************************************************
// Player selection handling
// ************************************************************************************************

function initPlayerSelection()
{
  const isCompact = document.body.classList.contains('player-playlist');
  document.querySelector('#footer-player-toggle span').textContent = isCompact ? 'Compact' : 'Gallery';

  utils.addEventListeners('#footer-player-toggle', 'click', (event) =>
  {
    event.preventDefault();

    // Remove pagination since it does not match between the two players
    const currentUrl = window.location.href.replace(/\/page\/(?!0)\d{1,6}\//, '');

    if (isCompact)
      window.location.href = currentUrl.replace(/player\//, '');
    else
      window.location.href = currentUrl.replace(/ultrafunk\.com\//, 'ultrafunk.com/player/');
  });
}


// ************************************************************************************************
// Site theme and layout settings helpers
// ************************************************************************************************

function getCurrentSetting(settings, currentId, defaultSetting)
{
  const setting = Object.values(settings).find(value => value.id === currentId);
  return ((setting !== undefined) ? setting : defaultSetting);
}

function getNextSetting(settings, currentSetting)
{
  const index = Object.values(settings).findIndex(value => value.id === currentSetting.id);
  const keys  = Object.keys(settings);
  return (((index + 1) < keys.length) ? settings[keys[index + 1]] : settings[keys[0]]);
}


// ************************************************************************************************
// Site theme handling
// ************************************************************************************************

const siteTheme = (() =>
{
  let currentTheme = {};
  const elements   = { toggle: null };

  const config = {
    toggleId:       '#footer-site-theme-toggle',
    prefDarkScheme: '(prefers-color-scheme: dark)',
  };
  
  const themes = {
    light: { id: 'light', text: 'light', class: 'site-theme-light' },
    dark:  { id: 'dark',  text: 'dark',  class: 'site-theme-dark'  },
    auto:  { id: 'auto',  text: 'auto'                             }, // This has no CSS class since auto is always light or dark
  };

  return {
    init,
    setCurrent,
    toggle,
  };

  function init()
  {
    elements.toggle = document.querySelector(config.toggleId);
    const mediaQueryList = window.matchMedia(config.prefDarkScheme);
    mediaQueryList.addEventListener('change', matchMediaPrefColorScheme);
    utils.addEventListeners(config.toggleId, 'click', toggle);
    setCurrent();
  }
  
  function setCurrent()
  {
    currentTheme = getCurrentSetting(themes, settings.user.theme, themes.auto);
    updateData();
  }
  
  function matchMediaPrefColorScheme()
  {
    if (currentTheme.id === themes.auto.id)
      updateData();
  }
  
  function toggle(event)
  {
    event.preventDefault();
    currentTheme = getNextSetting(themes, currentTheme);
    settings.user.theme = currentTheme.id;
    updateData();  
  }
  
  function updateData()
  {
    let newTheme = currentTheme;
  
    if (currentTheme.id === themes.auto.id)
      newTheme = window.matchMedia(config.prefDarkScheme).matches ? themes.dark : themes.light;
  
    setValue(KEY.UF_SITE_THEME, newTheme.id);
    updateDOM(newTheme);
  }
  
  function updateDOM(newTheme)
  {
    // Only update DOM if something has actually changed...
    if (htmlClassList.contains(newTheme.class) === false)
    {
      debug.log(`updateDOM() - newSiteTheme: ${newTheme.id}`);
    
      htmlClassList.remove(themes.light.class, themes.dark.class);
      htmlClassList.add(newTheme.class);
    }

    // Always update this because AUTO is not a separate class (only DARK + LIGHT are classes)
    elements.toggle.querySelector('span').textContent = currentTheme.text;
  }
})();


// ************************************************************************************************
// Track layout handling
// ************************************************************************************************

const trackLayout = (() =>
{
  let currentLayout = {};
  const elements    = { toggle: null };

  const config = {
    toggleId: '#footer-track-layout-toggle',
    minWidth: `(max-width: ${utils.getCssPropString('--site-track-layout-min-width')})`,
  };

  const layouts = {
    list:        { id: 'list',     text: 'list',         class: 'track-layout-list'     },
    twoColumn:   { id: '2-column', text: '2 column',     class: 'track-layout-2-column' },
    threeColumn: { id: '3-column', text: '3 / 4 column', class: 'track-layout-3-column' },
  };

  return {
    init,
    setCurrent,
    toggle,
  };

  function init()
  {
    elements.toggle = document.querySelector(config.toggleId);
    const mediaQueryList = window.matchMedia(config.minWidth);
    mediaQueryList.addEventListener('change', matchMediaMinWidth);
    utils.addEventListeners(config.toggleId, 'click', toggle);
    setCurrent();
  }

  function setCurrent()
  {
    currentLayout = getCurrentSetting(layouts, settings.user.trackLayout, layouts.threeColumn);
    elements.toggle.querySelector('span').textContent = currentLayout.text;
    updateData();
  }
  
  function matchMediaMinWidth(event)
  {
    if (htmlClassList.contains('user-layout'))
      event.matches ? htmlClassList.remove(currentLayout.class) : htmlClassList.add(currentLayout.class);
  }
  
  function toggle(event)
  {
    event.preventDefault();
    currentLayout = getNextSetting(layouts, currentLayout);
    settings.user.trackLayout = currentLayout.id;
    updateData();

    if (event.type === 'click')
      elements.toggle.scrollIntoView();
  }
  
  function updateData()
  {
    setValue(KEY.UF_TRACK_LAYOUT, currentLayout.id);
    updateDOM();
  }
  
  function updateDOM()
  {
    // Only update DOM if needed and when something has actually changed
    if ((htmlClassList.contains('user-layout')) && (htmlClassList.contains(currentLayout.class) === false))
    {
      debug.log(`updateDOM() - newTrackLayout: ${currentLayout.id}`);

      htmlClassList.remove(layouts.list.class, layouts.twoColumn.class, layouts.threeColumn.class);

      if (window.matchMedia(config.minWidth).matches === false)
        htmlClassList.add(currentLayout.class);
    }

    elements.toggle.querySelector('span').textContent = currentLayout.text;
  }
})();


// ************************************************************************************************
// Share Dialog module
// ************************************************************************************************

const shareModal = (() =>
{
  const filterStringRegEx = /\s{1,}[–·-]\s{1,}/i;
  let title, string, filterString, url, verb;

  return {
    show,
  };
  
  function show(args)
  {
    ({
      title        = 'Share / Play Track',
      string       = null,
      filterString = false,
      url          = null,
      verb         = 'Play'
    } = args);

    showModal(title, getSingleChoiceList(verb), singleChoiceListClick);
  }

  function getSingleChoiceList(verb)
  {
    return [
      { id: 'copyToClipboardId', description: '<b>Copy Link</b> to Clipboard'   },
      { id: 'shareOnEmailId',    description: '<b>Share</b> on Email'           },
      { id: 'amazonMusicId',     description: `<b>${verb}</b> on Amazon Music`  },
      { id: 'appleMusicId',      description: `<b>${verb}</b> on Apple Music`   },
      { id: 'spotifyId',         description: `<b>${verb}</b> on Spotify`       },
      { id: 'tidalId',           description: `<b>${verb}</b> on Tidal`         },
      { id: 'youTubeMusicId',    description: `<b>${verb}</b> on YouTube Music` },
    ];
  }

  function singleChoiceListClick(clickId)
  {
    debug.log(`singleChoiceListClick(): ${clickId} - title: "${title}" - string: "${string}" - filterString: ${filterString} - url: ${url} - verb: ${verb}`);

    const searchString = filterString ? encodeURIComponent(string.replace(filterStringRegEx, ' ')) : encodeURIComponent(string);

    switch (clickId)
    {
      case 'copyToClipboardId':
        navigator.clipboard.writeText(url).then(() =>
        {
          showSnackbar('Track link copied to clipboard', 3);
        },
        (reason) =>
        {
          debug.error(`shareModal.copyToClipboard() failed because ${reason}`);
          showSnackbar('Unable to copy Track link to clipboard', 5);
        });
        break;

      case 'shareOnEmailId':
        window.location.href = `mailto:?subject=${encodeURIComponent(string)}&body=${url}%0d%0a`;
        break;

      case 'amazonMusicId':
        window.open(`https://music.amazon.com/search/${searchString}`, "_blank");
        break;

      case 'appleMusicId':
        window.open(`https://music.apple.com/ca/search?term=${searchString}`, "_blank");
        break;

      case 'spotifyId':
        window.open(`https://open.spotify.com/search/${searchString}`, "_blank");
        break;

      case 'tidalId':
        window.open(`https://google.com/search?q=${searchString}%20site:tidal.com`, "_blank");
        break;

      case 'youTubeMusicId':
        window.open(`https://music.youtube.com/search?q=${searchString}`, "_blank");
        break;
    }
  }
})();
