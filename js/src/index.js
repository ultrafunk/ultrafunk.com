//
// Ultrafunk site interaction
//
// https://ultrafunk.com
//


import * as debugLogger from './shared/debuglogger.js';
import * as storage     from './shared/storage.js';
import * as utils       from './shared/utils.js';
import * as interaction from './site/interaction.js';
import * as termlist    from './site/termlist.js';
import { siteSettings } from './shared/settings.js';


/*************************************************************************************************/


const debug  = debugLogger.newInstance('index');

const m = {
  settings: {},
};

const elements = {
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
  
  if (elements.introBanner !== null)
    showIntroBanner();
  
  if (document.getElementById('termlist-container') !== null)
    termlist.init(m.settings);

  if (elements.siteContentSearch !== null)
  {
    elements.siteContentSearch.focus();
    elements.siteContentSearch.setSelectionRange(9999, 9999);
  }

  setPreviousPageTitle();

  document.addEventListener('settingsUpdated', () =>
  {
    readSettings();
    interaction.settingsUpdated(m.settings);
    storage.setCookie(storage.KEY.UF_TRACKS_PER_PAGE,  m.settings.user.tracksPerPage,   (60 * 60 * 24 * 365 * 5));
  //storage.setCookie(storage.KEY.UF_PREFERRED_PLAYER, m.settings.user.preferredPlayer, (60 * 60 * 24 * 365 * 5));
  });
  
  document.addEventListener('fullscreenElement', (event) => elements.fullscreenTarget = event.fullscreenTarget);
  document.addEventListener('keydown', documentEventKeyDown);
});


// ************************************************************************************************
// Read settings and index init
// ************************************************************************************************

function readSettings()
{
  debug.log('readSettings()');
  m.settings = storage.readWriteSettingsProxy(storage.KEY.UF_SITE_SETTINGS, siteSettings, true);
  debug.log(m.settings);
}

function initIndex()
{
  debug.log('initIndex()');

  elements.siteHeader        = document.getElementById('site-header');
  elements.introBanner       = document.getElementById('intro-banner');
  elements.siteContent       = document.getElementById('site-content');
  elements.siteContentSearch = document.querySelector('#site-content form input.search-field');

  interaction.init(m.settings);

  navSearch.init();
  navMenu.init();
  
  resize.addEventListener();
  scroll.addEventListener();
}


// ************************************************************************************************
// Keyboard events handling
// ************************************************************************************************

function documentEventKeyDown(event)
{
  // UI keyboard events (cannot be disable by the user)
  if ((event.repeat  === false) &&
      (event.ctrlKey === false) &&
      (event.altKey  === false))
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
  if (m.settings.user.keyboardShortcuts &&
      (event.repeat  === false)         &&
      (event.ctrlKey === false)         &&
      (event.altKey  === false))
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
          interaction.mProps.galleryLayout.toggle(event);
          resize.trigger();
        }
        break;

      case 's':
      case 'S':
        if (searchNotFocused() && notFullscreenElement())
        {
          event.preventDefault();
          navSearch.toggle();
        }
        break;

      case 'T':
        if (searchNotFocused() && notSettingsPage())
        {
          interaction.mProps.siteTheme.toggle(event);
        }
        break;

      case 'ArrowLeft':
        if (event.shiftKey && noPlayback())
        {
          // eslint-disable-next-line no-undef
          arrowKeyNav(navigationVars.prev);
        }
        break;

      case 'ArrowRight':
        if (event.shiftKey && noPlayback())
        {
          // eslint-disable-next-line no-undef
          arrowKeyNav(navigationVars.next);
        }
        break;
    }
  }
}

function searchNotFocused()
{
  return ((navSearch.isVisible() === false) && (elements.siteContentSearch !== document.activeElement));
}

function notSettingsPage()
{
  return (document.body.classList.contains('page-settings') === false);
}

function notFullscreenElement()
{
  return ((elements.fullscreenTarget === null) ? true : false);
}

function noPlayback()
{
  return (document.body.classList.contains('no-playback'));
}

function arrowKeyNav(destUrl)
{
  if ((destUrl !== undefined) && (destUrl !== null) && (destUrl.length > 0))
    window.location.href = destUrl;
}


// ************************************************************************************************
// Misc. support functions
// ************************************************************************************************

function showIntroBanner()
{
  // Only show intro banners if they can be permanently dismissed
  if (storage.isAvailable('localStorage'))
  {
    if ((typeof bannerProperty !== 'undefined') && (bannerProperty !== null)) // eslint-disable-line no-undef
    {
      if (m.settings.priv.banners[bannerProperty]) // eslint-disable-line no-undef
      {
        elements.introBanner.style.display = 'block';
        resize.trigger();

        utils.addListener('#intro-banner .intro-banner-close-button', 'click', () =>
        {
          elements.introBanner.style.display      = '';
          elements.siteContent.style.marginTop    = '';
          m.settings.priv.banners[bannerProperty] = false; // eslint-disable-line no-undef
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
  const observer = new ResizeObserver(observerCallback);
  let navMenu = null, modalOverlay = null;
  let isVisible = false;

  return {
    isVisible()   { return isVisible;           },
    scrolledTop() { navMenu.style.display = ''; },
    init,
    toggle,
  };

  function init()
  {
    navMenu      = document.querySelector('#site-navigation .nav-menu-outer');
    modalOverlay = document.getElementById('nav-menu-modal-overlay');

    utils.addListenerAll('.nav-menu-toggle', 'click', toggle);
    modalOverlay.addEventListener('click', toggle);
    modalOverlay.addEventListener('transitionend', transitionEnd);
    observer.observe(navMenu.querySelector('.menu-primary-menu-container'));
  }

  function toggle()
  {
    if (elements.siteHeader.classList.contains('sticky-nav-up'))
    {
      isVisible ? navMenu.style.display = 'none' : navMenu.style.display = 'flex';
    }
    else
    {
      if (elements.siteHeader.classList.contains('sticky-nav-down') === false)
        elements.siteHeader.classList.toggle('hide-nav-menu');
    }
  }

  function observerCallback(entries)
  {
    isVisible = (entries[0].contentRect.height !== 0) ? true : false;

    if (isVisible)
    {
      modalOverlay.className = '';
      modalOverlay.classList.add('show');
      /*
      elements.siteHeader.classList.add('no-backdrop-blur');
      */
      setTimeout(() => modalOverlay.classList.add('fadein'), 50);
    }
    else
    {
      /*
      elements.siteHeader.classList.remove('no-backdrop-blur');
      */
      modalOverlay.classList.add('fadeout');
    }
  }

  function transitionEnd()
  {
    if (isVisible === false)
    {
      modalOverlay.className = '';
      navMenu.style.display  = '';
      /*
      //ToDo: This is probably not needed...?
      elements.siteHeader.classList.remove('no-backdrop-blur');
      */
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
  let searchContainer = null, searchField = null, brandingContainer = null;
  let isVisible = false;

  return {
    isVisible() { return isVisible; },
    init,
    toggle,
    hide,
  };

  function init()
  {
    searchContainer   = document.getElementById('search-container');
    searchField       = searchContainer.querySelector('.search-field');
    brandingContainer = elements.siteHeader.querySelector('div.site-branding-container');

    utils.addListenerAll('.nav-search-toggle', 'click', toggle);
    // To prevent extra 'blur' event before 'click' event
    utils.addListenerAll('.nav-search-toggle', 'mousedown', (event) => event.preventDefault());
    // Hide nav search bar on focus loss
    searchField.addEventListener('blur', hide);
    
    // Hide nav search bar on ESC
    searchField.addEventListener('keydown', (event) =>
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
    hasVisibleSearchContainer() ? show() : hide();
  }
  
  function hide()
  {
    if (isVisible)
      setProps(false, allowKeyboardShortcutsEvent, '', 'search');
  }
  
  function hasVisibleSearchContainer()
  {
    if (searchContainer.style.display.length === 0)
    {
      // Has no visible site header at all, bail out...
      if (elements.siteHeader.offsetHeight === 0)
        return false;

      // Is mobile with no visible nav-bar, bail out...
      if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
      {
        if ((elements.siteHeader.querySelector('.nav-bar-container-mobile-top').offsetHeight === 0) &&
            (elements.siteHeader.querySelector('.nav-bar-container-mobile-up').offsetHeight  === 0))
        {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  function show()
  {
    setPosSize();
    setProps(true, denyKeyboardShortcutsEvent, 'flex', 'clear');
    searchField.focus();
    searchField.setSelectionRange(9999, 9999);    
  }
  
  function setProps(visible, keyboardShortcutsEvent, display, icon)
  {
    isVisible = visible;
    document.dispatchEvent(keyboardShortcutsEvent);
    searchContainer.style.display = display;
    document.querySelectorAll('div.nav-search-toggle span').forEach(element => element.textContent = icon);
    isVisible ? document.getElementById('playback-controls').classList.add('hide') : document.getElementById('playback-controls').classList.remove('hide');
  }

  function setPosSize()
  {
    let position = {};

    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
    {
      if (brandingContainer.offsetHeight !== 0)
        position.top = brandingContainer.offsetTop;
      else
        position.top = elements.siteHeader.querySelector('.nav-bar-container-mobile-up').offsetTop;

      position = new DOMRect(63, (position.top + 3), (document.body.clientWidth - 63), 30);
    }
    else
    {
      if (brandingContainer.offsetHeight !== 0)
      {
        const rect = brandingContainer.getBoundingClientRect();
        position   = new DOMRect(rect.left, (rect.top + 10), rect.right, (rect.height - 20));
      }
      else
      {
        const rect = elements.siteHeader.querySelector('.nav-bar-container').getBoundingClientRect();
        position   = new DOMRect((rect.left + 105), (rect.top + 2), (rect.right - 105), (rect.height - 4));
      }
    }
  
    searchContainer.style.left   = `${position.left}px`;
    searchContainer.style.top    = `${position.top}px`;
    searchContainer.style.width  = `${position.width - position.left}px`;
    searchContainer.style.height = `${position.height}px`;
  }
})();


// ************************************************************************************************
// window.addEventListener('resize') handling
// ************************************************************************************************

const resize = (() =>
{
  let headerHeight = 0;

  return {
    getHeaderHeight() { return headerHeight; },
    addEventListener,
    trigger: resizeEvent,
  };

  function addEventListener()
  {
    resizeEvent();
    window.addEventListener('resize', resizeEvent);
  }
  
  function resizeEvent()
  {
    noPlayback() ? headerHeight = utils.getCssPropValue('--site-header-height-no-playback') : headerHeight = utils.getCssPropValue('--site-header-height');

    if ((elements.introBanner !== null) && (elements.introBanner.style.display.length !== 0))
    {
      elements.introBanner.style.marginTop = `${headerHeight}px`;
      elements.siteContent.style.marginTop = `${utils.getCssPropValue('--site-content-margin-top')}px`;
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
    scrollEvent();
    window.addEventListener('scroll', scrollEvent);
  }

  function scrollEvent()
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
  }

  function scrolledTop()
  {
    elements.siteHeader.classList.remove('sticky-nav-down', 'sticky-nav-up');
    elements.siteHeader.classList.add('hide-nav-menu');
    navMenu.scrolledTop();
  }

  function scrolledDown()
  {
    if (isScrolledDown === false)
    {
      isScrolledDown = true;
      utils.replaceClass(elements.siteHeader, 'sticky-nav-up', 'sticky-nav-down');
    }
  }

  function scrolledUp()
  {
    if (isScrolledDown === true)
    {
      isScrolledDown = false;
      utils.replaceClass(elements.siteHeader, 'sticky-nav-down', 'sticky-nav-up');
    }

    if (navMenu.isVisible())
      navMenu.toggle();
  }
})();
