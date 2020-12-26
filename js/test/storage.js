//
// js/src/shared/storage.js test data
//
// https://ultrafunk.com
//


export {
  playbackSettings,
  siteSettings,
  presetList,
};


// ************************************************************************************************
//
// ************************************************************************************************

const playbackSettings = {
  version: 23,
  user: {
    testValue:              'testValue',
    keyboardShortcuts:      'true',
    masterVolume:           '100',
    masterMute:             'false',
    autoPlay:               'true',
    autoCrossfade:          'false',
    autoCrossfadeLength:    '20',
    autoCrossfadeCurve:     '1',
    autoScroll:             'true',
    /*
    smoothScrolling:        'true',
    autoExitFullscreen:     'true',
    animateNowPlayingIcon:  'true',
    autoResumePlayback:     'false',
    trackCrossfade:         'true',
    trackCrossfadeLength:   '10',
    trackCrossfadeCurve:    '0',
    timeRemainingWarning:   'true',
    timeRemainingSeconds:   '60',
    autoExitFsOnWarning:    'true',
    keepMobileScreenOn:     'false',
    */
    trackTimesOnMobile:     'false',
    trackThumbnailOnMobile: 'true',
  //blurFocusBgChange:      false,
  },
  priv: {
    testValue:          'testValue',
    storageChangeSync:  'false',
    continueAutoPlay:   'false',
    tips: {
      showLeftArrowHint:  'true',
      showRightArrowHint: 'true',
      showDetailsHint:    'true',
      showTrackImageHint: 'true',
    }
  },
};

playbackSettings.priv.playbackTest1 = { testValue: '1' };
playbackSettings.priv.playbackTest1.playbackTest2 = { testValue: '2' };


/*************************************************************************************************/

const siteSettings = {
  version: 7,
  user: {
    theme:             'AUTO',
    trackLayout:       '3-COLUMN',
    tracksPerPage:     '12',
    keyboardShortcuts: 'true',
  },
  priv: {
    storageChangeSync: 'false',
    banners2: {
      showFrontpageIntro: 'true',
      showPremiumIntro:   'true',
      showPromoIntro:     'true',
    },
  },
};

siteSettings.priv.banners2.siteTest1 = { testValue: '1' };
siteSettings.priv.banners2.siteTest1.siteTest2 = { testValue: '2' };


/*************************************************************************************************/

const presetList = {
  version: 1,
  crossfade: [
    {
      name:   'Preset 1',
      length: 10,
      curve:  0,
    },
    {
      name:   'Preset 2',
      length: 20,
      curve:  0,
    },
    {
      name:   'Preset 3',
      length: 30,
      curve:  0,
    },
    {
      name:   'Preset 4',
      length: 30,
      curve:  1,
    },
  ],
};
