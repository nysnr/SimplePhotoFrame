import { Platform } from 'react-native';
import Constants from 'expo-constants';

const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};

// ENABLE_ADS: default true unless explicitly set to 'false'
// Prefer Expo public env vars; fallback to legacy names
const ENABLE_ADS_RAW = env.EXPO_PUBLIC_ENABLE_ADS ?? extra.enableAds ?? env.ENABLE_ADS ?? 'true';
export const ENABLE_ADS = String(ENABLE_ADS_RAW).toLowerCase() !== 'false';

// Use platform-specific ad unit IDs in production, while keeping Google test units in dev.
const getConfiguredAdUnitId = () => {
  if (Platform.OS === 'ios') {
    return env.EXPO_PUBLIC_BANNER_AD_UNIT_ID_IOS
      ?? env.EXPO_PUBLIC_BANNER_AD_UNIT_ID
      ?? extra.bannerAdUnitIdIos
      ?? extra.bannerAdUnitId
      ?? env.BANNER_AD_UNIT_ID_IOS
      ?? env.BANNER_AD_UNIT_ID;
  }
  if (Platform.OS === 'android') {
    return env.EXPO_PUBLIC_BANNER_AD_UNIT_ID_ANDROID
      ?? env.EXPO_PUBLIC_BANNER_AD_UNIT_ID
      ?? extra.bannerAdUnitIdAndroid
      ?? extra.bannerAdUnitId
      ?? env.BANNER_AD_UNIT_ID_ANDROID
      ?? env.BANNER_AD_UNIT_ID;
  }
  return env.EXPO_PUBLIC_BANNER_AD_UNIT_ID ?? extra.bannerAdUnitId ?? env.BANNER_AD_UNIT_ID;
};

const getAdUnitId = () => {
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  if (isDev) {
    return Platform.OS === 'ios'
      ? 'ca-app-pub-3940256099942544/2934735716' // iOS test banner
      : 'ca-app-pub-3940256099942544/6300978111'; // Android test banner
  }

  const idRaw = getConfiguredAdUnitId();
  if (!idRaw) return null;
  const id = String(idRaw).trim();
  if (!id) return null;
  if (
    id === 'ca-app-pub-3940256099942544/2934735716'
    || id === 'ca-app-pub-3940256099942544/6300978111'
  ) {
    return null;
  }
  return id;
};

export const BANNER_AD_UNIT_ID = getAdUnitId();
