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
  m as mProps,
  shareModal,
};


/*************************************************************************************************/


const debug         = debugLogger.newInstance('site-interaction');
const htmlClassList = document.documentElement.classList;

// Only const top level variables in modules + m.prop namespace for clarity
const m = {
  settings:      {},
  siteTheme:     null,
  galleryLayout: null,
};


// ************************************************************************************************
//
// ************************************************************************************************

function init(siteSettings)
{
  debug.log('init()');

  m.settings      = siteSettings;
  m.siteTheme     = new SiteThemeToggle('footer-site-theme-toggle');
  m.galleryLayout = new GalleryLayoutToggle('footer-gallery-layout-toggle');

  utils.addListener('#menu-primary-menu a.reshuffle-menu-item',     'click', utils.shuffleClick);
  utils.addListenerAll('.entry-meta-controls .track-share-control', 'click', trackShareControlClick);
}

function settingsUpdated(updatedSettings)
{
  m.settings = updatedSettings;
  m.siteTheme.setCurrent();
  m.galleryLayout.setCurrent();
}

function trackShareControlClick(event)
{
  const artistTrackTitle = event.target.getAttribute('data-artist-track-title');
  const trackUrl         = event.target.getAttribute('data-track-url');
 
  shareModal.show({ string: artistTrackTitle, filterString: true, url: trackUrl });
}


// ************************************************************************************************
// Site theme and layout settings helpers
// ************************************************************************************************

function getCurrentSetting(settings, currentId, defaultSetting)
{
  const setting = Object.values(settings).find(value => (value.id === currentId));
  return ((setting !== undefined) ? setting : defaultSetting);
}

function getNextSetting(settings, currentSetting)
{
  const index = Object.values(settings).findIndex(value => (value.id === currentSetting.id));
  const keys  = Object.keys(settings);
  return (((index + 1) < keys.length) ? settings[keys[index + 1]] : settings[keys[0]]);
}


// ************************************************************************************************
// Site theme handling
// ************************************************************************************************

class SiteThemeToggle extends utils.ToggleElement
{
  constructor(elementId)
  {
    super(elementId, false);

    this.themes = {
      light: { id: 'light', text: 'light', class: 'site-theme-light' },
      dark:  { id: 'dark',  text: 'dark',  class: 'site-theme-dark'  },
      auto:  { id: 'auto',  text: 'auto'                             }, // This has no CSS class since auto is always light or dark
    };

    this.setCurrent();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => this.matchMediaPrefColorScheme(event));
  }

  setCurrent()
  {
    this.currentTheme = getCurrentSetting(this.themes, m.settings.user.theme, this.themes.auto);
    this.update();
  }

  matchMediaPrefColorScheme()
  {
    if (this.currentTheme.id === this.themes.auto.id)
      this.update();
  }

  toggle()
  {
    this.currentTheme = getNextSetting(this.themes, this.currentTheme);
    m.settings.user.theme = this.currentTheme.id;
    this.update();  
  }

  update()
  {
    let newTheme = this.currentTheme;
  
    if (this.currentTheme.id === this.themes.auto.id)
      newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? this.themes.dark : this.themes.light;
  
    setValue(KEY.UF_SITE_THEME, newTheme.id);
  
    // Only update DOM if something has actually changed...
    if (htmlClassList.contains(newTheme.class) === false)
    {
      debug.log(`SiteThemeToggle.update() - newSiteTheme: ${newTheme.id}`);
    
      htmlClassList.remove(this.themes.light.class, this.themes.dark.class);
      htmlClassList.add(newTheme.class);
    }

    // Always update this because AUTO is not a separate class (only DARK + LIGHT are classes)
    this.textContent = this.currentTheme.text;
  }
}


// ************************************************************************************************
// Gallery layout handling
// ************************************************************************************************

class GalleryLayoutToggle extends utils.ToggleElement
{
  constructor(elementId)
  {
    super(elementId, false);

    this.minWidth = `(max-width: ${utils.getCssPropString('--site-gallery-layout-min-width')})`;

    this.layouts = {
      oneColumn:   { id: '1-column', text: '1 column',     class: 'gallery-layout-1-column' },
      twoColumn:   { id: '2-column', text: '2 column',     class: 'gallery-layout-2-column' },
      threeColumn: { id: '3-column', text: '3 / 4 column', class: 'gallery-layout-3-column' },
    };

    this.setCurrent();

    window.matchMedia(this.minWidth).addEventListener('change', (event) => this.matchMediaMinWidth(event));
  }

  setCurrent()
  {
    this.currentLayout = getCurrentSetting(this.layouts, m.settings.user.galleryLayout, this.layouts.threeColumn);
    this.update();
  }

  matchMediaMinWidth(event)
  {
    if (htmlClassList.contains('user-layout'))
      event.matches ? htmlClassList.remove(this.currentLayout.class) : htmlClassList.add(this.currentLayout.class);
  }

  toggle(event)
  {
    this.currentLayout = getNextSetting(this.layouts, this.currentLayout);
    m.settings.user.galleryLayout = this.currentLayout.id;
    this.update();

    if (event.type === 'click')
      this.element.scrollIntoView();
  }

  update()
  {
    setValue(KEY.UF_GALLERY_LAYOUT, this.currentLayout.id);

    // Only update DOM if needed and when something has actually changed
    if ((htmlClassList.contains('user-layout')) && (htmlClassList.contains(this.currentLayout.class) === false))
    {
      debug.log(`GalleryLayoutToggle.update() - newGalleryLayout: ${this.currentLayout.id}`);

      htmlClassList.remove(this.layouts.oneColumn.class, this.layouts.twoColumn.class, this.layouts.threeColumn.class);

      if (window.matchMedia(this.minWidth).matches === false)
        htmlClassList.add(this.currentLayout.class);
    }

    this.textContent = this.currentLayout.text;
  }
}


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
      { id: 'copyToClipboardId', icon: 'content_copy', text: '<b>Copy Link</b> to Clipboard'   },
      { id: 'shareOnEmailId',    icon: 'share',        text: '<b>Share</b> on Email'           },
      { id: 'amazonMusicId',     icon: 'link',         text: `<b>${verb}</b> on Amazon Music`  },
      { id: 'appleMusicId',      icon: 'link',         text: `<b>${verb}</b> on Apple Music`   },
      { id: 'spotifyId',         icon: 'link',         text: `<b>${verb}</b> on Spotify`       },
      { id: 'tidalId',           icon: 'link',         text: `<b>${verb}</b> on Tidal`         },
      { id: 'youTubeMusicId',    icon: 'link',         text: `<b>${verb}</b> on YouTube Music` },
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
