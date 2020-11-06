//
// Schemas, objects and validation for playback and site settings
//
// https://ultrafunk.com
//


import * as debugLogger from '../shared/debuglogger.js';


export {
  playbackUserSchema,
  playbackPrivSchema,
  playbackSettings,
  siteUserSchema,
  siteBannersSchema,
  siteSettings,
  validateSettings,
};


/*************************************************************************************************/


const debug = debugLogger.getInstance('settings');

const TYPE = {
  INTEGER: 'integer',
  BOOLEAN: 'boolean',
  STRING:  'string',
};


// ************************************************************************************************
// Playback
// ************************************************************************************************

const playbackUserSchema = {
  keyboardShortcuts:      { description: 'Keyboard Shortcuts',                 type: TYPE.BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  masterVolume:           { description: 'Master Volume',                      type: TYPE.INTEGER, values: [0, 25, 50, 75, 100],    default: 100,   valueStrings: ['0%', '25%', '50%', '75%', '100%'] },
  masterMute:             { description: 'Master Mute',                        type: TYPE.BOOLEAN, values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
  autoPlay:               { description: 'Autoplay next track',                type: TYPE.BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  autoCrossfade:          { description: 'Auto Crossfade to next track',       type: TYPE.BOOLEAN, values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
  autoCrossfadeLength:    { description: 'Auto Crossfade Length',              type: TYPE.INTEGER, values: [5, 10, 15, 20, 25, 30], default: 20,    valueStrings: ['5 sec', '10 sec', '15 sec', '20 sec', '25 sec', '30 sec'] },
  autoCrossfadeCurve:     { description: 'Auto Crossfade Curve',               type: TYPE.INTEGER, values: [0, 1],                  default: 1,     valueStrings: ['EQUAL POWER', 'LINEAR'] },
  autoScroll:             { description: 'Autoscroll to next track',           type: TYPE.BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  smoothScrolling:        { description: 'Smooth Scrolling to next track',     type: TYPE.BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  autoExitFullscreen:     { description: 'Exit Fullscreen on next track',      type: TYPE.BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  animateNowPlayingIcon:  { description: 'Animate Playing Track Icon',         type: TYPE.BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  autoResumePlayback:     { description: 'Auto Resume Playback on focus',      type: TYPE.BOOLEAN, values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
  trackCrossfade:         { description: 'Track to Track Crossfade',           type: TYPE.BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  trackCrossfadeLength:   { description: 'Track to Track Crossfade Length',    type: TYPE.INTEGER, values: [5, 10, 15, 20, 25, 30], default: 10,    valueStrings: ['5 sec', '10 sec', '15 sec', '20 sec', '25 sec', '30 sec'] },
  trackCrossfadeCurve:    { description: 'Track to Track Crossfade Curve',     type: TYPE.INTEGER, values: [0, 1],                  default: 0,     valueStrings: ['EQUAL POWER', 'LINEAR'] },
  timeRemainingWarning:   { description: 'Time Remaining Warning',             type: TYPE.BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  timeRemainingSeconds:   { description: 'Time Remaining Warning Seconds',     type: TYPE.INTEGER, values: [15, 30, 45, 60],        default: 60,    valueStrings: ['15 sec', '30 sec', '45 sec', '60 sec'] },
  autoExitFsOnWarning:    { description: 'Exit Fullscreen on Time Warning',    type: TYPE.BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  keepMobileScreenOn:     { description: 'Keep Mobile Screen On when playing', type: TYPE.BOOLEAN, values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
  trackTimesOnMobile:     { description: 'Show Track Times on mobile',         type: TYPE.BOOLEAN, values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
  trackThumbnailOnMobile: { description: 'Show Track Thumbnail on mobile',     type: TYPE.BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
};

const playbackPrivSchema = {
  continueAutoPlay:   { description: '', type: TYPE.BOOLEAN, values: [true, false], default: false, valueStrings: [] },
  showLeftArrowHint:  { description: '', type: TYPE.BOOLEAN, values: [true, false], default: true,  valueStrings: [] },
  showRightArrowHint: { description: '', type: TYPE.BOOLEAN, values: [true, false], default: true,  valueStrings: [] },
  showDetailsHint:    { description: '', type: TYPE.BOOLEAN, values: [true, false], default: true,  valueStrings: [] },
  showTrackImageHint: { description: '', type: TYPE.BOOLEAN, values: [true, false], default: true,  valueStrings: [] },
};

const playbackSettings = {
  // Incremental version to check for new properties
  version:           22,
  storageChangeSync: false,
  // User (public) settings
  user: {
    keyboardShortcuts:      playbackUserSchema.keyboardShortcuts.default,
    masterVolume:           playbackUserSchema.masterVolume.default,
    masterMute:             playbackUserSchema.masterMute.default,
    autoPlay:               playbackUserSchema.autoPlay.default,
    autoCrossfade:          playbackUserSchema.autoCrossfade.default,
    autoCrossfadeLength:    playbackUserSchema.autoCrossfadeLength.default,
    autoCrossfadeCurve:     playbackUserSchema.autoCrossfadeCurve.default,
    autoScroll:             playbackUserSchema.autoScroll.default,
    smoothScrolling:        playbackUserSchema.smoothScrolling.default,
    autoExitFullscreen:     playbackUserSchema.autoExitFullscreen.default,
    animateNowPlayingIcon:  playbackUserSchema.animateNowPlayingIcon.default,
    autoResumePlayback:     playbackUserSchema.autoResumePlayback.default,
    trackCrossfade:         playbackUserSchema.trackCrossfade.default,
    trackCrossfadeLength:   playbackUserSchema.trackCrossfadeLength.default,     
    trackCrossfadeCurve:    playbackUserSchema.trackCrossfadeCurve.default,
    timeRemainingWarning:   playbackUserSchema.timeRemainingWarning.default,
    timeRemainingSeconds:   playbackUserSchema.timeRemainingSeconds.default,
    autoExitFsOnWarning:    playbackUserSchema.autoExitFsOnWarning.default,
    keepMobileScreenOn:     playbackUserSchema.keepMobileScreenOn.default,
    trackTimesOnMobile:     playbackUserSchema.trackTimesOnMobile.default,
    trackThumbnailOnMobile: playbackUserSchema.trackThumbnailOnMobile.default,
  //blurFocusBgChange:      false,
  },
  // Priv (private / internal) settings
  priv: {
    continueAutoPlay:   playbackPrivSchema.continueAutoPlay.default,
    showLeftArrowHint:  playbackPrivSchema.showLeftArrowHint.default,
    showRightArrowHint: playbackPrivSchema.showRightArrowHint.default,
    showDetailsHint:    playbackPrivSchema.showDetailsHint.default,
    showTrackImageHint: playbackPrivSchema.showTrackImageHint.default,
  },
};


// ************************************************************************************************
// Site
// ************************************************************************************************

const siteUserSchema = {
  theme:             { description: 'Theme',                                    type: TYPE.STRING,  values: ['light', 'dark', 'auto'],             default: 'auto',     valueStrings: ['LIGHT', 'DARK', 'AUTO / SYSTEM']         },
  trackLayout:       { description: 'Track Layout',                             type: TYPE.STRING,  values: ['list', '2-column', '3-column'],      default: '3-column', valueStrings: ['LIST', '2 COLUMN', '3 / 4 COLUMN']       },
  tracksPerPage:     { description: 'Tracks Per Page for Search &amp; Shuffle', type: TYPE.INTEGER, values: [...Array(22).keys()].map(i => i + 3), default: 12,         valueStrings: [...Array(22).keys()].map(i => `${i + 3}`) },
  keyboardShortcuts: { description: 'Keyboard Shortcuts',                       type: TYPE.BOOLEAN, values: [true, false],                         default: true,       valueStrings: ['ON', 'OFF']                              },
};

const siteBannersSchema = {
  showFrontpageIntro: { description: '', type: TYPE.BOOLEAN, values: [true, false], default: true, valueStrings: [] },
  showPremiumIntro:   { description: '', type: TYPE.BOOLEAN, values: [true, false], default: true, valueStrings: [] },
  showPromoIntro:     { description: '', type: TYPE.BOOLEAN, values: [true, false], default: true, valueStrings: [] },
};

const siteSettings = {
  // Incremental version to check for new properties
  version:           6,
  storageChangeSync: false,
  // User (public) settings
  user: {
    theme:             siteUserSchema.theme.default,
    trackLayout:       siteUserSchema.trackLayout.default,
    tracksPerPage:     siteUserSchema.tracksPerPage.default,
    keyboardShortcuts: siteUserSchema.keyboardShortcuts.default,
  },
  // Priv (private / internal) settings
  priv: {
    banners: {
      showFrontpageIntro: siteBannersSchema.showFrontpageIntro.default,
      showPremiumIntro:   siteBannersSchema.showPremiumIntro.default,
      showPromoIntro:     siteBannersSchema.showPromoIntro.default,
    },
  },
};


// ************************************************************************************************
// Validation
// ************************************************************************************************

function validateSettings(settings, schema)
{
  Object.entries(settings).forEach(([key, value]) =>
  {
    if (key in schema)
    {
      switch (schema[key].type)
      {
        case TYPE.INTEGER:
          if ((Number.isInteger(value) === false) || (value < schema[key].values[0]) || (value > schema[key].values[schema[key].values.length - 1]))
          {
            debug.warn(`validateSettings() - ${key} has invalid value: ${value} (${key} is type: ${schema[key].type} - min: ${schema[key].values[0]} - max: ${schema[key].values[schema[key].values.length - 1]}) -- setting default value: ${schema[key].default}`);
            settings[key] = schema[key].default;
          }
          break;
        
        case TYPE.BOOLEAN:
          if ((value !== true) && (value !== false))
          {
            debug.warn(`validateSettings() - ${key} has invalid value: ${value} (${key} is type: ${schema[key].type}) -- setting default value: ${schema[key].default}`);
            settings[key] = schema[key].default;
          }
          break;

        case TYPE.STRING:
          break;

        default:
          debug.warn(`validateSettings() - ${key} has unknown type: ${schema[key].type}`);
      }
    }
    else
    {
      debug.warn(`validateSettings() - ${key} with value: ${value} is not in schema`);
    }
  });
}
