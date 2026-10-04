import { Platform } from 'react-native';
import { ENABLE_ADS, INTERSTITIAL_AD_UNIT_ID } from '../../config/adsConfig';

const DEV = typeof __DEV__ !== 'undefined' && __DEV__;
const devLog = (...args) => {
  if (DEV) console.log('[InterstitialManager]', ...args);
};
const devWarn = (...args) => {
  if (DEV) console.warn('[InterstitialManager]', ...args);
};

const MIN_INTERVAL_MS = 30 * 60 * 1000;
const MAX_RETRIES = 2;

let currentAd = null;
let currentRequestId = 0;
let ready = false;
let lastShownAt = 0;
let lastLoadError = null;
let retryTimer = null;

const hasValidUnitId = () => {
  return !!(INTERSTITIAL_AD_UNIT_ID && String(INTERSTITIAL_AD_UNIT_ID).trim().length > 0);
};

const clearRetryTimer = () => {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
};

export class InterstitialManager {
  static isEnabled() {
    return ENABLE_ADS && Platform.OS !== 'web' && hasValidUnitId();
  }

  static isReady() {
    return !!(this.isEnabled() && ready && currentAd);
  }

  static getLastLoadError() {
    return lastLoadError;
  }

  static async preload(options = {}) {
    if (!this.isEnabled()) {
      ready = false;
      currentAd = null;
      return { ok: false, reason: 'disabled' };
    }

    const requestId = ++currentRequestId;
    clearRetryTimer();

    if (currentAd && ready) {
      return { ok: true, reason: 'already-loaded', reused: true };
    }

    const retry = (options.retryCount ?? 0);

    try {
      const RNGoogleMobileAds = await import('react-native-google-mobile-ads');
      const InterstitialAd =
        RNGoogleMobileAds.InterstitialAd ||
        RNGoogleMobileAds.default?.InterstitialAd;
      const TestIds =
        RNGoogleMobileAds.TestIds ||
        RNGoogleMobileAds.default?.TestIds;

      if (!InterstitialAd) {
        lastLoadError = new Error('InterstitialAd not available');
        return { ok: false, error: 'no-module' };
      }

      let unitId = INTERSTITIAL_AD_UNIT_ID;
      const useTest = !unitId || DEV;
      if (useTest) {
        const fallbackId = Platform.select({
          ios: TestIds?.INTERSTITIAL || 'ca-app-pub-3940256099942544/4411468910',
          android: TestIds?.INTERSTITIAL || 'ca-app-pub-3940256099942544/1033173712',
        });
        unitId = unitId || fallbackId;
      }

      const ad = InterstitialAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      const loaded = new Promise((resolve, reject) => {
        let resolved = false;
        const finish = (ok, val) => {
          if (resolved) return;
          resolved = true;
          try {
            if (ad.removeAllListeners) ad.removeAllListeners();
            if (ad.destroy && !ok) ad.destroy();
          } catch {}
          if (ok) resolve(val);
          else reject(val);
        };

        ad.addEventListener('interstitialAdLoaded', () => finish(true, ad));
        ad.addEventListener('interstitialAdFailedToLoad', (event) =>
          finish(false, event?.error || new Error('failed to load'))
        );

        try {
          ad.load();
        } catch (e) {
          finish(false, e);
        }
      });

      const resolvedAd = await loaded;

      if (requestId !== currentRequestId) {
        try { resolvedAd.destroy?.(); } catch {}
        return { ok: false, reason: 'stale-request' };
      }

      if (currentAd && currentAd !== resolvedAd) {
        try { currentAd.destroy?.(); } catch {}
      }

      currentAd = resolvedAd;
      ready = true;
      lastLoadError = null;

      const handleClosed = () => {
        if (currentAd !== resolvedAd) return;
        ready = false;
        currentAd = null;
        setTimeout(() => InterstitialManager.preload({ retryCount: 0 }).catch(() => {}), 0);
      };

      try {
        resolvedAd.addEventListener?.('interstitialAdClosed', handleClosed);
        resolvedAd.addEventListener?.('interstitialAdFailedToShow', (ev) => {
          devWarn('show failed', ev?.error);
          lastLoadError = ev?.error || new Error('show failed');
          if (currentAd === resolvedAd) {
            ready = false;
            currentAd = null;
          }
        });
      } catch (e) {
        devWarn('addEventListener failed', e);
      }

      devLog(`preload ok${useTest ? ' (TEST ID)' : ''}`);
      return { ok: true };
    } catch (e) {
      if (requestId !== currentRequestId) {
        return { ok: false, reason: 'stale-request' };
      }
      lastLoadError = e;
      ready = false;
      currentAd = null;
      devWarn('preload failed (retry=' + retry + '):', e?.message || e);

      if (retry < MAX_RETRIES) {
        const delayMs = Math.min(30000, 2000 * Math.pow(2, retry));
        retryTimer = setTimeout(() => {
          InterstitialManager.preload({ retryCount: retry + 1 }).catch(() => {});
        }, delayMs);
      }

      return { ok: false, error: e?.message || String(e) };
    }
  }

  static async showIfReady(options = {}) {
    if (!this.isEnabled()) {
      return { ok: false, reason: 'disabled' };
    }

    const force = !!options.force;
    const reason = options.reason || 'generic';
    const now = Date.now();
    if (!force && lastShownAt && now - lastShownAt < MIN_INTERVAL_MS) {
      return { ok: false, reason: 'cooldown', remainingMs: MIN_INTERVAL_MS - (now - lastShownAt) };
    }

    if (!this.isReady()) {
      setTimeout(() => this.preload({ retryCount: 0 }).catch(() => {}), 0);
      return { ok: false, reason: 'not-ready' };
    }

    try {
      const ad = currentAd;
      currentAd = null;
      ready = false;
      lastShownAt = now;
      if (ad?.show) {
        await ad.show();
      } else {
        throw new Error('ad has no show()');
      }
      devLog('show ok reason=' + reason);
      return { ok: true, reason };
    } catch (e) {
      lastLoadError = e;
      devWarn('showIfReady error:', e?.message || e);
      setTimeout(() => this.preload({ retryCount: 0 }).catch(() => {}), 0);
      return { ok: false, error: e?.message || String(e) };
    }
  }

  static resetForTest() {
    clearRetryTimer();
    currentAd = null;
    currentRequestId = 0;
    ready = false;
    lastShownAt = 0;
    lastLoadError = null;
  }
}