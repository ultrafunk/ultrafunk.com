//
// Ultrafunk theme JavaScript
//
// https://ultrafunk.com
//


import * as debugLogger from './common/debuglogger.js?ver=1.6.0';
import * as storage     from './common/storage.js?ver=1.6.0';
import * as utils       from './common/utils.js?ver=1.6.0';


const debug                  = debugLogger.getInstance('index');
const allowKeyboardShortcuts = new Event('allowKeyboardShortcuts');
const denyKeyboardShortcuts  = new Event('denyKeyboardShortcuts');
const navMainMenuObserver    = new IntersectionObserver(navMainMenuObserverCallback);
let settings                 = {};
let currentSiteTheme         = {};
let currentTrackLayout       = {};
let lastScrollTop            = 0;
let scrolledUpMenuReveal     = false;
let isWindowScrolled         = false;
let headerHeight             = 0;
let lastWindowInnerWidth     = 0;
let isNavSearchVisible       = false;

const config = {
  smoothScrolling:     false,
  siteThemeToggleId:   '#footer-site-theme-toggle',
  prefColorSchemeDark: '(prefers-color-scheme: dark)',
  trackLayoutToggleId: '#footer-track-layout-toggle',
  trackLayoutMinWidth: `(max-width: ${utils.getCssPropString('--content-track-layout-min-width')})`,
};

const siteThemes = {
  light: { id: 'light', text: 'light', class: 'site-theme-light' },
  dark:  { id: 'dark',  text: 'dark',  class: 'site-theme-dark'  },
  auto:  { id: 'auto',  text: 'auto'                             }, // This has no CSS class since auto is always light or dark
};

const trackLayouts = {
  list:        { id: 'list',     text: 'list',     class: 'track-layout-list'     },
  twoColumn:   { id: '2-column', text: '2 column', class: 'track-layout-2-column' },
  threeColumn: { id: '3-column', text: '3 column', class: 'track-layout-3-column' },
};

const defaultSettings = {
  // Incremental version to check for new properties
  version: 2,
  // User (public) settings
  user: {
    siteTheme:   siteThemes.auto.id,
    trackLayout: trackLayouts.threeColumn.id,
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
  searchContainer:   null,
  navMainMenu:       null,
  navSubMenu:        null,
  introBanner:       null,
  content:           null,
  mainForm:          null,
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
    elements.mainForm.focus();
    elements.mainForm.setSelectionRange(9999, 9999);
  }

  setTopMargin();

  lastWindowInnerWidth = window.innerWidth;
});

document.addEventListener('keydown', (event) =>
{
  if ((event.ctrlKey === false) && (event.altKey === false))
  {
    switch (event.key)
    {
      case 's':
      case 'S':
        if ((isNavSearchVisible === false) && (elements.mainForm !== document.activeElement))
        {
          event.preventDefault();
          navSearchToggle();
        }
        break;

      case 'm':
      case 'M':
        if ((isNavSearchVisible === false) && (elements.mainForm !== document.activeElement))
        {
          event.preventDefault();
          navMenuToggle();
        }
        break;
    }
  }
});

window.addEventListener('load', () => setTopMargin());
window.addEventListener('resize',  windowEventResize);
window.addEventListener('scroll',  windowEventScroll);
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
  elements.searchContainer   = document.getElementById('search-container');
  elements.navMainMenu       = document.querySelector('#site-navigation .main-navigation-menu-outer');
  elements.navSubMenu        = document.querySelector('#site-navigation .sub-navigation-menu-outer');
  elements.introBanner       = document.getElementById('intro-banner');
  elements.content           = document.getElementById('content');
  elements.mainForm          = document.querySelector('#content form input.search-field');
  elements.colophon          = document.getElementById('colophon');
  elements.siteThemeToggle   = document.querySelector(config.siteThemeToggleId);
  elements.trackLayoutToggle = document.querySelector(config.trackLayoutToggleId);
  
  // Nav menu-toggle click handler
  utils.addEventListeners('.nav-menu-toggle', 'click', navMenuToggle);
  // Close main nav menu if user clicked outside its rectangle
  document.addEventListener('click', documentEventClick);
  // Used to toggle CSS pointer-events on element resize
  navMainMenuObserver.observe(elements.navMainMenu);
  
  // Nav search-toggle click handler
  utils.addEventListeners('.nav-search-toggle', 'click', navSearchToggle);
  // To prevent extra 'blur' event before 'click' event
  utils.addEventListeners('.nav-search-toggle', 'mousedown', (event) => event.preventDefault());
  // Hide nav search bar on focus loss
  utils.addEventListeners('#search-container .search-field', 'blur', hideNavSearch);
  // Hide nav search bar on ESC
  utils.addEventListeners('#search-container .search-field', 'keydown', (event) => { if (event.key === 'Escape') hideNavSearch(); });
  
  // Site theme handling
  const siteThemeMediaQueryList = window.matchMedia(config.prefColorSchemeDark);
  siteThemeMediaQueryList.addListener(matchMediaPrefColorScheme);
  setCurrentSiteTheme();
  utils.addEventListeners(config.siteThemeToggleId, 'click', siteThemeToggle);

  // Track layout handling
  const trackLayoutMediaQueryList = window.matchMedia(config.trackLayoutMinWidth);
  trackLayoutMediaQueryList.addListener(matchMediaTrackLayoutMinWidth);
  setCurrentTrackLayout();
  utils.addEventListeners(config.trackLayoutToggleId, 'click', trackLayoutToggle);
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
      setCurrentSiteTheme();
    }

    if (settings.user.trackLayout !== oldSettings.user.trackLayout)
    {
      setCurrentTrackLayout();
      updateTrackLayoutDOM();
    }
  }
}


// ************************************************************************************************
// Site theme handling
// ************************************************************************************************

function setCurrentSiteTheme()
{
  currentSiteTheme = utils.getObjectFromKeyValue(siteThemes, 'id', settings.user.siteTheme, siteThemes.auto);
  updateSiteThemeData();
}

function matchMediaPrefColorScheme()
{
  if (currentSiteTheme.id === siteThemes.auto.id)
    updateSiteThemeData();
}

function siteThemeToggle(event)
{
  event.preventDefault();

  switch (currentSiteTheme.id)
  {
    case siteThemes.light.id:
      currentSiteTheme = siteThemes.dark;
      break;

    case siteThemes.dark.id:
      currentSiteTheme = siteThemes.auto;
      break;

    case siteThemes.auto.id:
      currentSiteTheme = siteThemes.light;
      break;
    }

  settings.user.siteTheme = currentSiteTheme.id;
  updateSiteThemeData();  
}

function updateSiteThemeData()
{
  let newSiteTheme = currentSiteTheme;

  if (currentSiteTheme.id === siteThemes.auto.id)
    newSiteTheme = window.matchMedia(config.prefColorSchemeDark).matches ? siteThemes.dark : siteThemes.light;

  storage.setValue(storage.KEY.UF_SITE_THEME, newSiteTheme.id);
  updateSiteThemeDOM(newSiteTheme);
}

function updateSiteThemeDOM(newSiteTheme)
{
  debug.log(`updateSiteThemeDOM() - newSiteTheme: ${newSiteTheme.id}`);

  document.documentElement.classList.remove(siteThemes.light.class, siteThemes.dark.class);
  document.documentElement.classList.add(newSiteTheme.class);
  elements.siteThemeToggle.querySelector('span').textContent = currentSiteTheme.text;
}


// ************************************************************************************************
// Track layout handling
// ************************************************************************************************

function setCurrentTrackLayout()
{
  currentTrackLayout = utils.getObjectFromKeyValue(trackLayouts, 'id', settings.user.trackLayout, trackLayouts.threeColumn);
  elements.trackLayoutToggle.querySelector('span').textContent = currentTrackLayout.text;
}

function matchMediaTrackLayoutMinWidth(event)
{
  if (event.matches)
    document.documentElement.classList.remove(currentTrackLayout.class);
  else
    document.documentElement.classList.add(currentTrackLayout.class);
}

function trackLayoutToggle(event)
{
  event.preventDefault();

  switch (currentTrackLayout.id)
  {
    case trackLayouts.list.id:
      currentTrackLayout = trackLayouts.twoColumn;
      break;

    case trackLayouts.twoColumn.id:
      currentTrackLayout = trackLayouts.threeColumn;
      break;

    case trackLayouts.threeColumn.id:
      currentTrackLayout = trackLayouts.list;
      break;
  }

  settings.user.trackLayout = currentTrackLayout.id;
  updateTrackLayoutData();
}

function updateTrackLayoutData()
{
  storage.setValue(storage.KEY.UF_TRACK_LAYOUT, currentTrackLayout.id);
  updateTrackLayoutDOM();
}

function updateTrackLayoutDOM()
{
  debug.log(`updateTrackLayoutDOM() - newTrackLayout: ${currentTrackLayout.id}`);

  document.documentElement.classList.remove(trackLayouts.list.class, trackLayouts.twoColumn.class, trackLayouts.threeColumn.class);

  if (window.matchMedia(config.trackLayoutMinWidth).matches === false)
    document.documentElement.classList.add(currentTrackLayout.class);

  elements.trackLayoutToggle.querySelector('span').textContent = currentTrackLayout.text;
}


// ************************************************************************************************
// Navigation menu and search handling
// ************************************************************************************************

function isMobileNavMainMenuVisible()
{
  return ((elements.navMainMenu.offsetHeight !== 0) && utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE));
}

function documentEventClick(event)
{
  if (isMobileNavMainMenuVisible())
  {
    if (event.target.closest('div.site-header-container') === null)
      navMenuToggle();
  }
}

function navMainMenuObserverCallback()
{
  let pointerEvents = isMobileNavMainMenuVisible() ? 'none' : '';

  elements.content.style.pointerEvents  = pointerEvents;
  elements.colophon.style.pointerEvents = pointerEvents;
}

function navMenuToggle()
{
  if (elements.page.classList.contains('sticky-nav-up'))
  {
    if (scrolledUpMenuReveal === true)
      setScrolledUpMenuReveal('none', 'flex', false);
    else
      setScrolledUpMenuReveal('flex', 'none', true);
  }
  else
  {
    if (elements.page.classList.contains('sticky-nav-down') === false)
    {
      elements.page.classList.toggle('hide-main-nav-menu');
      setTopMargin();
    }
  }
}

function navSearchToggle()
{
  if (elements.searchContainer.style.display.length === 0)
  {
    if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE) && (lastScrollTop > 0))
    {
      // ToDo: This will not be smooth on iOS... Needs polyfill
      window.scroll(
      {
        top:      0,
        left:     0,
        behavior: (config.smoothScrolling ? 'smooth' : 'auto'),
      });
    }

    showNavSearch();
  }
  else
  {
    hideNavSearch();
  }
}

function hideNavSearch()
{
  if (isNavSearchVisible)
    setNavSearchProps(false, allowKeyboardShortcuts, '', 'search');
}

function showNavSearch()
{
  if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE) && (lastScrollTop !== 0))
  {
    // Wait until we are at the top before showing search bar, quick & dirty...
    window.requestAnimationFrame(showNavSearch);
  }
  else
  {
    setNavSearchPosSize();
    setNavSearchProps(true, denyKeyboardShortcuts, 'flex', 'clear');
    document.querySelector('#search-container .search-field').focus();
    document.querySelector('#search-container .search-field').setSelectionRange(9999, 9999);    
  }
}

function setNavSearchProps(visible, keyboardShortcuts, display, icon)
{
  isNavSearchVisible = visible;
  document.dispatchEvent(keyboardShortcuts);
  elements.searchContainer.style.display = display;
  document.querySelectorAll('.nav-search-toggle i').forEach(element => element.textContent = icon);
}

function setNavSearchPosSize()
{
  let position = 0;

  if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
    position = document.querySelector('.site-branding').getBoundingClientRect();
  else
    position = document.querySelector('.site-branding-flex-container').getBoundingClientRect();

  elements.searchContainer.style.top    = `${position.top}px`;
  elements.searchContainer.style.left   = `${position.left}px`;
  elements.searchContainer.style.width  = `${position.right - position.left}px`;
  elements.searchContainer.style.height = `${position.height}px`;
}


// ************************************************************************************************
//
// ************************************************************************************************

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
          setTopMargin();
          settings.priv.banners[bannerProperty] = false; // eslint-disable-line no-undef
        });
      }
    }
  }
}


// ************************************************************************************************
//
// ************************************************************************************************

function windowEventResize()
{
  const innerWidth = window.innerWidth;

  // "Fix" for strange Chrome mobile resize events that are not supposed to happen...
  if (lastWindowInnerWidth !== innerWidth)
  {
    setTopMargin();
    lastWindowInnerWidth = innerWidth;
  }
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


// ************************************************************************************************
//
// ************************************************************************************************

function windowEventScroll()
{
  const scrollTop          = window.pageYOffset;
  const scrollDownMenuHide = Math.round((headerHeight > 150) ? (headerHeight / 2) : (headerHeight / 3));

  if (scrollTop === 0)
    scrolledTop();
  else if ((scrollTop > scrollDownMenuHide) && (scrollTop > lastScrollTop))
    scrolledDown();
  else
    scrolledUp();
  
  // Hide navigation search bar on any scroll event
  hideNavSearch();

  lastScrollTop = scrollTop;
}

function setScrolledUpMenuReveal(navMainDisplay, navSubDisplay, revealMenu)
{
  elements.navMainMenu.style.display = navMainDisplay;
  elements.navSubMenu.style.display  = navSubDisplay;
  scrolledUpMenuReveal               = revealMenu;
}
      
function scrolledTop()
{
  if (utils.matchesMedia(utils.MATCH.SITE_MAX_WIDTH_MOBILE))
    elements.page.classList.remove('sticky-nav-down', 'sticky-nav-up', 'hide-main-nav-menu');
  else
    elements.page.classList.remove('sticky-nav-down', 'sticky-nav-up');

  setScrolledUpMenuReveal('', '', false);
  setTopMargin();
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

  if (scrolledUpMenuReveal === true)
    setScrolledUpMenuReveal('none', 'flex', false);
}

