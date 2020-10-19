//
// Ultrafunk theme JavaScript
//
// https://ultrafunk.com
//


import * as debugLogger           from './common/debuglogger.js';
import * as storage               from './common/storage.js';
import * as utils                 from './common/utils.js';
import { showModal }              from './common/modal.js';
import { showSnackbar }           from './common/snackbar.js';
import { siteSettings, validate } from './common/settings.js';


/*************************************************************************************************/


const debug  = debugLogger.getInstance('index');
let settings = {};

// Module config, submodules can have local const config = {...}
const mConfig = {
  smoothScrolling:      false,
  settingsUpdatedEvent: 'settingsUpdated',
};

// Module DOM elements, submodules can have local const elements = {...}
const mElements = {
  siteHeader:        null,
  introBanner:       null,
  siteContent:       null,
  siteContentSearch: null,
};


// ************************************************************************************************
//  Document ready and document / window event listeners
// ************************************************************************************************

document.addEventListener('DOMContentLoaded', () =>
{ 
  debug.log('DOMContentLoaded');

  readSettings();
  initIndex();
  
  if (mElements.introBanner !== null)
    showIntroBanner();
  
  if (document.querySelector('#site-content form.search-form') !== null)
  {
    mElements.siteContentSearch.focus();
    mElements.siteContentSearch.setSelectionRange(9999, 9999);
  }

  resize.setTopMargin();
  resize.setLastInnerWidth(window.innerWidth);
  
  setPreviousPageTitle();
});

document.addEventListener(mConfig.settingsUpdatedEvent, () =>
{
  readSettings();
  siteTheme.setCurrent();
  trackLayout.setCurrent();
  storage.setCookie(storage.KEY.UF_TRACKS_PER_PAGE, settings.user.tracksPerPage, (60 * 60 * 24 * 365 * 5));
});

window.addEventListener('load', () => resize.setTopMargin());
window.addEventListener('storage', windowEventStorage);


// ************************************************************************************************
// Read settings and index init
// ************************************************************************************************

function readSettings()
{
  debug.log('readSettings()');
  settings = storage.readWriteSettingsProxy(storage.KEY.UF_SITE_SETTINGS, siteSettings, true);
  validate(settings.user, storage.KEY.UF_SITE_SETTINGS);
  debug.log(settings);
}

function initIndex()
{
  debug.log('initIndex()');

  mElements.siteHeader        = document.getElementById('site-header');
  mElements.introBanner       = document.getElementById('intro-banner');
  mElements.siteContent       = document.getElementById('site-content');
  mElements.siteContentSearch = document.querySelector('#site-content form input.search-field');

  trackShare.addEventListeners();
  resize.addEventListener();
  scroll.addEventListener();

  navSearch.init();
  navMenu.init();
  siteTheme.init();
  trackLayout.init();
}


// ************************************************************************************************
// Keyboard events handling
// ************************************************************************************************

document.addEventListener('keydown', (event) =>
{
  // UI keyboard events (cannot be disable by the user)
  if ((event.ctrlKey === false) && (event.altKey === false))
  {
    switch (event.key)
    {
      case 'Escape':
        if (navMenu.isVisible())
        {
          event.preventDefault();
          navMenu.toggle();
        }
        return;
    }
  }

  // User enabled keyboard shortcuts (on by default)
  if (settings.user.keyboardShortcuts && (event.ctrlKey === false) && (event.altKey === false))
  {
    switch (event.key)
    {
      case 'c':
      case 'C':
        if (searchNotFocused())
        {
          event.preventDefault();
          navMenu.toggle();
        }
        break;

      case 'L':
        if (searchNotFocused() && notSettingsPage())
        {
          trackLayout.toggle(event, false);
          resize.setTopMargin();
        }
        break;

      case 's':
      case 'S':
        if (searchNotFocused())
        {
          event.preventDefault();
          navSearch.toggle();
        }
        break;

      case 'T':
        if (searchNotFocused() && notSettingsPage())
        {
          siteTheme.toggle(event);
        }
        break;
    }
  }
});

function searchNotFocused()
{
  return ((navSearch.isVisible() === false) && (mElements.siteContentSearch !== document.activeElement));
}

function notSettingsPage()
{
  return (document.body.classList.contains('page-template-page-settings') === false);
}


// ************************************************************************************************
// Misc. support functions
// ************************************************************************************************

function windowEventStorage(event)
{
  if (settings.storageChangeSync)
  {
    const oldSettings = storage.parseEventData(event, storage.KEY.UF_SITE_SETTINGS);

    if (oldSettings !== null)
    {
      debug.log(`windowEventStorage(): ${event.key}`);
  
      // Stored settings have changed, read updated settings from storage
      readSettings();
  
      // Check what has changed (old settings vs. new settings) and update data / UI where needed
      if (settings.user.theme !== oldSettings.user.theme)
        siteTheme.setCurrent();
  
      if (settings.user.trackLayout !== oldSettings.user.trackLayout)
        trackLayout.setCurrent();
    }
  }
}

function showIntroBanner()
{
  // Only show intro banners if they can be permanently dismissed
  if (storage.isAvailable('localStorage'))
  {
    if ((typeof bannerProperty !== 'undefined') && (bannerProperty !== null)) // eslint-disable-line no-undef
    {
      if (settings.priv.banners[bannerProperty]) // eslint-disable-line no-undef
      {
        mElements.introBanner.style.display = 'block';
  
        utils.addEventListeners('#intro-banner .intro-banner-close-button', 'click', () =>
        {
          mElements.introBanner.style.display = '';
          resize.setTopMargin();
          settings.priv.banners[bannerProperty] = false; // eslint-disable-line no-undef
        });
      }
    }
  }
}

function setPreviousPageTitle()
{
  if (document.querySelector('.nav-bar-title .go-back-to') !== null)
  {
    let pathString = '';

    if (document.referrer.length === 0)
    {
      pathString = 'Previous Page';
    }
    else
    {
      const referrerUrlParts = new URL(decodeURIComponent(document.referrer));

      if (referrerUrlParts.search.length !== 0)
      {
        pathString = 'Search Results';
      }
      else if (referrerUrlParts.pathname.length > 1)
      {
        const endSlash  = (referrerUrlParts.pathname.slice(-1) === '/') ? 1 : 0;
        const pathParts = referrerUrlParts.pathname.slice(1, referrerUrlParts.pathname.length - endSlash).replace(/-/gi, ' ').split('/');
        pathParts.forEach((part, index) => pathString += ((index + 1) < pathParts.length) ? part + ' / ' : part);
      }
    }

    document.querySelectorAll('#site-navigation .nav-bar-title').forEach(element =>
    {
      element.querySelector('.go-back-title').textContent = (pathString.length > 0) ? pathString : 'Ultrafunk (home)';
      element.querySelector('.go-back-to').style.opacity  = 1;
    });
  }
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
          showSnackbar('Track link copied to the clipboard', 3);
        },
        (reason) =>
        {
          debug.error(`trackShare.copyToClipboard() failed because ${reason}`);
          showSnackbar('Failed to copy Track link to the clipboard', 5);
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
  
    storage.setValue(storage.KEY.UF_SITE_THEME, newTheme.id);
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
    storage.setValue(storage.KEY.UF_TRACK_LAYOUT, currentLayout.id);
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
// Main navigation menu handling
// ************************************************************************************************

const navMenu = (() =>
{
  const observer  = new ResizeObserver(observerCallback);
  const elements  = { navMenu: null, modalOverlay: null };
  let isVisible   = false;

  return {
    isVisible()   { return isVisible;                    },
    scrolledTop() { elements.navMenu.style.display = ''; },
    init,
    toggle,
  };

  function init()
  {
    elements.navMenu      = document.querySelector('#site-navigation .nav-menu-outer');
    elements.modalOverlay = document.getElementById('nav-menu-modal-overlay');

    utils.addEventListeners('.nav-menu-toggle', 'click', toggle);
    elements.modalOverlay.addEventListener('click', toggle);
    elements.modalOverlay.addEventListener('transitionend', transitionEnd);
    observer.observe(elements.navMenu.querySelector('.menu-primary-menu-container'));
  }

  function toggle()
  {
    if (mElements.siteHeader.classList.contains('sticky-nav-up'))
    {
      isVisible ? elements.navMenu.style.display = 'none' : elements.navMenu.style.display = 'flex';
    }
    else
    {
      if (mElements.siteHeader.classList.contains('sticky-nav-down') === false)
        mElements.siteHeader.classList.toggle('hide-nav-menu');
    }
  }

  function observerCallback(entries)
  {
    isVisible = (entries[0].contentRect.height !== 0) ? true : false;

    if (isVisible)
    {
      elements.modalOverlay.className = '';
      elements.modalOverlay.classList.add('show');
      setTimeout(() => elements.modalOverlay.classList.add('fadein'), 50);
    }
    else
    {
      elements.modalOverlay.classList.add('fadeout');
    }
  }

  function transitionEnd()
  {
    if (isVisible === false)
    {
      elements.modalOverlay.className = '';
      elements.navMenu.style.display  = '';
    }
  }
})();


// ************************************************************************************************
// Main navigation search handling
// ************************************************************************************************

const navSearch = (() =>
{
  const allowKeyboardShortcuts = new Event('allowKeyboardShortcuts');
  const denyKeyboardShortcuts  = new Event('denyKeyboardShortcuts');
  const elements = { searchContainer: null, searchField: null };
  let isVisible  = false;

  return {
    isVisible() { return isVisible; },
    init,
    toggle,
    hide,
  };

  function init()
  {
    elements.searchContainer = document.getElementById('search-container');
    elements.searchField     = elements.searchContainer.querySelector('.search-field');

    utils.addEventListeners('.nav-search-toggle', 'click', toggle);
    // To prevent extra 'blur' event before 'click' event
    utils.addEventListeners('.nav-search-toggle', 'mousedown', (event) => event.preventDefault());
    // Hide nav search bar on focus loss
    elements.searchField.addEventListener('blur', hide);
    
    // Hide nav search bar on ESC
    elements.searchField.addEventListener('keydown', (event) =>
    {
      if (event.key === 'Escape')
      {
        event.stopPropagation();
        hide();
      }
    });
  }

  function toggle()
  {
    if (elements.searchContainer.style.display.length === 0)
    {
      if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE) && (scroll.getLastScrollTop() > 0))
      {
        // ToDo: This will not be smooth on iOS... Needs polyfill
        window.scroll(
        {
          top:      0,
          left:     0,
          behavior: (mConfig.smoothScrolling ? 'smooth' : 'auto'),
        });
      }
  
      show();
    }
    else
    {
      hide();
    }
  }
  
  function hide()
  {
    if (isVisible)
      setProps(false, allowKeyboardShortcuts, '', 'search');
  }
  
  function show()
  {
    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE) && (scroll.getLastScrollTop() !== 0))
    {
      // Wait until we are at the top before showing search bar, quick & dirty...
      window.requestAnimationFrame(show);
    }
    else
    {
      setPosSize();
      setProps(true, denyKeyboardShortcuts, 'flex', 'clear');
      elements.searchField.focus();
      elements.searchField.setSelectionRange(9999, 9999);    
    }
  }
  
  function setProps(visible, keyboardShortcuts, display, icon)
  {
    isVisible = visible;
    document.dispatchEvent(keyboardShortcuts);
    elements.searchContainer.style.display = display;
    document.querySelectorAll('div.nav-search-toggle i').forEach(element => element.textContent = icon);
  }
  
  function setPosSize()
  {
    let position = DOMRect;
  
    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
    {
      position.top    = document.body.classList.contains('no-playback') ? 15 : 21;
      position.left   = 68;
      position.right  = document.body.clientWidth - 65;
      position.height = 30;
    }
    else
    {
      position = document.querySelector('div.site-branding-container').getBoundingClientRect();
    }
  
    elements.searchContainer.style.top    = `${position.top}px`;
    elements.searchContainer.style.left   = `${position.left}px`;
    elements.searchContainer.style.width  = `${position.right - position.left}px`;
    elements.searchContainer.style.height = `${position.height}px`;
  }
})();


// ************************************************************************************************
// window.addEventListener('resize') handling
// ************************************************************************************************

const resize = (() =>
{
  let headerHeight   = 0;
  let lastInnerWidth = 0;

  return {
    getHeaderHeight()             { return headerHeight;         },
    setLastInnerWidth(innerWidth) { lastInnerWidth = innerWidth; },
    addEventListener,
    setTopMargin,
  };

  function addEventListener()
  {
    window.addEventListener('resize', () =>
    {
      const innerWidth = window.innerWidth;
  
      if (lastInnerWidth !== innerWidth)
      {
        setTopMargin();
        lastInnerWidth = innerWidth;
      }
    });
  }
  
  function setTopMargin()
  {
    const contentMarginTop = utils.getCssPropValue('--site-content-margin-top');
    
    if (mElements.siteHeader.classList.contains('hide-nav-menu'))
      headerHeight = mElements.siteHeader.offsetHeight;

    if ((mElements.introBanner !== null) && (mElements.introBanner.style.display.length !== 0))
    {
      mElements.introBanner.style.marginTop = `${headerHeight}px`;
      mElements.siteContent.style.marginTop = `${contentMarginTop}px`;
    }
    else
    {
      mElements.siteContent.style.marginTop = `${headerHeight + contentMarginTop}px`;
    }
  }
})();


// ************************************************************************************************
// window.addEventListener('scroll') handling
// ************************************************************************************************

const scroll = (() =>
{
  let lastScrollTop  = 0;
  let isScrolledDown = false;

  return {
    getLastScrollTop() { return lastScrollTop; },
    addEventListener,
  };

  function addEventListener()
  {
    window.addEventListener('scroll', () =>
    {
      const scrollTop          = window.pageYOffset;
      const scrollDownMenuHide = Math.round((resize.getHeaderHeight() > 150) ? (resize.getHeaderHeight() / 2) : (resize.getHeaderHeight() / 3));
    
      if (scrollTop < 1)
        scrolledTop();
      else if ((scrollTop > scrollDownMenuHide) && (scrollTop > lastScrollTop))
        scrolledDown();
      else
        scrolledUp();
      
      // Hide navigation search form on any scroll event
      navSearch.hide();
    
      lastScrollTop = scrollTop;
    });
  }

  function scrolledTop()
  {
    mElements.siteHeader.classList.remove('sticky-nav-down', 'sticky-nav-up');
    mElements.siteHeader.classList.add('hide-nav-menu');
    navMenu.scrolledTop();
    resize.setTopMargin();
  }

  function scrolledDown()
  {
    if (isScrolledDown === false)
    {
      isScrolledDown = true;
      utils.replaceClass(mElements.siteHeader, 'sticky-nav-up', 'sticky-nav-down');
    }
  }

  function scrolledUp()
  {
    if (isScrolledDown === true)
    {
      isScrolledDown = false;
      utils.replaceClass(mElements.siteHeader, 'sticky-nav-down', 'sticky-nav-up');
    }

    if (navMenu.isVisible())
      navMenu.toggle();
  }
})();
