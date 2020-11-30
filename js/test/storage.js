//
// js/src/shared/storage.js test data
//
// https://ultrafunk.com
//


export {
  playbackSettings,
  siteSettings,
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
    presets: {
      autoCrossfade: {
        1 : {
          name:                'Preset 1',
          autoCrossfadeLength: '10',
          autoCrossfadeCurve:  '0',
        },
        2 :{
          name:                'Preset 2',
          autoCrossfadeLength: '20',
          autoCrossfadeCurve:  '1',
        },
        3 :{
          name:                'Preset 3',
          autoCrossfadeLength: '30',
          autoCrossfadeCurve:  '1',
        },
      },
      trackCrossfade: {
        1 : {
          name:                 'Preset 1',
          trackCrossfadeLength: '5',
          trackCrossfadeCurve:  '0',
        },
        2 :{
          name:                 'Preset 2',
          trackCrossfadeLength: '10',
          trackCrossfadeCurve:  '0',
        },
        3 :{
          name:                 'Preset 3',
          trackCrossfadeLength: '15',
          trackCrossfadeCurve:  '1',
        },
      },
    },
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
