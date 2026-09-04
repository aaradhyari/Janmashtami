import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createDefaultConfig,
  createInitialEvent,
  type BlockId,
  type EventConfig,
  type EventState,
  type FloorId,
  type FloorState,
} from './types';
import * as T from './transitions';

const EVENT_KEY = 'janmashtami.event.v1';
const CONFIG_KEY = 'janmashtami.config.v1';
const CHANNEL = 'janmashtami-dahi-handi-v1';

interface SyncMessage {
  kind: 'EVENT' | 'CONFIG';
  state?: EventState;
  config?: EventConfig;
  source: string;
}

/* ---------------- persistence ---------------- */

function isValidEvent(v: unknown): v is EventState {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  if (!Array.isArray(e.floors) || (e.floors as unknown[]).length !== 4) return false;
  if (e.activeFloorId !== null && typeof e.activeFloorId !== 'string') return false;
  return (e.floors as unknown[]).every((f) => {
    if (typeof f !== 'object' || f === null) return false;
    const fl = f as Record<string, unknown>;
    return (
      typeof fl.id === 'string' &&
      (fl.sharedStartTimestamp === null || typeof fl.sharedStartTimestamp === 'number') &&
      Array.isArray(fl.blocks) &&
      (fl.blocks as unknown[]).length === 3
    );
  });
}

function loadEvent(): EventState {
  try {
    const raw = localStorage.getItem(EVENT_KEY);
    if (!raw) return createInitialEvent();
    const parsed: unknown = JSON.parse(raw);
    if (isValidEvent(parsed)) return normalizeEvent(parsed);
    return createInitialEvent();
  } catch {
    return createInitialEvent();
  }
}

/** Backfill fields added after a state was first persisted (never crash on old saves). */
function normalizeEvent(e: EventState): EventState {
  const d = (e as Partial<EventState>).displayRiddle;
  const valid =
    d !== null &&
    typeof d === 'object' &&
    typeof (d as { index?: unknown }).index === 'number' &&
    typeof (d as { showAnswer?: unknown }).showAnswer === 'boolean';
  const cursor = (e as Partial<EventState>).nextRiddleIndex;
  return {
    ...e,
    displayRiddle: valid ? (d as { index: number; showAnswer: boolean }) : null,
    nextRiddleIndex: typeof cursor === 'number' ? cursor : 0,
    floors: e.floors.map((fl) => ({
      ...fl,
      introRiddleIndex:
        typeof (fl as Partial<FloorState>).introRiddleIndex === 'number'
          ? (fl as FloorState).introRiddleIndex
          : null,
    })),
  };
}

function loadConfig(): EventConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return createDefaultConfig();
    const parsed = JSON.parse(raw) as Partial<EventConfig>;
    const def = createDefaultConfig();
    return {
      eventName:
        typeof parsed.eventName === 'string' && parsed.eventName.trim()
          ? parsed.eventName
          : def.eventName,
      blockNames: { ...def.blockNames, ...(parsed.blockNames ?? {}) },
      floorNames: { ...def.floorNames, ...(parsed.floorNames ?? {}) },
    };
  } catch {
    return createDefaultConfig();
  }
}

/* ---------------- context ---------------- */

interface EventStore {
  event: EventState;
  config: EventConfig;
  startFloor: (floorId: FloorId) => void;
  pauseBlock: (floorId: FloorId, blockId: BlockId) => void;
  resumeBlock: (floorId: FloorId, blockId: BlockId) => void;
  startBlock: (floorId: FloorId, blockId: BlockId) => void;
  finalizeBlock: (floorId: FloorId, blockId: BlockId) => void;
  resetBlock: (floorId: FloorId, blockId: BlockId) => void;
  resetFloor: (floorId: FloorId) => void;
  resetAll: () => void;
  showRiddle: (index: number) => void;
  revealRiddleAnswer: (show: boolean) => void;
  hideRiddle: () => void;
  updateConfig: (patch: Partial<EventConfig>) => void;
}

const Ctx = createContext<EventStore | null>(null);

let instanceCounter = 0;

export function EventProvider({ children }: { children: ReactNode }) {
  const [event, setEvent] = useState<EventState>(loadEvent);
  const [config, setConfig] = useState<EventConfig>(loadConfig);
  const sourceRef = useRef(`tab-${Date.now()}-${instanceCounter++}`);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // BroadcastChannel + storage-event subscriptions (cross-tab sync).
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL);
      channelRef.current = channel;
      channel.onmessage = (e: MessageEvent<SyncMessage>) => {
        const msg = e.data;
        if (!msg || msg.source === sourceRef.current) return;
        if (msg.kind === 'EVENT' && msg.state && isValidEvent(msg.state)) {
          setEvent(normalizeEvent(msg.state));
        } else if (msg.kind === 'CONFIG' && msg.config) {
          setConfig(msg.config);
        }
      };
    } catch {
      channelRef.current = null;
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === EVENT_KEY && e.newValue) {
        try {
          const parsed: unknown = JSON.parse(e.newValue);
          if (isValidEvent(parsed)) setEvent(normalizeEvent(parsed));
        } catch {
          /* ignore corrupt payloads */
        }
      } else if (e.key === CONFIG_KEY && e.newValue) {
        try {
          setConfig(JSON.parse(e.newValue) as EventConfig);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      channel?.close();
      channelRef.current = null;
    };
  }, []);

  const publishEvent = useCallback((next: EventState) => {
    try {
      localStorage.setItem(EVENT_KEY, JSON.stringify(next));
    } catch {
      /* storage full/blocked — keep in-memory + broadcast */
    }
    try {
      channelRef.current?.postMessage({
        kind: 'EVENT',
        state: next,
        source: sourceRef.current,
      } satisfies SyncMessage);
    } catch {
      /* BroadcastChannel unavailable — storage event covers other tabs */
    }
  }, []);

  const publishConfig = useCallback((next: EventConfig) => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    try {
      channelRef.current?.postMessage({
        kind: 'CONFIG',
        config: next,
        source: sourceRef.current,
      } satisfies SyncMessage);
    } catch {
      /* ignore */
    }
  }, []);

  const mutate = useCallback(
    (fn: (prev: EventState, now: number) => EventState) => {
      const now = Date.now();
      setEvent((prev) => {
        const next: EventState = { ...fn(prev, now), updatedAt: now };
        publishEvent(next);
        return next;
      });
    },
    [publishEvent],
  );

  const startFloor = useCallback(
    (floorId: FloorId) => {
      mutate((prev, now) => T.startFloor(prev, floorId, now));
    },
    [mutate],
  );

  const pauseBlock = useCallback(
    (floorId: FloorId, blockId: BlockId) => {
      mutate((prev, now) => T.pauseBlock(prev, floorId, blockId, now));
    },
    [mutate],
  );

  const resumeBlock = useCallback(
    (floorId: FloorId, blockId: BlockId) => {
      mutate((prev, now) => T.resumeBlock(prev, floorId, blockId, now));
    },
    [mutate],
  );

  const startBlock = useCallback(
    (floorId: FloorId, blockId: BlockId) => {
      mutate((prev, now) => T.startBlock(prev, floorId, blockId, now));
    },
    [mutate],
  );

  const finalizeBlock = useCallback(
    (floorId: FloorId, blockId: BlockId) => {
      mutate((prev, now) => T.finalizeBlock(prev, floorId, blockId, now));
    },
    [mutate],
  );

  const resetBlock = useCallback(
    (floorId: FloorId, blockId: BlockId) => {
      mutate((prev) => T.resetBlock(prev, floorId, blockId));
    },
    [mutate],
  );

  const resetFloor = useCallback(
    (floorId: FloorId) => {
      mutate((prev) => T.resetFloor(prev, floorId));
    },
    [mutate],
  );

  const resetAll = useCallback(() => {
    const fresh = createInitialEvent();
    publishEvent(fresh);
    setEvent(fresh);
  }, [publishEvent]);

  const showRiddle = useCallback(
    (index: number) => {
      mutate((prev) => T.showRiddle(prev, index));
    },
    [mutate],
  );

  const revealRiddleAnswer = useCallback(
    (show: boolean) => {
      mutate((prev) => T.revealRiddleAnswer(prev, show));
    },
    [mutate],
  );

  const hideRiddle = useCallback(() => {
    mutate((prev) => T.hideRiddle(prev));
  }, [mutate]);

  const updateConfig = useCallback(
    (patch: Partial<EventConfig>) => {
      setConfig((prev) => {
        const next: EventConfig = {
          ...prev,
          ...patch,
          blockNames: { ...prev.blockNames, ...(patch.blockNames ?? {}) },
          floorNames: { ...prev.floorNames, ...(patch.floorNames ?? {}) },
        };
        publishConfig(next);
        return next;
      });
    },
    [publishConfig],
  );

  const value = useMemo<EventStore>(
    () => ({
      event,
      config,
      startFloor,
      pauseBlock,
      resumeBlock,
      startBlock,
      finalizeBlock,
      resetBlock,
      resetFloor,
      resetAll,
      showRiddle,
      revealRiddleAnswer,
      hideRiddle,
      updateConfig,
    }),
    [
      event,
      config,
      startFloor,
      pauseBlock,
      resumeBlock,
      startBlock,
      finalizeBlock,
      resetBlock,
      resetFloor,
      resetAll,
      showRiddle,
      revealRiddleAnswer,
      hideRiddle,
      updateConfig,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEventStore(): EventStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEventStore must be used within <EventProvider>');
  return ctx;
}

/** Re-rendering tick. UI-only: never the source of timer truth. Defaults to 150ms. */
export function useNow(intervalMs = 150): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
