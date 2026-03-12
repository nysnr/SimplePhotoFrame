import { Platform } from 'react-native';

const env = (typeof process !== 'undefined' && process.env) ? process.env : {};

// ENABLE_ADS: default true unless explicitly set to 'false'
// Prefer Expo public env vars; fallback to legacy names
const ENABLE_ADS_RAW = env.EXPO_PUBLIC_ENABLE_ADS ?? env.ENABLE_ADS ?? 'true';
export const ENABLE_ADS = String(ENABLE_ADS_RAW).toLowerCase() !== 'false';

// Use provided ad unit ID, fallback to Google test units for dev
const getAdUnitId = () => {
  // Safety check: Always use Test IDs in development to prevent AdMob account bans
  // __DEV__ is a global variable in React Native that is true during development
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return Platform.OS === 'ios'
      ? 'ca-app-pub-3940256099942544/2934735716' // iOS test banner
      : 'ca-app-pub-3940256099942544/6300978111'; // Android test banner
  }

  return (env.EXPO_PUBLIC_BANNER_AD_UNIT_ID ?? env.BANNER_AD_UNIT_ID) ?? (
    Platform.OS === 'ios'
      ? 'ca-app-pub-3940256099942544/2934735716'
      : 'ca-app-pub-3940256099942544/6300978111'
  );
};

export const BANNER_AD_UNIT_ID = getAdUnitId();