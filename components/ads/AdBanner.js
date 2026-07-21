import React, { useEffect, useState } from 'react';
import { View, Text, Platform, InteractionManager } from 'react-native';
import Constants from 'expo-constants';
import { ENABLE_ADS, BANNER_AD_UNIT_ID } from '../../config/adsConfig';

/**
 * Reusable Google Mobile Ads banner with:
 * - ENABLE_ADS flag support
 * - Placeholder area retained when disabled or offline
 * - Exponential backoff retries up to 3
 * - Deferred mounting to reduce initial load
 * - Web-safe: avoids importing native module on web
 */
export default function AdBanner({
  height = 50,
  bannerSize = Platform.OS === 'ios' ? 'adaptive' : 'adaptive',
  delayMs = 1200,
  style,
}) {
  const DEV = typeof __DEV__ !== 'undefined' && __DEV__;
  const [shouldLoad, setShouldLoad] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [BannerAdComp, setBannerAdComp] = useState(null);
  const [BannerAdSize, setBannerAdSize] = useState(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [debugStatus, setDebugStatus] = useState('init');
  const isExpoGo = Constants?.executionEnvironment === 'storeClient';
  const adDebug = !!Constants?.expoConfig?.extra?.adDebug;
  const shouldShowPlaceholder = DEV && (
    Platform.OS === 'web'
    || isExpoGo
    || !ENABLE_ADS
    || !BANNER_AD_UNIT_ID
    || !BannerAdComp
  );

  const placeholderText = (() => {
    if (Platform.OS === 'web') return 'Ad Placeholder (web)';
    if (isExpoGo) return 'Ad Placeholder (Expo Go)';
    if (!ENABLE_ADS) return 'Ad Placeholder (disabled)';
    if (!BANNER_AD_UNIT_ID) return 'Ad Placeholder (missing unit id)';
    return 'Ad Placeholder';
  })();

  useEffect(() => {
    if (Platform.OS === 'web') {
      setDebugStatus('ads:web');
      return;
    }
    if (isExpoGo) {
      setDebugStatus('ads:expo-go');
      return;
    }
    if (!ENABLE_ADS) {
      setDebugStatus('ads:disabled');
      return;
    }
    if (!BANNER_AD_UNIT_ID) {
      setDebugStatus('ads:missing-unit-id');
      return;
    }
    setDebugStatus('ads:waiting-sdk');
  }, [isExpoGo]);

  // Avoid importing native module on web entirely
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (isExpoGo) return;
    let mounted = true;
    try {
      // Dynamic import to avoid bundling issues in Expo Go
      import('react-native-google-mobile-ads')
        .then(mod => {
          if (!mounted) return;
          if (mod?.BannerAd && mod?.BannerAdSize) {
            setBannerAdComp(() => mod.BannerAd);
            setBannerAdSize(mod.BannerAdSize);
            setDebugStatus((prev) => (prev === 'ads:missing-unit-id' ? prev : 'ads:sdk-ready'));
          }
        })
        .catch(err => {
          setDebugStatus('ads:import-failed');
          if (DEV) console.log('AdMob import failed (expected in Expo Go):', err);
        });
    } catch (e) {
      setDebugStatus('ads:import-error');
      if (DEV) console.log('AdMob dynamic import error:', e);
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let t;
    InteractionManager.runAfterInteractions(() => {
      t = setTimeout(() => {
        setShouldLoad(true);
        if (Platform.OS === 'web' || isExpoGo) return;
        if (!ENABLE_ADS) {
          setDebugStatus('ads:disabled');
          return;
        }
        if (!BANNER_AD_UNIT_ID) {
          setDebugStatus('ads:missing-unit-id');
          return;
        }
        setDebugStatus('ads:requesting');
      }, delayMs);
    });
    return () => {
      if (t) clearTimeout(t);
    };
  }, [delayMs]);

  const handleFail = (error) => {
    const errorCode = error?.code ? String(error.code).toLowerCase() : 'unknown';
    if (retryCount >= 3) return;
    const next = retryCount + 1;
    setRetryCount(next);
    setDebugStatus(`ads:failed:${errorCode}:retry-${next}`);
    const backoff = Math.min(8000, 1000 * Math.pow(2, next - 1)); // 1s, 2s, 4s
    setTimeout(() => setReloadKey((k) => k + 1), backoff);
  };

  useEffect(() => {
    if (retryCount >= 3 && !adLoaded) {
      setDebugStatus((prev) => prev.startsWith('ads:failed:') ? `${prev}:max` : 'ads:failed:max');
    }
  }, [retryCount, adLoaded]);

  if (shouldShowPlaceholder) {
    return (
      <View style={[{ height, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' }, style]}>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' }}>
          {placeholderText}
        </Text>
        {adDebug && (
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 4 }}>
            {debugStatus}
          </Text>
        )}
      </View>
    );
  }

  // Keep space even if ads disabled
  if (!ENABLE_ADS) {
    return <View style={[{ height }, style]} />;
  }

  // Web/ExpoGo preview: keep a placeholder without attempting to load native module
  if (Platform.OS === 'web' || isExpoGo) {
    return <View style={[{ height }, style]} />;
  }

  if (!BANNER_AD_UNIT_ID) {
    return (
      <View style={[{ height, justifyContent: 'center', alignItems: 'center' }, style]}>
        {adDebug && (
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>
            {debugStatus}
          </Text>
        )}
      </View>
    );
  }

  // Map our bannerSize to library constants
  const mapSize = () => {
    if (!BannerAdSize) return null;
    switch (bannerSize) {
      case 'banner':
        return BannerAdSize.BANNER;
      case 'largeBanner':
        return BannerAdSize.LARGE_BANNER;
      case 'mediumRectangle':
        return BannerAdSize.MEDIUM_RECTANGLE;
      case 'fullBanner':
        return BannerAdSize.FULL_BANNER;
      case 'leaderboard':
        return BannerAdSize.LEADERBOARD;
      case 'adaptive':
      default:
        return BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
    }
  };

  const sizeConst = mapSize();

  return (
    <View style={[{ height }, style]}>
      {adDebug && !adLoaded && (
        <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>
            {debugStatus}
          </Text>
        </View>
      )}
      {shouldLoad && BannerAdComp && sizeConst && (
        <BannerAdComp
          key={reloadKey}
          unitId={BANNER_AD_UNIT_ID}
          size={sizeConst}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdLoaded={() => {
            setAdLoaded(true);
            setDebugStatus('ads:loaded');
          }}
          onAdFailedToLoad={handleFail}
        />
      )}
    </View>
  );
}
