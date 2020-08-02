//
// Schemas and objects for playback and site settings
//
// https://ultrafunk.com
//


export {
  playbackSettingsSchema,
  playbackSettings,
  siteSettingsSchema,
  siteSettings,
};


// ************************************************************************************************
// Playback
// ************************************************************************************************

const playbackSettingsSchema = {
  autoPlay:              { description: 'Autoplay next track',             values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  autoCrossfade:         { description: 'Auto Crossfade to next track',    values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
  autoCrossfadeLength:   { description: 'Auto Crossfade Length',           values: [5, 10, 15, 20, 25, 30], default: 15,    valueStrings: ['5 sec', '10 sec', '15 sec', '20 sec', '25 sec', '30 sec'] },
  autoCrossfadeCurve:    { description: 'Auto Crossfade Curve',            values: [0, 1],                  default: 1,     valueStrings: ['EQUAL POWER', 'LINEAR'] },
  autoScroll:            { description: 'Autoscroll to next track',        values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  smoothScrolling:       { description: 'Smooth Scrolling to next track',  values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  animateNowPlayingIcon: { description: 'Animate Playing Track Icon',      values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  showTimerOnMobile:     { description: 'Show Track Times on mobile',      values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
  autoExitFullscreen:    { description: 'Exit Fullscreen on next track',   values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  masterVolume:          { description: 'Master Volume',                   values: [0, 25, 50, 75, 100],    default: 100,   valueStrings: ['0%', '25%', '50%', '75%', '100%'] },
  masterMute:            { description: 'Master Mute',                     values: [true, false],           default: false, valueStrings: ['ON', 'OFF'] },
  trackCrossfade:        { description: 'Track to Track Crossfade',        values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  trackCrossfadeLength:  { description: 'Track to Track Crossfade Length', values: [5, 10, 15, 20, 25, 30], default: 10,    valueStrings: ['5 sec', '10 sec', '15 sec', '20 sec', '25 sec', '30 sec'] },
  trackCrossfadeCurve:   { description: 'Track to Track Crossfade Curve',  values: [0, 1],                  default: 0,     valueStrings: ['EQUAL POWER', 'LINEAR'] },
  timeRemainingWarning:  { description: 'Time Remaining Warning',          values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
  timeRemainingSeconds:  { description: 'Time Remaining Warning Seconds',  values: [15, 30, 45, 60],        default: 45,    valueStrings: ['15 sec', '30 sec', '45 sec', '60 sec'] },
  autoExitFsOnWarning:   { description: 'Exit Fullscreen on Time Warning', values: [true, false],           default: true,  valueStrings: ['ON', 'OFF'] },
};

const playbackSettings = {
  // Incremental version to check for new properties
  version:           17,
  storageChangeSync: false,
  // User (public) settings
  user: {
    autoPlay:              playbackSettingsSchema.autoPlay.default,
    autoCrossfade:         playbackSettingsSchema.autoCrossfade.default,
    autoCrossfadeLength:   playbackSettingsSchema.autoCrossfadeLength.default,
    autoCrossfadeCurve:    playbackSettingsSchema.autoCrossfadeCurve.default,
    autoScroll:            playbackSettingsSchema.autoScroll.default,
    smoothScrolling:       playbackSettingsSchema.smoothScrolling.default,
    animateNowPlayingIcon: playbackSettingsSchema.animateNowPlayingIcon.default,
    showTimerOnMobile:     playbackSettingsSchema.showTimerOnMobile.default,
    autoExitFullscreen:    playbackSettingsSchema.autoExitFullscreen.default,
    masterVolume:          playbackSettingsSchema.masterVolume.default,
    masterMute:            playbackSettingsSchema.masterMute.default,
    trackCrossfade:        playbackSettingsSchema.trackCrossfade.default,
    trackCrossfadeLength:  playbackSettingsSchema.trackCrossfadeLength.default,     
    trackCrossfadeCurve:   playbackSettingsSchema.trackCrossfadeCurve.default,
    timeRemainingWarning:  playbackSettingsSchema.timeRemainingWarning.default,
    timeRemainingSeconds:  playbackSettingsSchema.timeRemainingSeconds.default,
    autoExitFsOnWarning:   playbackSettingsSchema.autoExitFsOnWarning.default,
    blurFocusBgChange:     false,
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
  siteTheme:   { description: 'Theme',        values: ['light', 'dark', 'auto'],        default: 'auto',     valueStrings: ['LIGHT', 'DARK', 'AUTO / SYSTEM']   },
  trackLayout: { description: 'Track Layout', values: ['list', '2-column', '3-column'], default: '3-column', valueStrings: ['LIST', '2 COLUMN', '3 / 4 COLUMN'] },
};

const siteSettings = {
  // Incremental version to check for new properties
  version:           4,
  storageChangeSync: false,
  // User (public) settings
  user: {
    siteTheme:   siteSettingsSchema.siteTheme.default,
    trackLayout: siteSettingsSchema.trackLayout.default,
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

