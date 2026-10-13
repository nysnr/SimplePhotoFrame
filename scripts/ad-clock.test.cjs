const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const babel = require('@babel/core');
const React = require('react');
const { create, act } = require('react-test-renderer');

global.IS_REACT_ACT_ENVIRONMENT = true;

// Execute the real hooks/components with native services replaced by test doubles.
function loadSource(relativePath, mocks) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const source = fs.readFileSync(filename, 'utf8').replace(
    "import('react-native-google-mobile-ads')",
    "Promise.resolve(require('react-native-google-mobile-ads'))",
  );
  const { code } = babel.transformSync(source, {
    filename, configFile: false, babelrc: false,
    plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', '__DEV__', code)(
    (id) => mocks[id] ?? require(id), module, module.exports, false,
  );
  return module.exports;
}

function clockModule(initialValue = null) {
  const storage = new Map();
  const key = 'simplephotoframe.moveClockPosition';
  if (initialValue !== null) storage.set(key, initialValue);
  return {
    storage, key,
    ...loadSource('utils/useClockMovement.js', {
      '@react-native-async-storage/async-storage': {
        getItem: async (key) => storage.get(key) ?? null,
        setItem: async (key, value) => { storage.set(key, value); },
      },
    }),
  };
}

test('clock: exact hourly boundaries, six-position order and repeated cycles', () => {
  const { getClockPosition, CLOCK_MOVE_INTERVAL_MS: hour } = clockModule();
  const expected = ['bottom-center', 'bottom-left', 'top-left', 'top-center', 'top-right', 'bottom-right'];
  assert.equal(getClockPosition(-1), expected[0]);
  for (let i = 0; i < 25; i++) {
    assert.equal(getClockPosition(i * hour), expected[i % 6]);
    assert.equal(getClockPosition((i + 1) * hour - 1), expected[i % 6]);
  }
});

test('clock: placement clears the opposite anchors at every position', () => {
  const { getClockPlacement, CLOCK_POSITIONS } = clockModule();
  assert.deepEqual(CLOCK_POSITIONS.map(getClockPlacement), [
    { bottom: 0, alignSelf: 'center' }, { bottom: 0, left: 0 },
    { top: 0, left: 0 }, { top: 0, alignSelf: 'center' },
    { top: 0, right: 0 }, { bottom: 0, right: 0 },
  ]);
});

test('clock: large text fits a short landscape area, including date-only display', () => {
  const { getClockFontScale } = clockModule();
  for (const [height, time, date, fontScale] of [
    [200, 136, 70, 1], [140, 136, 70, 2], [120, 0, 70, 1], [120, 136, 0, 1],
  ]) {
    const scale = getClockFontScale(height, time, date, fontScale);
    assert.ok(scale > 0 && scale <= 1);
    assert.ok((time + date) * 1.3 * fontScale * scale + 30 <= height + 0.001);
  }
  assert.equal(getClockFontScale(500, 60, 30), 1);
  assert.equal(getClockFontScale(0, 60, 30), 1);
});

test('clock hook: default on, elapsed-time catch-up, off/on, restart and persistence', async (t) => {
  const start = 1000000;
  t.mock.timers.enable({ apis: ['Date'], now: start });
  const clock = clockModule();
  const hour = clock.CLOCK_MOVE_INTERVAL_MS;
  let result;
  function Probe({ active, now }) {
    result = clock.default(active, now);
    return null;
  }
  let root;
  await act(async () => { root = create(React.createElement(Probe, { active: true, now: start })); });
  assert.equal(result.enabled, true);
  assert.equal(result.ready, true);
  assert.equal(result.position, 'bottom-center');
  for (let i = 1; i <= 6; i++) {
    t.mock.timers.setTime(start + i * hour);
    await act(async () => root.update(React.createElement(Probe, { active: true, now: Date.now() })));
    assert.equal(result.position, clock.CLOCK_POSITIONS[i % 6]);
  }
  // Catch up after a suspended JS timer, without counting interval callbacks.
  t.mock.timers.setTime(start + 10 * hour);
  await act(async () => root.update(React.createElement(Probe, { active: true, now: Date.now() })));
  assert.equal(result.position, 'top-right');
  await act(async () => result.toggle());
  assert.equal(result.position, 'bottom-center');
  assert.equal(clock.storage.get(clock.key), 'false');
  await act(async () => root.unmount());
  await act(async () => { root = create(React.createElement(Probe, { active: true, now: Date.now() })); });
  assert.equal(result.enabled, false);
  await act(async () => result.toggle());
  assert.equal(result.enabled, true);
  assert.equal(result.position, 'bottom-center');
  assert.equal(clock.storage.get(clock.key), 'true');
  await act(async () => root.update(React.createElement(Probe, { active: false, now: Date.now() })));
  t.mock.timers.setTime(start + 12 * hour);
  await act(async () => root.update(React.createElement(Probe, { active: true, now: Date.now() })));
  assert.equal(result.position, 'bottom-center');
  await act(async () => root.unmount());
});

function bannerModule(os = 'ios', { isReadyReturns = true } = {}) {
  let windowWidth = 1024;
  let mounts = 0;
  let loads = 0;
  let isReady = isReadyReturns;
  let appStateListener;
  const Banner = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      load() { loads++; },
      getIsReady() { return isReady; },
      _setReady(v) { isReady = v; },
    }), []);
    React.useEffect(() => { mounts++; }, []);
    return React.createElement('MockBanner', props);
  });
  const AdBanner = loadSource('components/ads/AdBanner.js', {
    'react-native': {
      View: 'View', Text: 'Text', Platform: { OS: os },
      InteractionManager: { runAfterInteractions: (fn) => { fn(); return { cancel() {} }; } },
      AppState: { addEventListener: (_, fn) => {
        appStateListener = fn;
        return { remove() { appStateListener = null; } };
      } },
      useWindowDimensions: () => ({ width: windowWidth }),
    },
    'expo-constants': { executionEnvironment: 'standalone', expoConfig: { extra: {} } },
    '../../config/adsConfig': { ENABLE_ADS: true, BANNER_AD_UNIT_ID: 'test-unit' },
    'react-native-google-mobile-ads': {
      BannerAd: Banner,
      BannerAdSize: { BANNER: 'BANNER', ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
    },
  }).default;
  return {
    AdBanner,
    counts: () => ({ mounts, loads }),
    resize: (width) => { windowWidth = width; },
    foreground: () => appStateListener('active'),
    setReady: (v) => { isReady = v; },
  };
}

function layout(root, width) {
  root.root.findAllByType('View').find((node) => node.props.onLayout)
    .props.onLayout({ nativeEvent: { layout: { width } } });
}

test('iOS banner: 320x50 centered, no duplicate initial request or rotation reload, retries remain', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 100000 });
  const banner = bannerModule();
  let root;
  const heights = [];
  const props = { mountToken: 1, onHeightChange: (height) => heights.push(height) };
  await act(async () => { root = create(React.createElement(banner.AdBanner, props)); });
  await act(async () => layout(root, 1024));
  await act(async () => t.mock.timers.tick(1200));
  let ad = root.root.findByType('MockBanner');
  assert.equal(ad.props.size, 'BANNER');
  assert.equal(ad.props.width, 320);
  const slot = root.root.findAllByType('View').find((node) => node.props.style?.width === 320);
  assert.equal(slot.props.style.height, 50);
  assert.equal(slot.props.style.alignSelf, 'center');
  assert.deepEqual(heights, [50]);
  await act(async () => t.mock.timers.tick(1000));
  assert.deepEqual(banner.counts(), { mounts: 1, loads: 0 });
  banner.resize(768);
  await act(async () => root.update(React.createElement(banner.AdBanner, props)));
  await act(async () => layout(root, 768));
  await act(async () => t.mock.timers.tick(1000));
  assert.deepEqual(banner.counts(), { mounts: 1, loads: 0 });
  await act(async () => ad.props.onAdFailedToLoad({ code: 'no-fill' }));
  await act(async () => t.mock.timers.tick(2100));
  assert.equal(banner.counts().mounts, 2);
  ad = root.root.findByType('MockBanner');
  await act(async () => ad.props.onAdLoaded({ width: 320, height: 50 }));
  // Within 5-minute window the min-interval guard must skip any load trigger.
  const beforeSkip = banner.counts().loads;
  await act(async () => root.update(React.createElement(banner.AdBanner, { ...props, mountToken: 2 })));
  await act(async () => t.mock.timers.tick(250));
  assert.equal(banner.counts().loads, beforeSkip, 'mountToken change within guard window must be skipped');
  await act(async () => banner.foreground());
  await act(async () => t.mock.timers.tick(100));
  assert.equal(banner.counts().loads, beforeSkip, 'foreground within guard window must be skipped');
  // Now advance past the 5-minute guard window, then apply mountToken change again.
  await act(async () => t.mock.timers.tick(300_000 + 100));
  await act(async () => root.update(React.createElement(banner.AdBanner, { ...props, mountToken: 3 })));
  await act(async () => t.mock.timers.tick(250));
  assert.equal(banner.counts().loads, 1);
  // Wait another 5-minute guard window, then trigger foreground.
  await act(async () => t.mock.timers.tick(300_000 + 100));
  await act(async () => banner.foreground());
  await act(async () => t.mock.timers.tick(100));
  assert.equal(banner.counts().loads, 2);
  await act(async () => layout(root, 300));
  await act(async () => root.update(React.createElement(banner.AdBanner, { ...props, mountToken: 3 })));
  assert.equal(root.root.findAllByType('MockBanner').length, 0);
  await act(async () => root.unmount());
});

test('Android banner retains the adaptive size', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const banner = bannerModule('android');
  let root;
  await act(async () => { root = create(React.createElement(banner.AdBanner)); });
  await act(async () => layout(root, 800));
  await act(async () => t.mock.timers.tick(1200));
  const ad = root.root.findByType('MockBanner');
  assert.equal(ad.props.size, 'ANCHORED_ADAPTIVE_BANNER');
  assert.equal(ad.props.width, 800);
  await act(async () => root.unmount());
});

test('banner: 10-minute heartbeat fires load() via ref and debounces correctly', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 100000 });
  const banner = bannerModule();
  let root;
  await act(async () => { root = create(React.createElement(banner.AdBanner, { mountToken: 1 })); });
  await act(async () => layout(root, 1024));
  await act(async () => t.mock.timers.tick(1200));
  const ad0 = root.root.findByType('MockBanner');
  await act(async () => ad0.props.onAdLoaded({ width: 320, height: 50 }));
  assert.deepEqual(banner.counts(), { mounts: 1, loads: 0 });
  // Simulate 1 heartbeat (10-min interval = 600_000 ms). Advance 600s in one tick.
  await act(async () => t.mock.timers.tick(600_000));
  assert.equal(banner.counts().loads, 1, 'heartbeat tick should invoke bannerRef.load()');
  // Advancing 1 more minute (60_000 ms) must NOT cause a second load (debounce 5-min guard).
  await act(async () => t.mock.timers.tick(60_000));
  assert.equal(banner.counts().loads, 1, 'debounce 5min must prevent a second call within guard window');
  // Advancing 4 more minutes past the 5-min boundary → the next interval tick triggers load again.
  await act(async () => t.mock.timers.tick(600_000 - 60_000));
  assert.ok(banner.counts().loads >= 2, 'second heartbeat should fire after debounce window');
  await act(async () => root.unmount());
});

test('banner: handleFail stops heartbeat, after backoff heartbeat resumes and getIsReady=false swaps instance', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 100000 });
  const banner = bannerModule('ios', { isReadyReturns: true });
  let root;
  await act(async () => { root = create(React.createElement(banner.AdBanner, { mountToken: 1 })); });
  await act(async () => layout(root, 1024));
  await act(async () => t.mock.timers.tick(1200));
  let ad = root.root.findByType('MockBanner');
  await act(async () => ad.props.onAdLoaded({ width: 320, height: 50 }));
  assert.deepEqual(banner.counts(), { mounts: 1, loads: 0 });
  // Fail once to trigger backoff.
  await act(async () => ad.props.onAdFailedToLoad({ code: 'no-fill' }));
  const mountsBefore = banner.counts().mounts;
  // Advance enough time for heartbeat interval (it must NOT fire during backoff).
  await act(async () => t.mock.timers.tick(2_000 + 100));
  assert.equal(banner.counts().mounts, mountsBefore + 1, 'backoff should cause one reloadKey swap');
  // After backoff, heartbeat resumes. Mark the instance dead to force swap.
  ad = root.root.findByType('MockBanner');
  banner.setReady(false);
  const beforeSwapMounts = banner.counts().mounts;
  await act(async () => t.mock.timers.tick(600_000));
  assert.ok(banner.counts().mounts > beforeSwapMounts, 'dead instance triggers a reloadKey swap on heartbeat');
  banner.setReady(true);
  await act(async () => root.unmount());
});
