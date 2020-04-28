//
// Ultrafunk theme JavaScript
// https://ultrafunk.com
//
// @package Ultrafunk
//


import * as debugLogger from './common/debuglogger.js?ver=103';
import * as storage     from './common/storage.js?ver=103';
import * as utils       from './common/utils.js?ver=103';


const debug                  = debugLogger.getInstance('index');
const allowKeyboardShortcuts = new Event('allowKeyboardShortcuts');
const denyKeyboardShortcuts  = new Event('denyKeyboardShortcuts');
const navMainMenuObserver    = new IntersectionObserver(navMainMenuObserverCallback);
let settings                 = {};
let lastScrollTop            = 0;
let scrolledUpMenuReveal     = false;
let isWindowScrolled         = false;
let headerHeight             = 0;
let lastWindowWidth          = 0;
let isNavSearchVisible       = false;

const config = {
  smoothScrolling:     false,
  themeToggleId:       '#footer-theme-toggle',
  prefColorSchemeDark: '(prefers-color-scheme: dark)',
};

const THEME = {
  LIGHT: 'light',
  DARK:  'dark',
  AUTO:  'auto',
};

const defaultSettings = {
  // Incremental version to check for new properties
  version: 1,
  // User (public) settings
  user: {
    siteTheme: THEME.AUTO,
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
  page:             null,
  searchContainer:  null,
  navMainMenu:      null,
  navSubMenu:       null,
  introBanner:      null,
  content:          null,
  mainForm:         null,
  colophon:         null,
  themeToggleState: null,
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
  
  if (document.querySelector('#main form.search-form') !== null)
  {
    elements.mainForm.focus();
    elements.mainForm.setSelectionRange(9999, 9999);
  }

  setTopMargin();

  lastWindowWidth = window.innerWidth;
});

document.addEventListener('keydown', (event) =>
{
  if ((event.shiftKey === false) && (event.ctrlKey === false) && (event.altKey === false))
  {
    switch (event.key)
    {
      case 's':
        if ((isNavSearchVisible === false) && (elements.mainForm !== document.activeElement))
        {
          event.preventDefault();
          navSearchToggle();
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

  elements.page             = document.getElementById('page');
  elements.searchContainer  = document.getElementById('search-container');
  elements.navMainMenu      = document.querySelector('#site-navigation .main-navigation-menu-outer');
  elements.navSubMenu       = document.querySelector('#site-navigation .sub-navigation-menu-outer');
  elements.introBanner      = document.getElementById('intro-banner');
  elements.content          = document.getElementById('content');
  elements.mainForm         = document.querySelector('#main form input.search-field');
  elements.colophon         = document.getElementById('colophon');
  elements.themeToggleState = document.querySelector(config.themeToggleId + ' .theme-light-dark-auto');
  
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
  
  // Theme handling
  const mediaQueryList = window.matchMedia(config.prefColorSchemeDark);
  mediaQueryList.addListener(matchMediaPrefColorScheme);
  updateThemeDOM();
  utils.addEventListeners(config.themeToggleId, 'click', themeToggle);
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
      updateThemeDOM();
  }
}

function matchMediaPrefColorScheme()
{
  if (settings.user.siteTheme === THEME.AUTO)
    updateThemeDOM();
}

function themeToggle(event)
{
  event.preventDefault();
  const themeToggleState = elements.themeToggleState.textContent;

  switch (themeToggleState)
  {
    case THEME.LIGHT:
      settings.user.siteTheme = THEME.DARK;
      break;

    case THEME.DARK:
      settings.user.siteTheme = THEME.AUTO;
      break;

    default:
      settings.user.siteTheme = THEME.LIGHT;
      break;
  }
  
  updateThemeDOM();  
}

function updateThemeDOM()
{
  debug.log(`updateThemeDOM(): ${settings.user.siteTheme}`);

  let siteTheme = window.matchMedia(config.prefColorSchemeDark).matches ? THEME.DARK : THEME.LIGHT;

  if ((settings.user.siteTheme === THEME.LIGHT) || (settings.user.siteTheme === THEME.DARK))
    siteTheme = settings.user.siteTheme;

  storage.setValue(storage.KEY.UF_SITE_THEME, siteTheme);
  document.querySelector('html').classList.remove('site-theme-dark', 'site-theme-light');
  document.querySelector('html').classList.add(`site-theme-${siteTheme}`);
  elements.themeToggleState.textContent = settings.user.siteTheme;
}


// ************************************************************************************************
//
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
    elements.page.classList.toggle('hide-main-nav-menu');
    setTopMargin();
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
  const width = window.innerWidth;

  // Fix for strange Chrome mobile resize events that are not supposed to happen...
  if (lastWindowWidth !== width)
  {
    setTopMargin();
    lastWindowWidth = width;
  }
}

const contentTopMarginPx       = utils.getCssPropValue('--content-top-margin');
const contentTopMarginMobilePx = utils.getCssPropValue('--content-top-margin-mobile');

function setTopMargin()
{
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
  const scrollTop = window.pageYOffset;

  if (scrollTop === 0)
    scrolledTop();
  else if ((scrollTop > (headerHeight / 2)) && (scrollTop > lastScrollTop))
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
  elements.page.classList.remove('sticky-nav-down', 'sticky-nav-up', 'hide-main-nav-menu');
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

