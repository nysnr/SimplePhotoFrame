import { Platform } from 'react-native';
import { getInterstitialAdUnitId, ENABLE_ADS } from '../../config/adsConfig';

const COOLDOWN_MS = 4 * 60 * 1000;
const MAX_DAILY_SHOWS = 3;
const LOAD_WAIT_TIMEOUT_MS = 4000;

let interstitialAd = null;
let adLoaded = false;
let lastShownAt = 0;
let dailyShowCount = 0;
let dailyCountDate = null;
let loadInProgress = false;

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function resetDailyCountIfNeeded() {
  const today = getTodayKey();
  if (dailyCountDate !== today) {
    dailyCountDate = today;
    dailyShowCount = 0;
  }
}

function log(msg, extra) {
  if (__DEV__) {
    if (extra) {
      console.log(`[Interstitial] ${msg}`, extra);
    } else {
      console.log(`[Interstitial] ${msg}`);
    }
  }
}

function createAd() {
  const unitId = getInterstitialAdUnitId();
  if (!unitId) {
    log('createAd: no unitId');
    return null;
  }
  try {
    const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');
    const ad = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    ad.addAdEventListener(AdEventType.LOADED, () => {
      log('event: LOADED');
      adLoaded = true;
      loadInProgress = false;
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      log('event: CLOSED -> preload next');
      adLoaded = false;
      preload();
    });
    ad.addAdEventListener(AdEventType.ERROR, (error) => {
      log('event: ERROR', error);
      adLoaded = false;
      loadInProgress = false;
    });
    return ad;
  } catch (e) {
    log('createAd failed', e);
    return null;
  }
}

export class InterstitialManager {
  static isEnabled() {
    if (!ENABLE_ADS) return false;
    return !!getInterstitialAdUnitId();
  }

  static async preload() {
    if (!InterstitialManager.isEnabled()) {
      log('preload: disabled');
      return;
    }
    if (loadInProgress) {
      log('preload: already loading');
      return;
    }
    if (adLoaded) {
      log('preload: already loaded');
      return;
    }
    loadInProgress = true;
    try {
      if (!interstitialAd) {
        interstitialAd = createAd();
      }
      if (interstitialAd && typeof interstitialAd.load === 'function') {
        log('preload: calling load()');
        interstitialAd.load();
      }
    } catch (e) {
      log('preload error', e);
      loadInProgress = false;
    }
  }

  static async showIfReady(options = {}) {
    if (!InterstitialManager.isEnabled()) {
      log('showIfReady: disabled');
      return false;
    }
    resetDailyCountIfNeeded();

    const now = Date.now();
    if (now - lastShownAt < COOLDOWN_MS) {
      log('showIfReady: cooldown active');
      return false;
    }
    if (dailyShowCount >= MAX_DAILY_SHOWS) {
      log('showIfReady: daily cap reached');
      return false;
    }

    if (!interstitialAd) {
      interstitialAd = createAd();
    }
    if (!interstitialAd) return false;

    if (!adLoaded) {
      log('showIfReady: not loaded, attempting load + wait');
      try {
        if (!loadInProgress && typeof interstitialAd.load === 'function') {
          loadInProgress = true;
          interstitialAd.load();
        }
        await new Promise((resolve) => {
          const start = Date.now();
          const tick = () => {
            if (adLoaded || Date.now() - start >= LOAD_WAIT_TIMEOUT_MS) {
              resolve();
            } else {
              setTimeout(tick, 200);
            }
          };
          tick();
        });
      } catch (e) {
        log('showIfReady load-wait error', e);
      }
    }

    if (!adLoaded) {
      log('showIfReady: still not loaded after wait, giving up');
      return false;
    }

    try {
      if (typeof interstitialAd.show === 'function') {
        log('showIfReady: showing ad');
        await interstitialAd.show();
        lastShownAt = now;
        dailyShowCount += 1;
        adLoaded = false;
        log('showIfReady: shown successfully');
        return true;
      }
    } catch (e) {
      log('showIfReady show error', e);
      adLoaded = false;
    }
    return false;
  }
}
