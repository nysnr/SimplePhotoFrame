import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Platform, InteractionManager, AppState, useWindowDimensions } from 'react-native';
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
  height,
  bannerSize = 'adaptive',
  delayMs = 1200,
  style,
  screenName = 'unknown',
  onHeightChange,
}) {
  const DEV = typeof __DEV__ !== 'undefined' && __DEV__;
  const bannerRef = useRef(null);
  const previousLayoutKeyRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [BannerAdComp, setBannerAdComp] = useState(null);
  const [BannerAdSize, setBannerAdSize] = useState(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adHeight, setAdHeight] = useState(null);
  const [debugStatus, setDebugStatus] = useState('init');
  const isExpoGo = Constants?.executionEnvironment === 'storeClient';
  const adDebug = !!Constants?.expoConfig?.extra?.adDebug;
  const effectiveBannerSize = useMemo(() => {
    if (bannerSize !== 'adaptive') return bannerSize;
    // Google Mobile Ads calculates an anchored adaptive size from the actual
    // available width.  Do not force LEADERBOARD on iPad: it is 728px wide and
    // can fail in Split View or when a modal's available width changes.
    return 'adaptive';
  }, [bannerSize]);
  const layoutKey = `${effectiveBannerSize}:${Math.round(containerWidth || windowWidth)}`;
  const resolvedHeight = useMemo(() => {
    if (typeof height === 'number') return height;
    if (typeof adHeight === 'number' && adHeight > 0) return adHeight;
    if (effectiveBannerSize === 'leaderboard') return 90;
    if (effectiveBannerSize === 'largeBanner') return 100;
    if (effectiveBannerSize === 'mediumRectangle') return 250;
    // Reserve a standard banner's height until the SDK reports the adaptive
    // height. This avoids a layout jump while never clipping a loaded ad.
    if (effectiveBannerSize === 'fullBanner') return 60;
    return 50;
  }, [adHeight, effectiveBannerSize, height]);
  const shouldShowPlaceholder = DEV && (
    Platform.OS === 'web'
    || isExpoGo
    || !ENABLE_ADS
    || !BANNER_AD_UNIT_ID
    || !BannerAdComp
  );

  useEffect(() => {
    onHeightChange?.(resolvedHeight);
  }, [onHeightChange, resolvedHeight]);

  const placeholderText = (() => {
    if (Platform.OS === 'web') return 'Ad Placeholder (web)';
    if (isExpoGo) return 'Ad Placeholder (Expo Go)';
    if (!ENABLE_ADS) return 'Ad Placeholder (disabled)';
    if (!BANNER_AD_UNIT_ID) return 'Ad Placeholder (missing unit id)';
    return 'Ad Placeholder';
  })();

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

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

  useEffect(() => {
    if (Platform.OS !== 'ios' || isExpoGo || !ENABLE_ADS) return undefined;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' || !shouldLoad) return;
      setAdLoaded(false);
      setDebugStatus('ads:foreground-reload');
      if (typeof bannerRef.current?.load === 'function') {
        bannerRef.current.load();
        return;
      }
      setReloadKey((k) => k + 1);
    });
    return () => subscription.remove();
  }, [isExpoGo, shouldLoad]);

  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGo || !ENABLE_ADS || !BANNER_AD_UNIT_ID || !shouldLoad || !BannerAdComp) {
      previousLayoutKeyRef.current = layoutKey;
      return undefined;
    }
    if (previousLayoutKeyRef.current == null) {
      previousLayoutKeyRef.current = layoutKey;
      return undefined;
    }
    if (previousLayoutKeyRef.current === layoutKey) {
      return undefined;
    }
    previousLayoutKeyRef.current = layoutKey;
    setAdLoaded(false);
    setAdHeight(null);
    setRetryCount(0);
    setDebugStatus(`ads:layout-change:${layoutKey}`);
    const timeout = setTimeout(() => {
      if (typeof bannerRef.current?.load === 'function') {
        bannerRef.current.load();
        return;
      }
      setReloadKey((k) => k + 1);
    }, 250);
    return () => clearTimeout(timeout);
  }, [BANNER_AD_UNIT_ID, BannerAdComp, isExpoGo, layoutKey, shouldLoad]);

  const handleFail = (error) => {
    const errorCode = error?.code ? String(error.code).toLowerCase() : 'unknown';
    setAdLoaded(false);
    const next = retryCount + 1;
    setRetryCount(next);
    setDebugStatus(`ads:failed:${errorCode}:retry-${next}`);
    if (DEV || adDebug) {
      console.warn(`[ads][${screenName}] failed to load (${errorCode}); retry ${next}`, error);
    }
    const backoff = next <= 3
      ? Math.min(8000, 1000 * Math.pow(2, next - 1))
      : 30000;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    retryTimeoutRef.current = setTimeout(() => {
      retryTimeoutRef.current = null;
      setReloadKey((k) => k + 1);
    }, backoff);
  };

  useEffect(() => {
    if (retryCount >= 3 && !adLoaded) {
      setDebugStatus((prev) => prev.startsWith('ads:failed:') ? `${prev}:slow-retry` : 'ads:failed:slow-retry');
    }
  }, [retryCount, adLoaded]);

  if (shouldShowPlaceholder) {
    return (
      <View style={[{ height: resolvedHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' }, style]}>
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
    return <View style={[{ height: resolvedHeight }, style]} />;
  }

  // Web/ExpoGo preview: keep a placeholder without attempting to load native module
  if (Platform.OS === 'web' || isExpoGo) {
    return <View style={[{ height: resolvedHeight }, style]} />;
  }

  if (!BANNER_AD_UNIT_ID) {
    return (
      <View style={[{ height: resolvedHeight, justifyContent: 'center', alignItems: 'center' }, style]}>
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
    switch (effectiveBannerSize) {
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
    <View
      onLayout={(event) => {
        const nextWidth = Math.floor(event.nativeEvent.layout.width);
        if (nextWidth > 0 && nextWidth !== containerWidth) {
          setContainerWidth(nextWidth);
        }
      }}
      style={[{ height: resolvedHeight, width: '100%', justifyContent: 'center' }, style]}
    >
      {adDebug && !adLoaded && (
        <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>
            {debugStatus}
          </Text>
        </View>
      )}
      {shouldLoad && BannerAdComp && sizeConst && (
        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <BannerAdComp
            ref={bannerRef}
            key={reloadKey}
            unitId={BANNER_AD_UNIT_ID}
            size={sizeConst}
            width={Math.floor(containerWidth || windowWidth)}
            requestOptions={{ requestNonPersonalizedAdsOnly: false }}
            onAdLoaded={(dimensions) => {
              if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
              }
              setRetryCount(0);
              setAdLoaded(true);
              if (dimensions?.height > 0) setAdHeight(dimensions.height);
              setDebugStatus(`ads:loaded:${layoutKey}`);
            }}
            onSizeChange={(dimensions) => {
              if (dimensions?.height > 0) setAdHeight(dimensions.height);
            }}
            onAdFailedToLoad={handleFail}
          />
        </View>
      )}
    </View>
  );
}
