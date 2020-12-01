//
// Schemas, objects and validation for playback and site settings
//
// https://ultrafunk.com
//


import * as debugLogger from '../shared/debuglogger.js';


export {
  INTEGER as TYPE_INTEGER,
  BOOLEAN as TYPE_BOOLEAN,
  STRING  as TYPE_STRING,
  playbackSchema,
  playbackSettings,
  siteSchema,
  siteSettings,
  validateSettings,
};


/*************************************************************************************************/


const debug = debugLogger.newInstance('settings');

const INTEGER = 1;
const BOOLEAN = 2;
const STRING  = 3;


// ************************************************************************************************
// Playback
// ************************************************************************************************

const playbackSchema = {
  version: { description: '', type: INTEGER, values: [1, 999999], default: 23, valueStrings: [] },
  user: {
    keyboardShortcuts:      { description: 'Keyboard Shortcuts',                 type: BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
    masterVolume:           { description: 'Master Volume',                      type: INTEGER, values: [0, 25, 50, 75, 100],    default: 100,   valueStrings: ['0%', '25%', '50%', '75%', '100%'] },
    masterMute:             { description: 'Master Mute',                        type: BOOLEAN, values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
    autoPlay:               { description: 'Autoplay next track',                type: BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
    autoCrossfade:          { description: 'Auto Crossfade to next track',       type: BOOLEAN, values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
    autoCrossfadeLength:    { description: 'Auto Crossfade Length',              type: INTEGER, values: [5, 10, 15, 20, 25, 30], default: 20,    valueStrings: ['5 sec', '10 sec', '15 sec', '20 sec', '25 sec', '30 sec'] },
    autoCrossfadeCurve:     { description: 'Auto Crossfade Curve',               type: INTEGER, values: [0, 1],                  default: 1,     valueStrings: ['EQUAL POWER', 'LINEAR'] },
    autoScroll:             { description: 'Autoscroll to next track',           type: BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
    smoothScrolling:        { description: 'Smooth Scrolling to next track',     type: BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
    autoExitFullscreen:     { description: 'Exit Fullscreen on next track',      type: BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
    animateNowPlayingIcon:  { description: 'Animate Playing Track Icon',         type: BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
    autoResumePlayback:     { description: 'Auto Resume Playback on focus',      type: BOOLEAN, values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
    trackCrossfade:         { description: 'Track to Track Crossfade',           type: BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
    trackCrossfadeLength:   { description: 'Track to Track Crossfade Length',    type: INTEGER, values: [5, 10, 15, 20, 25, 30], default: 10,    valueStrings: ['5 sec', '10 sec', '15 sec', '20 sec', '25 sec', '30 sec'] },
    trackCrossfadeCurve:    { description: 'Track to Track Crossfade Curve',     type: INTEGER, values: [0, 1],                  default: 0,     valueStrings: ['EQUAL POWER', 'LINEAR'] },
    timeRemainingWarning:   { description: 'Time Remaining Warning',             type: BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
    timeRemainingSeconds:   { description: 'Time Remaining Warning Seconds',     type: INTEGER, values: [15, 30, 45, 60],        default: 60,    valueStrings: ['15 sec', '30 sec', '45 sec', '60 sec'] },
    autoExitFsOnWarning:    { description: 'Exit Fullscreen on Time Warning',    type: BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
    keepMobileScreenOn:     { description: 'Keep Mobile Screen On when playing', type: BOOLEAN, values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
    trackTimesOnMobile:     { description: 'Show Track Times on mobile',         type: BOOLEAN, values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
    trackThumbnailOnMobile: { description: 'Show Track Thumbnail on mobile',     type: BOOLEAN, values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  },
  priv: {
    storageChangeSync:  { description: '', type: BOOLEAN, values: [true, false], default: false, valueStrings: [] },
    continueAutoPlay:   { description: '', type: BOOLEAN, values: [true, false], default: false, valueStrings: [] },
    tips: {
      showLeftArrowHint:  { description: '', type: BOOLEAN, values: [true, false], default: true,  valueStrings: [] },
      showRightArrowHint: { description: '', type: BOOLEAN, values: [true, false], default: true,  valueStrings: [] },
      showDetailsHint:    { description: '', type: BOOLEAN, values: [true, false], default: true,  valueStrings: [] },
      showTrackImageHint: { description: '', type: BOOLEAN, values: [true, false], default: true,  valueStrings: [] },
    },
  }
};

const playbackSettings = {
  version: playbackSchema.version.default,
  user: {
    keyboardShortcuts:      playbackSchema.user.keyboardShortcuts.default,
    masterVolume:           playbackSchema.user.masterVolume.default,
    masterMute:             playbackSchema.user.masterMute.default,
    autoPlay:               playbackSchema.user.autoPlay.default,
    autoCrossfade:          playbackSchema.user.autoCrossfade.default,
    autoCrossfadeLength:    playbackSchema.user.autoCrossfadeLength.default,
    autoCrossfadeCurve:     playbackSchema.user.autoCrossfadeCurve.default,
    autoScroll:             playbackSchema.user.autoScroll.default,
    smoothScrolling:        playbackSchema.user.smoothScrolling.default,
    autoExitFullscreen:     playbackSchema.user.autoExitFullscreen.default,
    animateNowPlayingIcon:  playbackSchema.user.animateNowPlayingIcon.default,
    autoResumePlayback:     playbackSchema.user.autoResumePlayback.default,
    trackCrossfade:         playbackSchema.user.trackCrossfade.default,
    trackCrossfadeLength:   playbackSchema.user.trackCrossfadeLength.default,     
    trackCrossfadeCurve:    playbackSchema.user.trackCrossfadeCurve.default,
    timeRemainingWarning:   playbackSchema.user.timeRemainingWarning.default,
    timeRemainingSeconds:   playbackSchema.user.timeRemainingSeconds.default,
    autoExitFsOnWarning:    playbackSchema.user.autoExitFsOnWarning.default,
    keepMobileScreenOn:     playbackSchema.user.keepMobileScreenOn.default,
    trackTimesOnMobile:     playbackSchema.user.trackTimesOnMobile.default,
    trackThumbnailOnMobile: playbackSchema.user.trackThumbnailOnMobile.default,
  //blurFocusBgChange:      false,
  },
  priv: {
    storageChangeSync:  playbackSchema.priv.storageChangeSync.default,
    continueAutoPlay:   playbackSchema.priv.continueAutoPlay.default,
    tips: {
      showLeftArrowHint:  playbackSchema.priv.tips.showLeftArrowHint.default,
      showRightArrowHint: playbackSchema.priv.tips.showRightArrowHint.default,
      showDetailsHint:    playbackSchema.priv.tips.showDetailsHint.default,
      showTrackImageHint: playbackSchema.priv.tips.showTrackImageHint.default,
    },
  },
};


// ************************************************************************************************
// Site
// ************************************************************************************************

const siteSchema = {
  version: { description: '', type: INTEGER, values: [1, 999999], default: 7, valueStrings: [] },
  user: {
    theme:             { description: 'Theme',                                    type: STRING,  values: ['light', 'dark', 'auto'],             default: 'auto',     valueStrings: ['LIGHT', 'DARK', 'AUTO / SYSTEM']         },
    trackLayout:       { description: 'Track Layout',                             type: STRING,  values: ['list', '2-column', '3-column'],      default: '3-column', valueStrings: ['LIST', '2 COLUMN', '3 / 4 COLUMN']       },
    tracksPerPage:     { description: 'Tracks Per Page for Search &amp; Shuffle', type: INTEGER, values: [...Array(22).keys()].map(i => i + 3), default: 12,         valueStrings: [...Array(22).keys()].map(i => `${i + 3}`) },
    keyboardShortcuts: { description: 'Keyboard Shortcuts',                       type: BOOLEAN, values: [true, false],                         default: true,       valueStrings: ['ON', 'OFF']                              },
  },
  priv: {
    storageChangeSync: { description: '', type: BOOLEAN, values: [true, false], default: false, valueStrings: [] },
    banners: {
      showFrontpageIntro: { description: '', type: BOOLEAN, values: [true, false], default: true, valueStrings: [] },
      showPremiumIntro:   { description: '', type: BOOLEAN, values: [true, false], default: true, valueStrings: [] },
      showPromoIntro:     { description: '', type: BOOLEAN, values: [true, false], default: true, valueStrings: [] },
    }
  }
};

const siteSettings = {
  version: siteSchema.version.default,
  user: {
    theme:             siteSchema.user.theme.default,
    trackLayout:       siteSchema.user.trackLayout.default,
    tracksPerPage:     siteSchema.user.tracksPerPage.default,
    keyboardShortcuts: siteSchema.user.keyboardShortcuts.default,
  },
  priv: {
    storageChangeSync: siteSchema.priv.storageChangeSync.default,
    banners: {
      showFrontpageIntro: siteSchema.priv.banners.showFrontpageIntro.default,
      showPremiumIntro:   siteSchema.priv.banners.showPremiumIntro.default,
      showPromoIntro:     siteSchema.priv.banners.showPromoIntro.default,
    },
  },
};


// ************************************************************************************************
// Validation
// ************************************************************************************************

function validateSettings(settings, schema)
{
  let invalidCount = 0;

  validateRecursive(settings, schema);

  return invalidCount;

  function validateRecursive(settings, schema)
  {
    for (const key in settings)
    {
      if (settings && schema && (typeof settings[key] === 'object') && (typeof schema[key] === 'object'))
      {
        validateRecursive(settings[key], schema[key]);
      }
      else
      {
        if (schema[key] !== undefined)
        {
          if (isEntryInvalid(settings, schema[key], settings[key], key))
            invalidCount++;
        }
        else
        {
          throw(`'${key}' ${(typeof settings[key] === 'object') ? 'object' : 'property'} is not in schema`);
        }
      }
    }
  }
}

function isEntryInvalid(settings, schemaEntry, settingValue, entryKey)
{
  switch (schemaEntry.type)
  {
    case INTEGER:
      if ((Number.isInteger(settingValue) === false) || (settingValue < schemaEntry.values[0]) || (settingValue > schemaEntry.values[schemaEntry.values.length - 1]))
      {
        debug.warn(`validate() - '${entryKey}' has invalid value: ${settingValue} ('${entryKey}' is type: INTEGER - min: ${schemaEntry.values[0]} - max: ${schemaEntry.values[schemaEntry.values.length - 1]}) -- setting default value: ${schemaEntry.default}`);
        settings[entryKey] = schemaEntry.default;
        return true;
      }
      break;
    
    case BOOLEAN:
      if ((settingValue !== true) && (settingValue !== false))
      {
        debug.warn(`validate() - '${entryKey}' has invalid value: ${settingValue} ('${entryKey}' is type: BOOLEAN) -- setting default value: ${schemaEntry.default}`);
        settings[entryKey] = schemaEntry.default;
        return true;
      }
      break;

    case STRING:
      if (typeof settingValue !== 'string')
      {
        debug.warn(`validate() - '${entryKey}' has invalid value: ${settingValue} ('${entryKey}' is type: STRING) -- setting default value: ${schemaEntry.default}`);
        settings[entryKey] = schemaEntry.default;
        return true;
      }
      break;

    default:
      debug.warn(`validate() - '${entryKey}' has unknown type: ${schemaEntry.type}`);
      return true;
  }
}
