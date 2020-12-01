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
};


/*************************************************************************************************/


const debug  = debugLogger.newInstance('site-interaction');
let settings = {};


// ************************************************************************************************
//
// ************************************************************************************************

function init(siteSettings)
{
  debug.log('init()');

  settings = siteSettings;
  
  trackShare.addEventListeners();
  siteTheme.init();
  trackLayout.init();
}

function settingsUpdated(updatedSettings)
{
  settings = updatedSettings;
  siteTheme.setCurrent();
  trackLayout.setCurrent();
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
    if (document.documentElement.classList.contains(newTheme.class) === false)
    {
      debug.log(`updateDOM() - newSiteTheme: ${newTheme.id}`);
    
      document.documentElement.classList.remove(themes.light.class, themes.dark.class);
      document.documentElement.classList.add(newTheme.class);
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
    minWidth: `(max-width: ${utils.getCssPropString('--site-content-track-layout-min-width')})`,
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
    event.matches ? document.documentElement.classList.remove(currentLayout.class) : document.documentElement.classList.add(currentLayout.class);
  }
  
  function toggle(event, scrollIntoView = false)
  {
    event.preventDefault();
    currentLayout = getNextSetting(layouts, currentLayout);
    settings.user.trackLayout = currentLayout.id;
    updateData();
    if (scrollIntoView) elements.toggle.scrollIntoView();
  }
  
  function updateData()
  {
    setValue(KEY.UF_TRACK_LAYOUT, currentLayout.id);
    updateDOM();
  }
  
  function updateDOM()
  {
    // Only update DOM if something has actually changed...
    if (document.documentElement.classList.contains(currentLayout.class) === false)
    {
      debug.log(`updateDOM() - newTrackLayout: ${currentLayout.id}`);
    
      document.documentElement.classList.remove(layouts.list.class, layouts.twoColumn.class, layouts.threeColumn.class);
  
      if (window.matchMedia(config.minWidth).matches === false)
        document.documentElement.classList.add(currentLayout.class);
    
      elements.toggle.querySelector('span').textContent = currentLayout.text;
    }
  }
})();


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
// Track share module
// ************************************************************************************************

const trackShare = (() =>
{
  let trackTitle = null;
  let trackUrl   = null;
  const separatorRegEx = /\s{1,}[–·-]\s{1,}/i;

  const singleChoiceList = [
    { id: 'copyToClipboard',    description: '<b>Copy Link</b> to Clipboard' },
    { id: 'shareOnEmail',       description: '<b>Share</b> on Email'         },
    { id: 'playOnAmazonMusic',  description: '<b>Play</b> on Amazon Music'   },
    { id: 'playOnAppleMusic',   description: '<b>Play</b> on Apple Music'    },
    { id: 'playOnSpotify',      description: '<b>Play</b> on Spotify'        },
    { id: 'playOnTidal',        description: '<b>Play</b> on Tidal'          },
    { id: 'playOnYouTubeMusic', description: '<b>Play</b> on YouTube Music'  },
  ];

  return {
    addEventListeners,
    click,
  };
  
  function addEventListeners()
  {
    utils.addEventListeners('.entry-meta-controls .track-share-control', 'click', click);
  }

  function click(event)
  {
    trackTitle = event.target.getAttribute('data-entry-track-title');
    trackUrl   = event.target.getAttribute('data-entry-track-url');
    showModal('Share / Play Track', singleChoiceList, singleChoiceListClick);
  }

  function singleChoiceListClick(clickId)
  {
    debug.log(`singleChoiceListClick(): ${clickId} - trackTitle: ${trackTitle} - trackUrl: ${trackUrl}`);

    const searchString = encodeURIComponent(trackTitle.replace(separatorRegEx, ' '));

    switch (clickId)
    {
      case 'copyToClipboard':
        navigator.clipboard.writeText(trackUrl).then(() =>
        {
          showSnackbar('Track link copied to clipboard', 3);
        },
        (reason) =>
        {
          debug.error(`trackShare.copyToClipboard() failed because ${reason}`);
          showSnackbar('Unable to copy Track link to clipboard', 5);
        });
        break;

      case 'shareOnEmail':
        window.location.href = `mailto:?subject=${encodeURIComponent(trackTitle)}&body=${trackUrl}%0d%0a`;
        break;

      case 'playOnAmazonMusic':
        window.open(`https://music.amazon.com/search/${searchString}`, "_blank");
        break;

      case 'playOnAppleMusic':
        window.open(`https://music.apple.com/ca/search?term=${searchString}`, "_blank");
        break;

      case 'playOnSpotify':
        window.open(`https://open.spotify.com/search/${searchString}`, "_blank");
        break;

      case 'playOnTidal':
        window.open(`https://google.com/search?q=${searchString}%20site:tidal.com`, "_blank");
        break;

      case 'playOnYouTubeMusic':
        window.open(`https://music.youtube.com/search?q=${searchString}`, "_blank");
        break;
    }
  }
})();
