// Hybrid env + secrets config for Expo/EAS
module.exports = ({ config }) => {
  // Safely load local .env when available; EAS will provide process.env
  try {
    require('dotenv').config();
  } catch {}

  const base = require('./app.json');
  const env = process.env || {};
  const isProdBuild = env.EAS_BUILD_PROFILE === 'production' || env.NODE_ENV === 'production';

  // Secret (not exposed at runtime): used to configure Android/iOS via library
  const googleAdsAppId = env.GOOGLE_MOBILE_ADS_APP_ID
    || (base['react-native-google-mobile-ads']?.android_app_id)
    || 'ca-app-pub-3940256099942544~3347511713';
  const iosGoogleAdsAppId = env.GOOGLE_MOBILE_ADS_IOS_APP_ID
    || (base['react-native-google-mobile-ads']?.ios_app_id)
    || 'ca-app-pub-3940256099942544~1458002511';

  // Non-secret toggle; default true
  const delayInitRaw = env.DELAY_APP_MEASUREMENT_INIT ?? base['react-native-google-mobile-ads']?.delay_app_measurement_init ?? true;
  const delayInit = typeof delayInitRaw === 'string' ? delayInitRaw.toLowerCase() === 'true' : !!delayInitRaw;

  // Public runtime values: Expo exposes EXPO_PUBLIC_* to the app
  const enableAdsRaw = env.EXPO_PUBLIC_ENABLE_ADS ?? base.expo?.extra?.enableAds ?? 'true';
  const enableAds = String(enableAdsRaw).toLowerCase() !== 'false';
  const bannerAdUnitIdRaw = env.EXPO_PUBLIC_BANNER_AD_UNIT_ID ?? base.expo?.extra?.bannerAdUnitId ?? undefined;
  const bannerAdUnitId = bannerAdUnitIdRaw ? String(bannerAdUnitIdRaw).trim() : undefined;

  if (isProdBuild && enableAds) {
    const issues = [];
    const testBannerIds = new Set([
      'ca-app-pub-3940256099942544/6300978111',
      'ca-app-pub-3940256099942544/2934735716',
    ]);
    if (!bannerAdUnitId || testBannerIds.has(bannerAdUnitId)) {
      issues.push('EXPO_PUBLIC_BANNER_AD_UNIT_ID');
    }
    if (googleAdsAppId === 'ca-app-pub-3940256099942544~3347511713') {
      issues.push('GOOGLE_MOBILE_ADS_APP_ID');
    }
    if (iosGoogleAdsAppId === 'ca-app-pub-3940256099942544~1458002511') {
      issues.push('GOOGLE_MOBILE_ADS_IOS_APP_ID');
    }
    if (issues.length) {
      throw new Error(`[config] Production build with ads enabled requires non-test IDs. Missing/invalid: ${issues.join(', ')}`);
    }
  }

  const finalExpo = {
    ...base.expo,
    plugins: [
      [
        'expo-localization',
        {
          // Optional: You can configure localization settings here if needed
        }
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: googleAdsAppId,
          iosAppId: iosGoogleAdsAppId,
          delayAppMeasurementInit: delayInit,
          optimizeInitialization: true,
          optimizeAdLoading: true,
        },
      ],
    ],
    extra: {
      ...(base.expo?.extra || {}),
      enableAds,
      bannerAdUnitId: bannerAdUnitId || null,
      // preserve existing EAS metadata
      eas: base.expo?.extra?.eas,
    },
  };

  return {
    ...base,
    expo: finalExpo,
  };
};
