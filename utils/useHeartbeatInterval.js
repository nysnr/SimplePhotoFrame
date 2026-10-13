import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'spf:debug:ad-heartbeat-ms';

export const HEARTBEAT_PRESETS = [
  { labelSec: 30, ms: 30_000, labelShort: '30s' },
  { labelSec: 60, ms: 60_000, labelShort: '1m' },
  { labelSec: 120, ms: 120_000, labelShort: '2m' },
  { labelSec: 180, ms: 180_000, labelShort: '3m' },
  { labelSec: 300, ms: 300_000, labelShort: '5m' },
  { labelSec: 600, ms: 600_000, labelShort: '10m', default: true },
];

export const DEFAULT_HEARTBEAT_MS = HEARTBEAT_PRESETS.find(p => p.default).ms;

export default function useHeartbeatInterval() {
  const [intervalMs, setIntervalMsState] = useState(DEFAULT_HEARTBEAT_MS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (raw == null) {
          setIntervalMsState(DEFAULT_HEARTBEAT_MS);
        } else {
          const parsed = Number(raw);
          if (Number.isFinite(parsed) && parsed > 10_000 && parsed <= 60 * 60_000) {
            setIntervalMsState(parsed);
          } else {
            setIntervalMsState(DEFAULT_HEARTBEAT_MS);
          }
        }
      } catch (e) {
        if (!mounted) return;
        setIntervalMsState(DEFAULT_HEARTBEAT_MS);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setIntervalMs = async (nextMs) => {
    let clamped;
    if (!Number.isFinite(nextMs) || nextMs < 10_000) {
      clamped = DEFAULT_HEARTBEAT_MS;
    } else {
      clamped = Math.min(60 * 60_000, nextMs);
    }
    setIntervalMsState(clamped);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(clamped));
    } catch (e) {
      // ignore persistence errors
    }
    return clamped;
  };

  const presets = useMemo(() => HEARTBEAT_PRESETS, []);

  return {
    ready,
    intervalMs,
    setIntervalMs,
    presets,
    selectedPreset: presets.find(p => p.ms === intervalMs) ?? null,
  };
}
