// Hybrid env + secrets config for Expo/EAS
module.exports = ({ config }) => {
  // Safely load local .env when available; EAS will provide process.env
  try {
    require('dotenv').config();
  } catch {}

  const base = require('./app.json');
  const env = process.env || {};
  // EAS eager bundling runs with NODE_ENV=production even for non-production profiles.
  // Limit strict ad-ID validation to the actual EAS production profile.
  const buildProfile = env.EAS_BUILD_PROFILE || '';
  const appVariant = env.APP_VARIANT || buildProfile || 'production';
  const isProdBuild = buildProfile === 'production';
  const isPreviewBuild = appVariant === 'preview';
  const buildPlatform = env.EAS_BUILD_PLATFORM || env.EXPO_OS || null;
  const baseAppName = base.expo?.name || 'SimplePhotoFrame';
  const baseIosBundleId = base.expo?.ios?.bundleIdentifier || 'com.nysnr.photoframenew';
  const previewAppName = `${baseAppName} Preview`;
  const previewBundleId = `${baseIosBundleId}.preview`;
  const iosDeploymentTarget = '15.1';
  const supportedLocalizations = ['en-US', 'en', 'ja', 'es', 'zh-Hans'];
  const localeFiles = {
    'en-US': './locales/en.json',
    en: './locales/en.json',
    ja: './locales/ja.json',
    es: './locales/es.json',
    'zh-Hans': './locales/zh-Hans.json',
  };
  const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
  const TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';
  const TEST_ANDROID_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
  const TEST_IOS_BANNER_ID = 'ca-app-pub-3940256099942544/2934735716';

  // Secret (not exposed at runtime): used to configure Android/iOS via library
  const googleAdsAppId = isPreviewBuild
    ? TEST_ANDROID_APP_ID
    : env.GOOGLE_MOBILE_ADS_APP_ID
    || (base['react-native-google-mobile-ads']?.android_app_id)
    || TEST_ANDROID_APP_ID;
  const iosGoogleAdsAppId = isPreviewBuild
    ? TEST_IOS_APP_ID
    : env.GOOGLE_MOBILE_ADS_IOS_APP_ID
    || (base['react-native-google-mobile-ads']?.ios_app_id)
    || TEST_IOS_APP_ID;

  // Non-secret toggle; default true
  const delayInitRaw = env.DELAY_APP_MEASUREMENT_INIT ?? base['react-native-google-mobile-ads']?.delay_app_measurement_init ?? true;
  const delayInit = typeof delayInitRaw === 'string' ? delayInitRaw.toLowerCase() === 'true' : !!delayInitRaw;
  const adDebugRaw = env.EXPO_PUBLIC_AD_DEBUG ?? (env.EAS_BUILD_PROFILE === 'production' ? 'false' : 'true');
  const adDebug = String(adDebugRaw).toLowerCase() === 'true';

  // Public runtime values: Expo exposes EXPO_PUBLIC_* to the app
  const enableAdsRaw = env.EXPO_PUBLIC_ENABLE_ADS ?? base.expo?.extra?.enableAds ?? 'true';
  const enableAds = String(enableAdsRaw).toLowerCase() !== 'false';
  const iosBannerAdUnitIdRaw = env.EXPO_PUBLIC_BANNER_AD_UNIT_ID_IOS
    ?? env.EXPO_PUBLIC_BANNER_AD_UNIT_ID
    ?? base.expo?.extra?.bannerAdUnitIdIos
    ?? base.expo?.extra?.bannerAdUnitId
    ?? undefined;
  const androidBannerAdUnitIdRaw = env.EXPO_PUBLIC_BANNER_AD_UNIT_ID_ANDROID
    ?? env.EXPO_PUBLIC_BANNER_AD_UNIT_ID
    ?? base.expo?.extra?.bannerAdUnitIdAndroid
    ?? base.expo?.extra?.bannerAdUnitId
    ?? undefined;
  const iosBannerAdUnitId = isPreviewBuild
    ? TEST_IOS_BANNER_ID
    : (iosBannerAdUnitIdRaw ? String(iosBannerAdUnitIdRaw).trim() : undefined);
  const androidBannerAdUnitId = isPreviewBuild
    ? TEST_ANDROID_BANNER_ID
    : (androidBannerAdUnitIdRaw ? String(androidBannerAdUnitIdRaw).trim() : undefined);
  const photoLibraryPermissionText = 'SimplePhotoFrame needs access to your photo library so you can choose photos and display them in a slideshow. For example, you can select family or travel photos to show in the app with an optional clock overlay.';

  const testBannerIds = new Set([
    'ca-app-pub-3940256099942544/6300978111',
    'ca-app-pub-3940256099942544/2934735716',
  ]);
  const isInvalidBannerId = (id) => !id || testBannerIds.has(id);

  if (isProdBuild && enableAds) {
    const issues = [];
    if (buildPlatform === 'android') {
      if (isInvalidBannerId(androidBannerAdUnitId)) {
        issues.push('EXPO_PUBLIC_BANNER_AD_UNIT_ID_ANDROID');
      }
      if (googleAdsAppId === 'ca-app-pub-3940256099942544~3347511713') {
        issues.push('GOOGLE_MOBILE_ADS_APP_ID');
      }
    } else if (buildPlatform === 'ios') {
      if (isInvalidBannerId(iosBannerAdUnitId)) {
        issues.push('EXPO_PUBLIC_BANNER_AD_UNIT_ID_IOS');
      }
      if (iosGoogleAdsAppId === 'ca-app-pub-3940256099942544~1458002511') {
        issues.push('GOOGLE_MOBILE_ADS_IOS_APP_ID');
      }
    } else {
      if (isInvalidBannerId(iosBannerAdUnitId) && isInvalidBannerId(androidBannerAdUnitId)) {
        issues.push('EXPO_PUBLIC_BANNER_AD_UNIT_ID_IOS or EXPO_PUBLIC_BANNER_AD_UNIT_ID_ANDROID');
      }
      if (googleAdsAppId === 'ca-app-pub-3940256099942544~3347511713') {
        issues.push('GOOGLE_MOBILE_ADS_APP_ID');
      }
      if (iosGoogleAdsAppId === 'ca-app-pub-3940256099942544~1458002511') {
        issues.push('GOOGLE_MOBILE_ADS_IOS_APP_ID');
      }
    }
    if (issues.length) {
      throw new Error(`[config] Production build with ads enabled requires non-test IDs. Missing/invalid: ${issues.join(', ')}`);
    }
  }

  const finalExpo = {
    ...base.expo,
    name: isPreviewBuild ? previewAppName : baseAppName,
    ios: {
      ...(base.expo?.ios || {}),
      bundleIdentifier: isPreviewBuild ? previewBundleId : baseIosBundleId,
      infoPlist: {
        ...(base.expo?.ios?.infoPlist || {}),
        CFBundleAllowMixedLocalizations: true,
        CFBundleDevelopmentRegion: 'en',
        CFBundleLocalizations: supportedLocalizations,
        ...(isPreviewBuild ? { CFBundleDisplayName: previewAppName } : {}),
      },
    },
    locales: localeFiles,
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: iosDeploymentTarget,
          },
        },
      ],
      [
        'expo-localization',
        {
          // Optional: You can configure localization settings here if needed
        }
      ],
      [
        'expo-media-library',
        {
          photosPermission: photoLibraryPermissionText,
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
      adDebug,
      appVariant,
      bannerAdUnitId: iosBannerAdUnitId || androidBannerAdUnitId || null,
      bannerAdUnitIdIos: iosBannerAdUnitId || null,
      bannerAdUnitIdAndroid: androidBannerAdUnitId || null,
      // preserve existing EAS metadata
      eas: base.expo?.extra?.eas,
    },
  };

  // A dynamic Expo config returns the Expo object itself. Returning app.json's
  // outer wrapper makes Expo ignore its root-level keys and emit a warning.
  return finalExpo;
};
