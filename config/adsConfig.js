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

// Test IDs from Google's official docs — retained ONLY so an accidental explicit
// EXPO_PUBLIC_ENABLE_ADS=dev-only value never hits production inventory.
// The DEFAULT path (enableAds=true, no dev-only flag) always uses PRODUCTION IDs below.
const TEST_BANNER_ID_IOS = 'ca-app-pub-3940256099942544/2934735716';
const TEST_BANNER_ID_ANDROID = 'ca-app-pub-3940256099942544/6300978111';

// ENABLE_ADS: default true unless explicitly set to 'false'.
// Setting EXPO_PUBLIC_ENABLE_ADS=dev-only switches to Google's Test IDs.
const ENABLE_ADS_RAW = env.EXPO_PUBLIC_ENABLE_ADS ?? extra.enableAds ?? env.ENABLE_ADS ?? 'true';
export const ENABLE_ADS = String(ENABLE_ADS_RAW).toLowerCase() !== 'false';
const DEV_ONLY_ADS = String(ENABLE_ADS_RAW).toLowerCase() === 'dev-only';

// Priority: EXPO_PUBLIC env var > app.config extra > hardcoded production ID > (dev-only) test ID
export const getBannerAdUnitId = (platform = Platform.OS) => {
  const explicit = env.EXPO_PUBLIC_BANNER_AD_UNIT_ID
    ?? (platform === 'ios' ? env.EXPO_PUBLIC_BANNER_AD_UNIT_ID_IOS : env.EXPO_PUBLIC_BANNER_AD_UNIT_ID_ANDROID)
    ?? extra.bannerAdUnitId;
  if (explicit && String(explicit).trim()) return String(explicit).trim();
  // Dev-only mode requested via env → use Google Test IDs.
  if (DEV_ONLY_ADS) {
    return platform === 'android' ? TEST_BANNER_ID_ANDROID : TEST_BANNER_ID_IOS;
  }
  // DEFAULT: use Production IDs, even in __DEV__ and TestFlight / Internal Testing builds,
  // so that real heartbeat/watchdog behaviour can be verified against live AdMob inventory.
  return platform === 'android' ? PROD_BANNER_ID_ANDROID : PROD_BANNER_ID_IOS;
};

export const getInterstitialAdUnitId = (platform = Platform.OS) => {
  const explicit = env.EXPO_PUBLIC_INTERSTITIAL_AD_UNIT_ID
    ?? (platform === 'ios' ? env.EXPO_PUBLIC_INTERSTITIAL_AD_UNIT_ID_IOS : env.EXPO_PUBLIC_INTERSTITIAL_AD_UNIT_ID_ANDROID)
    ?? extra.interstitialAdUnitId;
  if (explicit && String(explicit).trim()) return String(explicit).trim();
  if (DEV_ONLY_ADS) return null; // No interstitial test path for now to avoid test ad requests
  return platform === 'android' ? PROD_INTERSTITIAL_ID_ANDROID : PROD_INTERSTITIAL_ID_IOS;
};

export const BANNER_AD_UNIT_ID = getBannerAdUnitId();
