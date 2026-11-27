#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const createBackup = args.has('--backup');
const dryRun = args.has('--dry-run');
const backupRoot = path.join(root, '_sync_backups', new Date().toISOString().replace(/[:.]/g, '-'));
const touchedFiles = new Set();
const plannedFiles = new Set();

function readText(relativePath) {
  const filePath = path.join(root, relativePath);
  return fs.readFileSync(filePath, 'utf8');
}

function writeText(relativePath, content) {
  plannedFiles.add(relativePath);
  if (dryRun) return;
  const filePath = path.join(root, relativePath);
  maybeBackup(relativePath);
  fs.writeFileSync(filePath, content, 'utf8');
}

function maybeBackup(relativePath) {
  if (!createBackup || touchedFiles.has(relativePath)) return;
  const sourcePath = path.join(root, relativePath);
  if (!fs.existsSync(sourcePath)) return;
  const backupPath = path.join(backupRoot, relativePath);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(sourcePath, backupPath);
  touchedFiles.add(relativePath);
}

function ensureIncludes(text, needle, insertAfter) {
  if (text.includes(needle)) return text;
  if (!text.includes(insertAfter)) {
    throw new Error(`insert point not found for: ${needle}`);
  }
  return text.replace(insertAfter, `${insertAfter}\n${needle}`);
}

function replaceExact(text, searchValue, replaceValue, label) {
  if (text.includes(replaceValue)) return text;
  if (!text.includes(searchValue)) {
    throw new Error(`pattern not found for ${label}`);
  }
  return text.replace(searchValue, replaceValue);
}

function ensureBlock(text, block, insertAfter, label) {
  if (text.includes(block.trim())) return text;
  if (!text.includes(insertAfter)) {
    throw new Error(`insert point not found for ${label}`);
  }
  return text.replace(insertAfter, `${insertAfter}\n${block}`);
}

function updateAppJs() {
  const relativePath = 'App.js';
  let text = readText(relativePath);

  text = ensureIncludes(
    text,
    "import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';",
    "import { getLocales } from 'expo-localization';"
  );

  const block = `  useEffect(() => {
    const tag = 'slideshow';
    if (showSlideshow) {
      activateKeepAwakeAsync(tag).catch(() => {});
    } else {
      deactivateKeepAwake(tag).catch(() => {});
    }
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, [showSlideshow]);
`;

  text = ensureBlock(
    text,
    block,
    "  const closeButtonTimer = useRef(null);\n",
    relativePath
  );

  writeText(relativePath, text);
}

function updateAppConfigJs() {
  const relativePath = 'app.config.js';
  let text = readText(relativePath);

  text = replaceExact(
    text,
    "  const isProdBuild = env.EAS_BUILD_PROFILE === 'production' || env.NODE_ENV === 'production';",
    "  const isProdBuild = env.EAS_BUILD_PROFILE === 'production';",
    `${relativePath}:isProdBuild`
  );

  text = replaceExact(
    text,
    "    const testBannerIds = new Set([\n      'ca-app-pub-3940256099942544/6300978111',\n      'ca-app-pub-3940256099942544/2934735716',\n    ]);",
    "    const testBannerIds = new Set([\n      'ca-app-pub-3940256099942544/6300978111',\n      'ca-app-pub-3940256099942544/2934735716',\n      'ca-app-pub-3940256099942544/9214589741',\n      'ca-app-pub-3940256099942544/2435281174',\n    ]);",
    `${relativePath}:testBannerIds`
  );

  writeText(relativePath, text);
}

function updateAdsConfigJs() {
  const relativePath = path.join('config', 'adsConfig.js');
  const content = `import { Platform } from 'react-native';
import Constants from 'expo-constants';

const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
const extra = Constants?.expoConfig?.extra ?? Constants?.manifest2?.extra ?? Constants?.manifest?.extra ?? {};

// ENABLE_ADS: default true unless explicitly set to 'false'
// Prefer Expo public env vars; fallback to legacy names
const ENABLE_ADS_RAW = env.EXPO_PUBLIC_ENABLE_ADS ?? extra.enableAds ?? env.ENABLE_ADS ?? 'true';
export const ENABLE_ADS = String(ENABLE_ADS_RAW).toLowerCase() !== 'false';

const normalizeId = (value) => {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower === 'null' || lower === 'undefined') return null;
  return s;
};

const isValidAdUnitId = (value) => /^ca-app-pub-\\d{16}\\/\\d{10}$/.test(value);

// Use provided ad unit ID, fallback to Google test units for dev
const getAdUnitId = () => {
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  const testId = Platform.OS === 'ios'
    ? 'ca-app-pub-3940256099942544/2934735716'
    : 'ca-app-pub-3940256099942544/6300978111';
  if (isDev) return testId;

  const idRaw = (env.EXPO_PUBLIC_BANNER_AD_UNIT_ID ?? extra.bannerAdUnitId ?? env.BANNER_AD_UNIT_ID);
  const id = normalizeId(idRaw);
  if (!id || !isValidAdUnitId(id)) {
    return testId;
  }
  return id;
};

export const BANNER_AD_UNIT_ID = getAdUnitId();
`;

  writeText(relativePath, content);
}

function updateAdBannerJs() {
  const relativePath = path.join('components', 'ads', 'AdBanner.js');
  const content = `import React, { useEffect, useState } from 'react';
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
  const TEST_BANNER_IDS = new Set([
    'ca-app-pub-3940256099942544/2934735716',
    'ca-app-pub-3940256099942544/6300978111',
    'ca-app-pub-3940256099942544/2435281174',
    'ca-app-pub-3940256099942544/9214589741',
  ]);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [adLoaded, setAdLoaded] = useState(false);
  const [lastError, setLastError] = useState('');
  const [BannerAdComp, setBannerAdComp] = useState(null);
  const [BannerAdSize, setBannerAdSize] = useState(null);
  const isExpoGo = Constants?.executionEnvironment === 'storeClient';
  const isTestUnitId = !!BANNER_AD_UNIT_ID && TEST_BANNER_IDS.has(BANNER_AD_UNIT_ID);

  const placeholderText = (() => {
    if (Platform.OS === 'web') return 'Ad Placeholder (web)';
    if (isExpoGo) return 'Ad Placeholder (Expo Go)';
    if (!ENABLE_ADS) return 'Ad Placeholder (disabled)';
    if (!BANNER_AD_UNIT_ID) return 'Ad Placeholder (missing unit id)';
    if (!shouldLoad) return 'Ad Placeholder (initializing)';
    if (!BannerAdComp) return 'Ad Placeholder (loading module)';
    if (retryCount > 0) return \`Ad Placeholder (retrying \${retryCount}/3\${lastError ? \`: \${lastError}\` : ''})\`;
    if (adLoaded) return 'Ad Placeholder (loaded)';
    return 'Ad Placeholder';
  })();

  if (Platform.OS === 'web' || isExpoGo) {
    return (
      <View style={[{ height, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' }, style]}>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' }}>
          {placeholderText}
        </Text>
      </View>
    );
  }

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
          }
        })
        .catch(err => {
          if (DEV) console.log('AdMob import failed (expected in Expo Go):', err);
        });
    } catch (e) {
      if (DEV) console.log('AdMob dynamic import error:', e);
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let t;
    InteractionManager.runAfterInteractions(() => {
      t = setTimeout(() => setShouldLoad(true), delayMs);
    });
    return () => {
      if (t) clearTimeout(t);
    };
  }, [delayMs]);

  const handleFail = (error) => {
    const detail = error?.code || error?.message
      ? \`\${error?.code ?? 'unknown'}\${error?.message ? \` \${error.message}\` : ''}\`
      : '';
    setLastError(detail);
    console.log('[AdBanner] onAdFailedToLoad', {
      code: error?.code,
      message: error?.message,
      unitId: BANNER_AD_UNIT_ID,
      isTestUnitId,
      platform: Platform.OS,
    });
    if (retryCount >= 3) return;
    const next = retryCount + 1;
    setRetryCount(next);
    const backoff = Math.min(8000, 1000 * Math.pow(2, next - 1)); // 1s, 2s, 4s
    setTimeout(() => setReloadKey((k) => k + 1), backoff);
  };

  // Map our bannerSize to library constants
  const mapSize = () => {
    if (!BannerAdSize) return null;
    if (BANNER_AD_UNIT_ID === 'ca-app-pub-3940256099942544/2934735716' || BANNER_AD_UNIT_ID === 'ca-app-pub-3940256099942544/6300978111') {
      return BannerAdSize.BANNER;
    }
    if (BANNER_AD_UNIT_ID === 'ca-app-pub-3940256099942544/2435281174' || BANNER_AD_UNIT_ID === 'ca-app-pub-3940256099942544/9214589741') {
      return BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
    }
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

  const showPlaceholder = !adLoaded;
  const canRenderAd = (
    ENABLE_ADS
    && Platform.OS !== 'web'
    && !isExpoGo
    && !!BANNER_AD_UNIT_ID
    && shouldLoad
    && !!BannerAdComp
    && !!sizeConst
  );

  return (
    <View style={[{ height, zIndex: 999 }, style]}>
      {showPlaceholder && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(20,20,20,0.7)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.35)', zIndex: 1000 }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' }}>
            {placeholderText}
          </Text>
        </View>
      )}
      {canRenderAd && (
        <BannerAdComp
          key={reloadKey}
          unitId={BANNER_AD_UNIT_ID}
          size={sizeConst}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdLoaded={() => {
            setAdLoaded(true);
            setLastError('');
          }}
          onAdFailedToLoad={(error) => handleFail(error)}
        />
      )}
    </View>
  );
}
`;

  writeText(relativePath, content);
}

function updatePackageJson() {
  const relativePath = 'package.json';
  const filePath = path.join(root, relativePath);
  plannedFiles.add(relativePath);
  if (dryRun) return;
  maybeBackup(relativePath);
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  pkg.scripts = pkg.scripts || {};
  if (pkg.scripts.postinstall && !pkg.scripts.postinstall.includes('patch-package')) {
    pkg.scripts.postinstall = `${pkg.scripts.postinstall} && patch-package`;
  }
  pkg.scripts['sync:windows-fixes'] = 'node scripts/apply-windows-sync.js';

  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies['expo-keep-awake'] = '~15.0.7';

  fs.writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

function main() {
  updateAppJs();
  updateAppConfigJs();
  updateAdsConfigJs();
  updateAdBannerJs();
  updatePackageJson();

  if (dryRun) {
    console.log('Dry run only. Planned changes for:');
    Array.from(plannedFiles).sort().forEach((file) => console.log(`- ${file}`));
    if (createBackup) {
      console.log(`Backup would be created in ${backupRoot}`);
    }
    console.log('No files were modified.');
    return;
  }

  console.log('Applied known Windows sync fixes to App.js, app.config.js, config/adsConfig.js, components/ads/AdBanner.js, and package.json');
  if (createBackup) {
    console.log(`Created backups in ${backupRoot}`);
  }
  console.log('Next step: run npm install');
}

main();
