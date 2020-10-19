//
// Schemas, objects and validation for playback and site settings
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js';
import { KEY }          from '../common/storage.js';


export {
  playbackSettingsSchema,
  playbackSettings,
  siteSettingsSchema,
  siteSettings,
  validate,
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

const playbackSettingsSchema = {
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

const playbackSettings = {
  // Incremental version to check for new properties
  version:           21,
  storageChangeSync: false,
  // User (public) settings
  user: {
    keyboardShortcuts:      playbackSettingsSchema.keyboardShortcuts.default,
    masterVolume:           playbackSettingsSchema.masterVolume.default,
    masterMute:             playbackSettingsSchema.masterMute.default,
    autoPlay:               playbackSettingsSchema.autoPlay.default,
    autoCrossfade:          playbackSettingsSchema.autoCrossfade.default,
    autoCrossfadeLength:    playbackSettingsSchema.autoCrossfadeLength.default,
    autoCrossfadeCurve:     playbackSettingsSchema.autoCrossfadeCurve.default,
    autoScroll:             playbackSettingsSchema.autoScroll.default,
    smoothScrolling:        playbackSettingsSchema.smoothScrolling.default,
    autoExitFullscreen:     playbackSettingsSchema.autoExitFullscreen.default,
    animateNowPlayingIcon:  playbackSettingsSchema.animateNowPlayingIcon.default,
    autoResumePlayback:     playbackSettingsSchema.autoResumePlayback.default,
    trackCrossfade:         playbackSettingsSchema.trackCrossfade.default,
    trackCrossfadeLength:   playbackSettingsSchema.trackCrossfadeLength.default,     
    trackCrossfadeCurve:    playbackSettingsSchema.trackCrossfadeCurve.default,
    timeRemainingWarning:   playbackSettingsSchema.timeRemainingWarning.default,
    timeRemainingSeconds:   playbackSettingsSchema.timeRemainingSeconds.default,
    autoExitFsOnWarning:    playbackSettingsSchema.autoExitFsOnWarning.default,
    keepMobileScreenOn:     playbackSettingsSchema.keepMobileScreenOn.default,
    trackTimesOnMobile:     playbackSettingsSchema.trackTimesOnMobile.default,
    trackThumbnailOnMobile: playbackSettingsSchema.trackThumbnailOnMobile.default,
    blurFocusBgChange:      false,
  },
  // Priv (private / internal) settings
  priv: {
    continueAutoPlay:   false,
    showLeftArrowHint:  true,
    showRightArrowHint: true,
    showDetailsHint:    true,
    showTrackImageHint: true,
  },
};


// ************************************************************************************************
// Site
// ************************************************************************************************

const siteSettingsSchema = {
  theme:             { description: 'Theme',                                    type: TYPE.STRING,  values: ['light', 'dark', 'auto'],             default: 'auto',     valueStrings: ['LIGHT', 'DARK', 'AUTO / SYSTEM']         },
  trackLayout:       { description: 'Track Layout',                             type: TYPE.STRING,  values: ['list', '2-column', '3-column'],      default: '3-column', valueStrings: ['LIST', '2 COLUMN', '3 / 4 COLUMN']       },
  tracksPerPage:     { description: 'Tracks Per Page for Search &amp; Shuffle', type: TYPE.INTEGER, values: [...Array(22).keys()].map(i => i + 3), default: 12,         valueStrings: [...Array(22).keys()].map(i => `${i + 3}`) },
  keyboardShortcuts: { description: 'Keyboard Shortcuts',                       type: TYPE.BOOLEAN, values: [true, false],                         default: true,       valueStrings: ['ON', 'OFF']                              },
};

const siteSettings = {
  // Incremental version to check for new properties
  version:           6,
  storageChangeSync: false,
  // User (public) settings
  user: {
    theme:             siteSettingsSchema.theme.default,
    trackLayout:       siteSettingsSchema.trackLayout.default,
    tracksPerPage:     siteSettingsSchema.tracksPerPage.default,
    keyboardShortcuts: siteSettingsSchema.keyboardShortcuts.default,
  },
  // Priv (private / internal) settings
  priv: {
    banners: {
      showFrontpageIntro: true,
      showPremiumIntro:   true,
      showPromoIntro:     true,
    },
  },
};


// ************************************************************************************************
// Validation
// ************************************************************************************************

function validate(settings, storageKey)
{
  debug.log(`validate(): ${storageKey}`);

  const schema = (storageKey === KEY.UF_PLAYBACK_SETTINGS) ? playbackSettingsSchema : siteSettingsSchema;

  Object.entries(settings).forEach(([key, value]) =>
  {
    if (key in schema)
    {
      switch (schema[key].type)
      {
        case TYPE.INTEGER:
          if ((Number.isInteger(value) === false) || (value < schema[key].values[0]) || (value > schema[key].values[schema[key].values.length - 1]))
          {
            debug.warn(`validate() - ${key} has invalid value: ${value} (${key} is type: ${schema[key].type} - min: ${schema[key].values[0]} - max: ${schema[key].values[schema[key].values.length - 1]}) -- setting default value: ${schema[key].default}`);
            settings[key] = schema[key].default;
          }
          break;
        
        case TYPE.BOOLEAN:
          if ((value !== true) && (value !== false))
          {
            debug.warn(`validate() - ${key} has invalid value: ${value} (${key} is type: ${schema[key].type}) -- setting default value: ${schema[key].default}`);
            settings[key] = schema[key].default;
          }
          break;

        case TYPE.STRING:
          break;

        default:
          debug.warn(`validate() - ${key} has unknown type: ${schema[key].type}`);
      }
    }
  });
}
