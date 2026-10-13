import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CLOCK_MOVE_INTERVAL_MS = 60 * 60 * 1000;
export const CLOCK_POSITIONS = [
  'bottom-center', 'bottom-left', 'top-left',
  'top-center', 'top-right', 'bottom-right',
];
const STORAGE_KEY = 'simplephotoframe.moveClockPosition';

export function getClockPosition(elapsedMs) {
  const step = Math.floor(Math.max(0, elapsedMs) / CLOCK_MOVE_INTERVAL_MS);
  return CLOCK_POSITIONS[step % CLOCK_POSITIONS.length];
}

export function getClockPlacement(position) {
  const [vertical, horizontal] = position.split('-');
  return {
    [vertical]: 0,
    ...(horizontal === 'center'
      ? { alignSelf: 'center' }
      : { [horizontal]: 0 }),
  };
}

export function getClockFontScale(areaHeight, timeSize, dateSize, fontScale = 1) {
  if (areaHeight <= 0) return 1;
  // Allow for line height, padding, borders and the gap between time and date.
  const textHeight = (timeSize + dateSize) * 1.3 * fontScale;
  return textHeight > 0 ? Math.min(1, Math.max(0, areaHeight - 30) / textHeight) : 1;
}

export default function useClockMovement(active, nowMs) {
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const pendingWrite = useRef(Promise.resolve());

  useEffect(() => {
    let disposed = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!disposed) setEnabled(value !== 'false');
      })
      .catch((error) => console.warn('Clock movement preference could not be read', error))
      .finally(() => {
        if (!disposed) setReady(true);
      });
    return () => { disposed = true; };
  }, []);

  const toggle = useCallback(() => {
    if (!ready) return;
    const next = !enabled;
    setEnabled(next);
    // Serialize writes so rapid toggles cannot persist an older selection last.
    pendingWrite.current = pendingWrite.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, String(next)))
      .catch((error) => console.warn('Clock movement preference could not be saved', error));
  }, [enabled, ready]);

  useEffect(() => {
    // Restart from bottom-center when starting a slideshow or enabling movement.
    setStartedAt(active && enabled ? Date.now() : null);
  }, [active, enabled]);

  const position = active && enabled && startedAt !== null
    ? getClockPosition(nowMs - startedAt)
    : CLOCK_POSITIONS[0];

  return { enabled, ready, toggle, position };
}
