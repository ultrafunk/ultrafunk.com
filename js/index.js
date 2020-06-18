//
// Ultrafunk theme JavaScript
//
// https://ultrafunk.com
//


import * as debugLogger from './common/debuglogger.js?ver=1.7.8';
import * as storage     from './common/storage.js?ver=1.7.8';
import * as utils       from './common/utils.js?ver=1.7.8';


const debug  = debugLogger.getInstance('index');
let settings = {};

// Shared config for all, submodules can have local const config = {...}
const moduleConfig = {
  smoothScrolling:      false,
  siteThemeDefaultId:   'auto',
  trackLayoutDefaultId: '3-column',
};

const defaultSettings = {
  // Incremental version to check for new properties
  version:           3,
  storageChangeSync: false,
  // User (public) settings
  user: {
    siteTheme:   moduleConfig.siteThemeDefaultId,
    trackLayout: moduleConfig.trackLayoutDefaultId,
  },
  // Priv (private / internal) settings
  priv: {
    banners: {
      showFrontpageIntro: true,
      showPremiumIntro:   true,
    },
  },
};

// Shared DOM elements for all, submodules can have local const elements = {...}
const moduleElements = {
  siteHeader:        null,
  introBanner:       null,
  siteContent:       null,
  siteContentSearch: null,
};


// ************************************************************************************************
//
// ************************************************************************************************

document.addEventListener('DOMContentLoaded', () =>
{ 
  debug.log('DOMContentLoaded');

  readSettings();
  initIndex();
  
  if (moduleElements.introBanner !== null)
    showIntroBanner();
  
  if (document.querySelector('#site-content form.search-form') !== null)
  {
    moduleElements.siteContentSearch.focus();
    moduleElements.siteContentSearch.setSelectionRange(9999, 9999);
  }

  resize.setTopMargin();
  resize.setLastInnerWidth(window.innerWidth);
});

document.addEventListener('keydown', (event) =>
{
  if ((event.ctrlKey === false) && (event.altKey === false))
  {
    switch (event.key)
    {
      case 's':
      case 'S':
        if ((navSearch.isVisible() === false) && (moduleElements.siteContentSearch !== document.activeElement))
        {
          event.preventDefault();
          navSearch.toggle();
        }
        break;

      case 'c':
      case 'C':
        if ((navSearch.isVisible() === false) && (moduleElements.siteContentSearch !== document.activeElement))
        {
          event.preventDefault();
          navMenu.toggle();
        }
        break;
    }
  }
});

window.addEventListener('load', () => resize.setTopMargin());
window.addEventListener('storage', windowEventStorage);


// ************************************************************************************************
//
// ************************************************************************************************

function readSettings()
{
  debug.log('readSettings()');
  settings = storage.readWriteJsonProxy(storage.KEY.UF_SITE_SETTINGS, defaultSettings);
  debug.log(settings);
}

function initIndex()
{
  debug.log('initIndex()');

  moduleElements.siteHeader        = document.getElementById('site-header');
  moduleElements.introBanner       = document.getElementById('intro-banner');
  moduleElements.siteContent       = document.getElementById('site-content');
  moduleElements.siteContentSearch = document.querySelector('#site-content form input.search-field');

  resize.addEventListener();
  scroll.addEventListener();

  navSearch.init();
  navMenu.init();
  siteTheme.init();
  trackLayout.init();
}


// ************************************************************************************************
// 
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
      if (settings.user.siteTheme !== oldSettings.user.siteTheme)
      {
        siteTheme.setCurrent();
      }
  
      if (settings.user.trackLayout !== oldSettings.user.trackLayout)
      {
        trackLayout.setCurrent();
        trackLayout.updateDOM();
      }
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
        moduleElements.introBanner.style.display = 'block';
  
        utils.addEventListeners('#intro-banner .intro-banner-close-button-container', 'click', () =>
        {
          moduleElements.introBanner.style.display = '';
          resize.setTopMargin();
          settings.priv.banners[bannerProperty] = false; // eslint-disable-line no-undef
        });
      }
    }
  }
}


// ************************************************************************************************
// Site theme handling
// ************************************************************************************************

const siteTheme = (() =>
{
  let currentTheme = {};
  let elements     = { toggle: null };

  const config = {
    toggleId:       '#footer-site-theme-toggle',
    prefDarkScheme: '(prefers-color-scheme: dark)',
  };
  
  const themes = {
    light: { id: 'light',                         text: 'light', class: 'site-theme-light' },
    dark:  { id: 'dark',                          text: 'dark',  class: 'site-theme-dark'  },
    auto:  { id: moduleConfig.siteThemeDefaultId, text: 'auto'                             }, // This has no CSS class since auto is always light or dark
  };

  return {
    init,
    setCurrent,
  };

  function init()
  {
    elements.toggle = document.querySelector(config.toggleId);
    const mediaQueryList = window.matchMedia(config.prefDarkScheme);
    mediaQueryList.addListener(matchMediaPrefColorScheme);
    utils.addEventListeners(config.toggleId, 'click', toggle);
    setCurrent();
  }
  
  function setCurrent()
  {
    currentTheme = utils.getObjectFromKeyValue(themes, 'id', settings.user.siteTheme, themes.auto);
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
  
    switch (currentTheme.id)
    {
      case themes.light.id:
        currentTheme = themes.dark;
        break;
  
      case themes.dark.id:
        currentTheme = themes.auto;
        break;
  
      case themes.auto.id:
        currentTheme = themes.light;
        break;
      }
  
    settings.user.siteTheme = currentTheme.id;
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
    debug.log(`updateDOM() - newSiteTheme: ${newTheme.id}`);
  
    document.documentElement.classList.remove(themes.light.class, themes.dark.class);
    document.documentElement.classList.add(newTheme.class);
    elements.toggle.querySelector('span').textContent = currentTheme.text;
  }
})();


// ************************************************************************************************
// Track layout handling
// ************************************************************************************************

const trackLayout = (() =>
{
  let currentLayout = {};
  let elements      = { toggle: null };

  const config = {
    toggleId: '#footer-track-layout-toggle',
    minWidth: `(max-width: ${utils.getCssPropString('--site-content-track-layout-min-width')})`,
  };

  const layouts = {
    list:        { id: 'list',                            text: 'list',         class: 'track-layout-list'     },
    twoColumn:   { id: '2-column',                        text: '2 column',     class: 'track-layout-2-column' },
    threeColumn: { id: moduleConfig.trackLayoutDefaultId, text: '3 / 4 column', class: 'track-layout-3-column' },
  };

  return {
    init,
    setCurrent,
    updateDOM,
  };

  function init()
  {
    elements.toggle = document.querySelector(config.toggleId);
    const mediaQueryList = window.matchMedia(config.minWidth);
    mediaQueryList.addListener(matchMediaMinWidth);
    utils.addEventListeners(config.toggleId, 'click', toggle);
    setCurrent();
  }

  function setCurrent()
  {
    currentLayout = utils.getObjectFromKeyValue(layouts, 'id', settings.user.trackLayout, layouts.threeColumn);
    elements.toggle.querySelector('span').textContent = currentLayout.text;
  }
  
  function matchMediaMinWidth(event)
  {
    if (event.matches)
      document.documentElement.classList.remove(currentLayout.class);
    else
      document.documentElement.classList.add(currentLayout.class);
  }
  
  function toggle(event)
  {
    event.preventDefault();
  
    switch (currentLayout.id)
    {
      case layouts.list.id:
        currentLayout = layouts.twoColumn;
        break;
  
      case layouts.twoColumn.id:
        currentLayout = layouts.threeColumn;
        break;
  
      case layouts.threeColumn.id:
        currentLayout = layouts.list;
        break;
    }
  
    settings.user.trackLayout = currentLayout.id;
    updateData();
    elements.toggle.scrollIntoView();
  }
  
  function updateData()
  {
    storage.setValue(storage.KEY.UF_TRACK_LAYOUT, currentLayout.id);
    updateDOM();
  }
  
  function updateDOM()
  {
    debug.log(`updateDOM() - newTrackLayout: ${currentLayout.id}`);
  
    document.documentElement.classList.remove(layouts.list.class, layouts.twoColumn.class, layouts.threeColumn.class);
  
    if (window.matchMedia(config.minWidth).matches === false)
      document.documentElement.classList.add(currentLayout.class);
  
    elements.toggle.querySelector('span').textContent = currentLayout.text;
  }
})();


// ************************************************************************************************
// Main navigation menu handling
// ************************************************************************************************

const navMenu = (() =>
{
  const observer = new IntersectionObserver(observerCallback);
  let elements   = { mainMenu: null, subMenu: null, footer: null };
  let isRevealed = false;

  return {
    isRevealed() { return isRevealed; },
    init,
    toggle,
    reveal,
  };

  function init()
  {
    elements.mainMenu = document.querySelector('#site-navigation .main-navigation-menu-outer');
    elements.subMenu  = document.querySelector('#site-navigation .sub-navigation-menu-outer');
    elements.footer   = document.getElementById('site-footer');

    utils.addEventListeners('.nav-menu-toggle', 'click', toggle);
    // Close nav main menu if user clicked outside its rectangle
    document.addEventListener('click', documentEventClick);
    // Used to toggle CSS pointer-events on element resize
    observer.observe(elements.mainMenu);
  }

  function isMobileMenuVisible()
  {
    return ((elements.mainMenu.offsetHeight !== 0) && utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE));
  }
  
  function documentEventClick(event)
  {
    if (isMobileMenuVisible())
    {
      if (event.target.closest('#site-header') === null)
        toggle();
    }
  }
  
  function observerCallback()
  {
    let pointerEvents = isMobileMenuVisible() ? 'none' : '';
  
    if (moduleElements.introBanner !== null)
      moduleElements.introBanner.style.pointerEvents = pointerEvents;

    moduleElements.siteContent.style.pointerEvents = pointerEvents;
    elements.footer.style.pointerEvents            = pointerEvents;
  }

  function toggle()
  {
    if (moduleElements.siteHeader.classList.contains('sticky-nav-up'))
    {
      if (isRevealed)
        reveal('none', 'flex', false);
      else
        reveal('flex', 'none', true);
    }
    else
    {
      if (moduleElements.siteHeader.classList.contains('sticky-nav-down') === false)
      {
        moduleElements.siteHeader.classList.toggle('hide-main-nav-menu');
        resize.setTopMargin();
      }
    }
  }

  function reveal(mainDisplay, subDisplay, reveal)
  {
    elements.mainMenu.style.display = mainDisplay;
    elements.subMenu.style.display  = subDisplay;
    isRevealed                      = reveal;
  }
})();


// ************************************************************************************************
// Main navigation search handling
// ************************************************************************************************

const navSearch = (() =>
{
  const allowKeyboardShortcuts = new Event('allowKeyboardShortcuts');
  const denyKeyboardShortcuts  = new Event('denyKeyboardShortcuts');
  let elements  = { searchContainer: null, searchField: null };
  let isVisible = false;

  return {
    isVisible() { return isVisible; },
    init,
    toggle,
    hide,
  };

  function init()
  {
    elements.searchContainer = document.getElementById('search-container');
    elements.searchField     = document.querySelector('#search-container .search-field');

    utils.addEventListeners('.nav-search-toggle', 'click', toggle);
    // To prevent extra 'blur' event before 'click' event
    utils.addEventListeners('.nav-search-toggle', 'mousedown', (event) => event.preventDefault());
    // Hide nav search bar on focus loss
    elements.searchField.addEventListener('blur', hide);
    // Hide nav search bar on ESC
    elements.searchField.addEventListener('keydown', (event) => { if (event.key === 'Escape') hide(); });
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
          behavior: (moduleConfig.smoothScrolling ? 'smooth' : 'auto'),
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
    let position = 0;
  
    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
      position = document.querySelector('div.site-branding').getBoundingClientRect();
    else
      position = document.querySelector('div.site-branding-flex-container').getBoundingClientRect();
  
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
  
      // "Fix" for strange Chrome mobile resize events that are not supposed to happen...
      if (lastInnerWidth !== innerWidth)
      {
        setTopMargin();
        lastInnerWidth = innerWidth;
      }
    });
  }
  
  function setTopMargin()
  {
    const contentTopMarginPx       = utils.getCssPropValue('--site-content-top-margin');
    const contentTopMarginMobilePx = utils.getCssPropValue('--site-content-top-margin-mobile');
  
    let topMargin = contentTopMarginPx;
    
    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
    {
      topMargin = contentTopMarginMobilePx;
  
      if (document.querySelector('#site-header.hide-main-nav-menu') === null)
        headerHeight = moduleElements.siteHeader.offsetHeight;
    }
    else
    {
      headerHeight = moduleElements.siteHeader.offsetHeight;
    }
  
    if ((moduleElements.introBanner !== null) && (moduleElements.introBanner.style.display.length !== 0))
    {
      moduleElements.introBanner.style.marginTop = `${headerHeight}px`;
      moduleElements.siteContent.style.marginTop = `${topMargin}px`;
    }
    else
    {
      moduleElements.siteContent.style.marginTop = `${headerHeight + topMargin}px`;
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
    
      if (scrollTop === 0)
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
    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
      moduleElements.siteHeader.classList.remove('sticky-nav-down', 'sticky-nav-up', 'hide-main-nav-menu');
    else
      moduleElements.siteHeader.classList.remove('sticky-nav-down', 'sticky-nav-up');

    navMenu.reveal('', '', false);
    resize.setTopMargin();
  }

  function scrolledDown()
  {
    if (isScrolledDown === false)
    {
      isScrolledDown = true;
      moduleElements.siteHeader.classList.remove('sticky-nav-up');
      moduleElements.siteHeader.classList.add('sticky-nav-down');
    }
  }

  function scrolledUp()
  {
    if (isScrolledDown === true)
    {
      isScrolledDown = false;
      moduleElements.siteHeader.classList.remove('sticky-nav-down');
      moduleElements.siteHeader.classList.add('sticky-nav-up');
    }

    if (navMenu.isRevealed() === true)
      navMenu.reveal('none', 'flex', false);
  }
})();
