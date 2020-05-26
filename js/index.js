//
// Ultrafunk theme JavaScript
//
// https://ultrafunk.com
//


import * as debugLogger from './common/debuglogger.js?ver=1.6.4';
import * as storage     from './common/storage.js?ver=1.6.4';
import * as utils       from './common/utils.js?ver=1.6.4';


const debug  = debugLogger.getInstance('index');
let settings = {};

const config = {
  smoothScrolling:         false,
  siteThemeToggleId:       '#footer-site-theme-toggle',
  siteThemePrefDarkScheme: '(prefers-color-scheme: dark)',
  siteThemeDefaultId:      'auto',
  trackLayoutToggleId:     '#footer-track-layout-toggle',
  trackLayoutMinWidth:     `(max-width: ${utils.getCssPropString('--content-track-layout-min-width')})`,
  trackLayoutDefaultId:    '3-column',
};

const defaultSettings = {
  // Incremental version to check for new properties
  version: 2,
  // User (public) settings
  user: {
    siteTheme:   config.siteThemeDefaultId,
    trackLayout: config.trackLayoutDefaultId,
  },
  // Priv (private / internal) settings
  priv: {
    banners: {
      showFrontpageIntro: true,
      showPremiumIntro:   true,
    },
  },
};

// Cached elements from document.querySelector(selectors)
const elements = {
  page:              null,
  navSearch:         null,
  navMainMenu:       null,
  navSubMenu:        null,
  introBanner:       null,
  content:           null,
  contentSearch:     null,
  colophon:          null,
  siteThemeToggle:   null,
  trackLayoutToggle: null,
};


// ************************************************************************************************
//
// ************************************************************************************************

document.addEventListener('DOMContentLoaded', () =>
{ 
  debug.log('DOMContentLoaded');

  readSettings();
  initIndex();
  
  if (elements.introBanner !== null)
    showIntroBanner();
  
  if (document.querySelector('#content form.search-form') !== null)
  {
    elements.contentSearch.focus();
    elements.contentSearch.setSelectionRange(9999, 9999);
  }

  resize.setTopMargin();
  resize.lastInnerWidth = window.innerWidth;
});

document.addEventListener('keydown', (event) =>
{
  if ((event.ctrlKey === false) && (event.altKey === false))
  {
    switch (event.key)
    {
      case 's':
      case 'S':
        if ((navSearch.isVisible === false) && (elements.contentSearch !== document.activeElement))
        {
          event.preventDefault();
          navSearch.toggle();
        }
        break;

      case 'm':
      case 'M':
        if ((navSearch.isVisible === false) && (elements.contentSearch !== document.activeElement))
        {
          event.preventDefault();
          navMainMenu.toggle();
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

  elements.page              = document.getElementById('page');
  elements.navSearch         = document.getElementById('search-container');
  elements.navMainMenu       = document.querySelector('#site-navigation .main-navigation-menu-outer');
  elements.navSubMenu        = document.querySelector('#site-navigation .sub-navigation-menu-outer');
  elements.introBanner       = document.getElementById('intro-banner');
  elements.content           = document.getElementById('content');
  elements.contentSearch     = document.querySelector('#content form input.search-field');
  elements.colophon          = document.getElementById('colophon');
  elements.siteThemeToggle   = document.querySelector(config.siteThemeToggleId);
  elements.trackLayoutToggle = document.querySelector(config.trackLayoutToggleId);

  resize.addEventListener();
  scroll.addEventListener();

  navSearch.init();
  navMainMenu.init();
  siteTheme.init();
  trackLayout.init();
}


// ************************************************************************************************
// 
// ************************************************************************************************

function windowEventStorage(event)
{
  const oldSettings = storage.parseEventData(event, storage.KEY.UF_SITE_SETTINGS);

  if (oldSettings !== null)
  {
    debug.log(`windowEventStorage(): ${event.key}`);

    // Stored settings have changed, read updated settings from storage
    readSettings();

    // Check what has changed (old settings vs. new settings) and update data / UI where needed
    if(settings.user.siteTheme !== oldSettings.user.siteTheme)
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

function showIntroBanner()
{
  // Only show intro banners if they can be permanently dismissed
  if (storage.isAvailable('localStorage'))
  {
    if ((typeof bannerProperty !== 'undefined') && (bannerProperty !== null)) // eslint-disable-line no-undef
    {
      if (settings.priv.banners[bannerProperty]) // eslint-disable-line no-undef
      {
        elements.introBanner.style.display = 'block';
  
        utils.addEventListeners('#intro-banner .intro-banner-close-button-container', 'click', () =>
        {
          elements.introBanner.style.display = '';
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

  const themes = {
    light: { id: 'light',                   text: 'light', class: 'site-theme-light' },
    dark:  { id: 'dark',                    text: 'dark',  class: 'site-theme-dark'  },
    auto:  { id: config.siteThemeDefaultId, text: 'auto'                             }, // This has no CSS class since auto is always light or dark
  };

  return {
    init,
    setCurrent,
  };

  function init()
  {
    const mediaQueryList = window.matchMedia(config.siteThemePrefDarkScheme);
    mediaQueryList.addListener(matchMediaPrefColorScheme);
    utils.addEventListeners(config.siteThemeToggleId, 'click', toggle);
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
      newTheme = window.matchMedia(config.siteThemePrefDarkScheme).matches ? themes.dark : themes.light;
  
    storage.setValue(storage.KEY.UF_SITE_THEME, newTheme.id);
    updateDOM(newTheme);
  }
  
  function updateDOM(newTheme)
  {
    debug.log(`updateDOM() - newSiteTheme: ${newTheme.id}`);
  
    document.documentElement.classList.remove(themes.light.class, themes.dark.class);
    document.documentElement.classList.add(newTheme.class);
    elements.siteThemeToggle.querySelector('span').textContent = currentTheme.text;
  }
})();


// ************************************************************************************************
// Track layout handling
// ************************************************************************************************

const trackLayout = (() =>
{
  let currentLayout = {};

  const layouts = {
    list:        { id: 'list',                      text: 'list',     class: 'track-layout-list'     },
    twoColumn:   { id: '2-column',                  text: '2 column', class: 'track-layout-2-column' },
    threeColumn: { id: config.trackLayoutDefaultId, text: '3 column', class: 'track-layout-3-column' },
  };

  return {
    init,
    setCurrent,
    updateDOM,
  };

  function init()
  {
    const mediaQueryList = window.matchMedia(config.trackLayoutMinWidth);
    mediaQueryList.addListener(matchMediaMinWidth);
    utils.addEventListeners(config.trackLayoutToggleId, 'click', toggle);
    setCurrent();
  }

  function setCurrent()
  {
    currentLayout = utils.getObjectFromKeyValue(layouts, 'id', settings.user.trackLayout, layouts.threeColumn);
    elements.trackLayoutToggle.querySelector('span').textContent = currentLayout.text;
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
  
    if (window.matchMedia(config.trackLayoutMinWidth).matches === false)
      document.documentElement.classList.add(currentLayout.class);
  
    elements.trackLayoutToggle.querySelector('span').textContent = currentLayout.text;
  }
})();


// ************************************************************************************************
// Main navigation menu handling
// ************************************************************************************************

const navMainMenu = (() =>
{
  const intersectionObserver = new IntersectionObserver(observerCallback);

  return {
    init,
    toggle,
  };

  function init()
  {
    utils.addEventListeners('.nav-menu-toggle', 'click', toggle);
    // Close nav main menu if user clicked outside its rectangle
    document.addEventListener('click', documentEventClick);
    // Used to toggle CSS pointer-events on element resize
    intersectionObserver.observe(elements.navMainMenu);
  }

  function isMobileMenuVisible()
  {
    return ((elements.navMainMenu.offsetHeight !== 0) && utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE));
  }
  
  function documentEventClick(event)
  {
    if (isMobileMenuVisible())
    {
      if (event.target.closest('div.site-header-container') === null)
        toggle();
    }
  }
  
  function observerCallback()
  {
    let pointerEvents = isMobileMenuVisible() ? 'none' : '';
  
    if (elements.introBanner !== null)
      elements.introBanner.style.pointerEvents  = pointerEvents;

    elements.content.style.pointerEvents  = pointerEvents;
    elements.colophon.style.pointerEvents = pointerEvents;
  }
  
  function toggle()
  {
    if (elements.page.classList.contains('sticky-nav-up'))
    {
      if (scroll.isMenuRevealed)
        scroll.setMenuReveal('none', 'flex', false);
      else
        scroll.setMenuReveal('flex', 'none', true);
    }
    else
    {
      if (elements.page.classList.contains('sticky-nav-down') === false)
      {
        elements.page.classList.toggle('hide-main-nav-menu');
        resize.setTopMargin();
      }
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
  let isVisible = false;

  return {
    get isVisible() { return isVisible; },
    init,
    toggle,
    hide,
  };

  function init()
  {
    utils.addEventListeners('.nav-search-toggle', 'click', toggle);
    // To prevent extra 'blur' event before 'click' event
    utils.addEventListeners('.nav-search-toggle', 'mousedown', (event) => event.preventDefault());
    // Hide nav search bar on focus loss
    utils.addEventListeners('#search-container .search-field', 'blur', hide);
    // Hide nav search bar on ESC
    utils.addEventListeners('#search-container .search-field', 'keydown', (event) => { if (event.key === 'Escape') hide(); });
  }

  function toggle()
  {
    if (elements.navSearch.style.display.length === 0)
    {
      if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE) && (scroll.lastScrollTop > 0))
      {
        // ToDo: This will not be smooth on iOS... Needs polyfill
        window.scroll(
        {
          top:      0,
          left:     0,
          behavior: (config.smoothScrolling ? 'smooth' : 'auto'),
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
    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE) && (scroll.lastScrollTop !== 0))
    {
      // Wait until we are at the top before showing search bar, quick & dirty...
      window.requestAnimationFrame(show);
    }
    else
    {
      setPosSize();
      setProps(true, denyKeyboardShortcuts, 'flex', 'clear');
      document.querySelector('#search-container .search-field').focus();
      document.querySelector('#search-container .search-field').setSelectionRange(9999, 9999);    
    }
  }
  
  function setProps(visible, keyboardShortcuts, display, icon)
  {
    isVisible = visible;
    document.dispatchEvent(keyboardShortcuts);
    elements.navSearch.style.display = display;
    document.querySelectorAll('.nav-search-toggle i').forEach(element => element.textContent = icon);
  }
  
  function setPosSize()
  {
    let position = 0;
  
    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
      position = document.querySelector('.site-branding').getBoundingClientRect();
    else
      position = document.querySelector('.site-branding-flex-container').getBoundingClientRect();
  
    elements.navSearch.style.top    = `${position.top}px`;
    elements.navSearch.style.left   = `${position.left}px`;
    elements.navSearch.style.width  = `${position.right - position.left}px`;
    elements.navSearch.style.height = `${position.height}px`;
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
    get headerHeight()             { return headerHeight;         },
    set lastInnerWidth(innerWidth) { lastInnerWidth = innerWidth; },
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
    const contentTopMarginPx       = utils.getCssPropValue('--content-top-margin');
    const contentTopMarginMobilePx = utils.getCssPropValue('--content-top-margin-mobile');
  
    let topMargin = contentTopMarginPx;
    
    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
    {
      topMargin = contentTopMarginMobilePx;
  
      if (document.querySelector('#page.hide-main-nav-menu') === null)
        headerHeight = document.getElementById('masthead').offsetHeight;
    }
    else
    {
      headerHeight = document.getElementById('masthead').offsetHeight;
    }
  
    if ((elements.introBanner !== null) && (elements.introBanner.style.display.length !== 0))
    {
      elements.introBanner.style.marginTop = `${headerHeight}px`;
      elements.content.style.marginTop     = `${topMargin}px`;
    }
    else
    {
      elements.content.style.marginTop = `${headerHeight + topMargin}px`;
    }
  }
})();


// ************************************************************************************************
// window.addEventListener('scroll') handling
// ************************************************************************************************

const scroll = (() =>
{
  let lastScrollTop    = 0;
  let isMenuRevealed   = false;
  let isWindowScrolled = false;

  return {
    get lastScrollTop()  { return lastScrollTop;  },
    get isMenuRevealed() { return isMenuRevealed; },
    addEventListener,
    setMenuReveal,
  };

  function addEventListener()
  {
    window.addEventListener('scroll', () =>
    {
      const scrollTop          = window.pageYOffset;
      const scrollDownMenuHide = Math.round((resize.headerHeight > 150) ? (resize.headerHeight / 2) : (resize.headerHeight / 3));
    
      if (scrollTop === 0)
        scrolledTop();
      else if ((scrollTop > scrollDownMenuHide) && (scrollTop > lastScrollTop))
        scrolledDown();
      else
        scrolledUp();
      
      // Hide navigation search bar on any scroll event
      navSearch.hide();
    
      lastScrollTop = scrollTop;
    });
  }

  function setMenuReveal(navMainDisplay, navSubDisplay, revealMenu)
  {
    elements.navMainMenu.style.display = navMainDisplay;
    elements.navSubMenu.style.display  = navSubDisplay;
    isMenuRevealed                     = revealMenu;
  }
        
  function scrolledTop()
  {
    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
      elements.page.classList.remove('sticky-nav-down', 'sticky-nav-up', 'hide-main-nav-menu');
    else
      elements.page.classList.remove('sticky-nav-down', 'sticky-nav-up');

    setMenuReveal('', '', false);
    resize.setTopMargin();
  }

  function scrolledDown()
  {
    if (isWindowScrolled === false)
    {
      isWindowScrolled = true;
      elements.page.classList.remove('sticky-nav-up');
      elements.page.classList.add('sticky-nav-down');
    }
  }

  function scrolledUp()
  {
    if (isWindowScrolled === true)
    {
      isWindowScrolled = false;
      elements.page.classList.remove('sticky-nav-down');
      elements.page.classList.add('sticky-nav-up');
    }

    if (isMenuRevealed === true)
      setMenuReveal('none', 'flex', false);
  }
})();
