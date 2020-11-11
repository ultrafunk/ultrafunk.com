//
// Ultrafunk theme JavaScript
//
// https://ultrafunk.com
//


import * as debugLogger from './shared/debuglogger.js';
import * as storage     from './shared/storage.js';
import * as utils       from './shared/utils.js';
import * as interaction from './site/interaction.js';

import {
  siteSettings,
  siteUserSchema,
  siteBannersSchema,
  validateSettings,
} from './shared/settings.js';


/*************************************************************************************************/


const debug   = debugLogger.getInstance('index');
let mSettings = {};

const mConfig = {
  smoothScrolling:      false,
  settingsUpdatedEvent: 'settingsUpdated',
  fullscreenTrackEvent: 'fullscreenTrack',
};

const mElements = {
  siteHeader:        null,
  introBanner:       null,
  siteContent:       null,
  siteContentSearch: null,
  fullscreenTarget:  null,  
};


// ************************************************************************************************
// Document ready and document / window event listeners
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
  interaction.settingsUpdated(mSettings);
  storage.setCookie(storage.KEY.UF_TRACKS_PER_PAGE, mSettings.user.tracksPerPage, (60 * 60 * 24 * 365 * 5));
});

document.addEventListener(mConfig.fullscreenTrackEvent, (event) => mElements.fullscreenTarget = event.fullscreenTarget);

window.addEventListener('load', () => resize.setTopMargin());
window.addEventListener('storage', windowEventStorage);


// ************************************************************************************************
// Read settings and index init
// ************************************************************************************************

function readSettings()
{
  debug.log('readSettings()');
  mSettings = storage.readWriteSettingsProxy(storage.KEY.UF_SITE_SETTINGS, siteSettings, true);
  validateSettings(mSettings.user, siteUserSchema);
  validateSettings(mSettings.priv.banners, siteBannersSchema);
  debug.log(mSettings);
}

function initIndex()
{
  debug.log('initIndex()');

  mElements.siteHeader        = document.getElementById('site-header');
  mElements.introBanner       = document.getElementById('intro-banner');
  mElements.siteContent       = document.getElementById('site-content');
  mElements.siteContentSearch = document.querySelector('#site-content form input.search-field');

  resize.addEventListener();
  scroll.addEventListener();

  interaction.init(mSettings);
  navSearch.init();
  navMenu.init();
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
  if (mSettings.user.keyboardShortcuts && (event.ctrlKey === false) && (event.altKey === false))
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
          interaction.trackLayout.toggle(event, false);
          resize.setTopMargin();
        }
        break;

      case 's':
      case 'S':
        if (searchNotFocused() && notFullscreenTrack())
        {
          event.preventDefault();
          navSearch.toggle();
        }
        break;

      case 'T':
        if (searchNotFocused() && notSettingsPage())
        {
          interaction.siteTheme.toggle(event);
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

function notFullscreenTrack()
{
  return ((mElements.fullscreenTarget === null) ? true : false);
}


// ************************************************************************************************
// Misc. support functions
// ************************************************************************************************

function windowEventStorage(event)
{
  if (mSettings.storageChangeSync)
  {
    const oldSettings = storage.parseEventData(event, storage.KEY.UF_SITE_SETTINGS);

    if (oldSettings !== null)
    {
      debug.log(`windowEventStorage(): ${event.key}`);
  
      // Stored settings have changed, read updated settings from storage
      readSettings();
  
      // Check what has changed (old settings vs. new settings) and update data / UI where needed
      if (mSettings.user.theme !== oldSettings.user.theme)
        interaction.siteTheme.setCurrent();
  
      if (mSettings.user.trackLayout !== oldSettings.user.trackLayout)
        interaction.trackLayout.setCurrent();
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
      if (mSettings.priv.banners[bannerProperty]) // eslint-disable-line no-undef
      {
        mElements.introBanner.style.display = 'block';
  
        utils.addEventListeners('#intro-banner .intro-banner-close-button', 'click', () =>
        {
          mElements.introBanner.style.display = '';
          resize.setTopMargin();
          mSettings.priv.banners[bannerProperty] = false; // eslint-disable-line no-undef
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
  const allowKeyboardShortcutsEvent = new Event('allowKeyboardShortcuts');
  const denyKeyboardShortcutsEvent  = new Event('denyKeyboardShortcuts');
  const elements = { searchContainer: null, searchField: null, brandingContainer: null };
  let isVisible  = false;

  return {
    isVisible() { return isVisible; },
    init,
    toggle,
    hide,
  };

  function init()
  {
    elements.searchContainer   = document.getElementById('search-container');
    elements.searchField       = elements.searchContainer.querySelector('.search-field');
    elements.brandingContainer = mElements.siteHeader.querySelector('div.site-branding-container');

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
      if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
      {
        // Is mobile with no visible nav bar, bail out...
        if ((mElements.siteHeader.querySelector('.nav-bar-container-mobile-top').offsetHeight === 0) &&
            (mElements.siteHeader.querySelector('.nav-bar-container-mobile-up').offsetHeight  === 0))
        {
          return;
        }
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
      setProps(false, allowKeyboardShortcutsEvent, '', 'search');
  }
  
  function show()
  {
    setPosSize();
    setProps(true, denyKeyboardShortcutsEvent, 'flex', 'clear');
    elements.searchField.focus();
    elements.searchField.setSelectionRange(9999, 9999);    
  }
  
  function setProps(visible, keyboardShortcutsEvent, display, icon)
  {
    isVisible = visible;
    document.dispatchEvent(keyboardShortcutsEvent);
    elements.searchContainer.style.display = display;
    document.querySelectorAll('div.nav-search-toggle i').forEach(element => element.textContent = icon);
  }
  
  function setPosSize()
  {
    let position = DOMRect;
  
    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
    {
      if (elements.brandingContainer.offsetHeight !== 0)
        position.top = elements.brandingContainer.offsetTop;
      else
        position.top = mElements.siteHeader.querySelector('.nav-bar-container-mobile-up').offsetTop;

      position.top   += 3;
      position.left   = 63;
      position.right  = document.body.clientWidth - 63;
      position.height = 30;
    }
    else
    {
      position = elements.brandingContainer.getBoundingClientRect();
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
