import { Platform } from 'react-native';
import Constants from 'expo-constants';

const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
const extra = (Constants && Constants.expoConfig && Constants.expoConfig.extra) ? Constants.expoConfig.extra : {};

// Production AdMob Ad Unit IDs (hardcoded here to guarantee these are always available
// even when EAS secrets/env vars are not injected for a build).
// DO NOT replace these with Test IDs for production builds.
const PROD_BANNER_ID_IOS = 'ca-app-pub-3457277467592299/7061250916';
const PROD_BANNER_ID_ANDROID = PROD_BANNER_ID_IOS;
const PROD_INTERSTITIAL_ID_IOS = 'ca-app-pub-3457277467592299/8520494517';
const PROD_INTERSTITIAL_ID_ANDROID = PROD_INTERSTITIAL_ID_IOS;

// Google's official Test IDs (from the AdMob docs). Requests to these units are
// served by Google's demo inventory and never touch our AdMob account, so they
// are safe to ship while the account suspension is in effect.
const TEST_BANNER_ID_IOS = 'ca-app-pub-3940256099942544/2934735716';
const TEST_BANNER_ID_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID_IOS = 'ca-app-pub-3940256099942544/4411468910';
const TEST_INTERSTITIAL_ID_ANDROID = 'ca-app-pub-3940256099942544/1033173712';

// EXPO_PUBLIC_ENABLE_ADS accepts four values:
//   'true'     → production AdMob ad units
//   'test'     → Google test ad units (ads logic kept, zero production traffic)
//   'dev-only' → alias of 'test', used for local development
//   'false'    → ads fully OFF (no SDK init, no ATT, no requests)
// Default is 'false' so a missing env var can never send an AdMob request.
// extra.enableAdsMode is used as a fallback because app.config.js persists the
// resolved mode string; this keeps 'test' intact even if EXPO_PUBLIC_* values
// are not inlined into the bundle.
const ENABLE_ADS_RAW = env.EXPO_PUBLIC_ENABLE_ADS
  ?? extra.enableAdsMode
  ?? extra.enableAds
  ?? env.ENABLE_ADS
  ?? 'false';
const ENABLE_ADS_NORM = String(ENABLE_ADS_RAW).toLowerCase();
// Test mode (test / dev-only): same runtime behaviour as production ads, but the
// request destination is Google's test inventory.
export const TEST_ADS = ENABLE_ADS_NORM === 'test' || ENABLE_ADS_NORM === 'dev-only';
export const ENABLE_ADS = ENABLE_ADS_NORM === 'true' || TEST_ADS;

// Interstitial is STOPPED for now. The screen-transition interstitial still
// needs rework, so it must not fire in this build. All interstitial code
// (InterstitialManager, the close-handler call sites) stays in place.
// Fail-closed: any value other than 'true' disables it.
// Re-enable later with EXPO_PUBLIC_ENABLE_INTERSTITIAL=true.
export const INTERSTITIAL_ENABLED =
  String(env.EXPO_PUBLIC_ENABLE_INTERSTITIAL ?? 'false').toLowerCase() === 'true';

// Devices that must always receive TEST ads, even when the app requests
// production ad units. This is what keeps the developer's own iPads/iPhones
// (which run 24/7 as photo frames) from accumulating real impressions on our
// own ad units and triggering the invalid-traffic suspension again.
// Sources: EXPO_PUBLIC_AD_TEST_DEVICE_IDS (comma separated) or app.json
// extra.adTestDeviceIds (array). Empty -> no device is overridden.
const parseTestDeviceIds = (value) => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return list.map((v) => String(v).trim()).filter(Boolean);
};

export const AD_TEST_DEVICE_IDS = parseTestDeviceIds(
  env.EXPO_PUBLIC_AD_TEST_DEVICE_IDS ?? extra.adTestDeviceIds
);

// Banner ad unit resolution.
// Test mode is checked FIRST on purpose: it guarantees no production AdMob
// request can be sent even if a stale EXPO_PUBLIC_BANNER_AD_UNIT_ID_* value is
// still present in the environment.
export const getBannerAdUnitId = (platform = Platform.OS) => {
  if (TEST_ADS) {
    return platform === 'android' ? TEST_BANNER_ID_ANDROID : TEST_BANNER_ID_IOS;
  }
  const explicit = env.EXPO_PUBLIC_BANNER_AD_UNIT_ID
    ?? (platform === 'ios' ? env.EXPO_PUBLIC_BANNER_AD_UNIT_ID_IOS : env.EXPO_PUBLIC_BANNER_AD_UNIT_ID_ANDROID)
    ?? extra.bannerAdUnitId;
  if (explicit && String(explicit).trim()) return String(explicit).trim();
  // DEFAULT: use Production IDs, even in __DEV__ and TestFlight / Internal Testing builds,
  // so that real heartbeat/watchdog behaviour can be verified against live AdMob inventory.
  return platform === 'android' ? PROD_BANNER_ID_ANDROID : PROD_BANNER_ID_IOS;
};

export const getInterstitialAdUnitId = (platform = Platform.OS) => {
  // Interstitial disabled: returning null makes InterstitialManager.isEnabled()
  // false, so preload() / showIfReady() become no-ops.
  if (!INTERSTITIAL_ENABLED) return null;
  // Same reasoning as the banner: test units keep the interstitial logic alive
  // without sending any traffic to our suspended AdMob account.
  if (TEST_ADS) {
    return platform === 'android' ? TEST_INTERSTITIAL_ID_ANDROID : TEST_INTERSTITIAL_ID_IOS;
  }
  const explicit = env.EXPO_PUBLIC_INTERSTITIAL_AD_UNIT_ID
    ?? (platform === 'ios' ? env.EXPO_PUBLIC_INTERSTITIAL_AD_UNIT_ID_IOS : env.EXPO_PUBLIC_INTERSTITIAL_AD_UNIT_ID_ANDROID)
    ?? extra.interstitialAdUnitId;
  if (explicit && String(explicit).trim()) return String(explicit).trim();
  return platform === 'android' ? PROD_INTERSTITIAL_ID_ANDROID : PROD_INTERSTITIAL_ID_IOS;
};

// --- App-side banner refresh -------------------------------------------------
// Used when AdMob's own "auto refresh" is DISABLED on the ad unit, so the app
// must drive refreshes itself. Defaults are deliberately slow to avoid the
// inventory depletion / match-rate collapse seen with aggressive refreshes:
// iPad 10 min, iPhone 3 min. Both are overridable (EXPO_PUBLIC_BANNER_REFRESH_MS_*)
// so the interval can be shortened as fill rate recovers.
const positiveMs = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export const BANNER_APP_REFRESH_ENABLED =
  String(env.EXPO_PUBLIC_BANNER_APP_REFRESH ?? 'true').toLowerCase() !== 'false';
export const BANNER_REFRESH_IPAD_MS = positiveMs(env.EXPO_PUBLIC_BANNER_REFRESH_MS_IPAD, 10 * 60 * 1000);
export const BANNER_REFRESH_IPHONE_MS = positiveMs(env.EXPO_PUBLIC_BANNER_REFRESH_MS_IPHONE, 3 * 60 * 1000);

export const BANNER_AD_UNIT_ID = getBannerAdUnitId();
