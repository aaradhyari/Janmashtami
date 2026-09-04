import { BLOCK_IDS, type BlockId, type EventState, type FloorId } from './types';
import { RIDDLES } from './riddles';
import { getBlockElapsed } from './time';

/**
 * Pure event transitions. Each takes the previous state + a single `now`
 * timestamp and returns the next state. The React store wraps these with
 * persistence + BroadcastChannel sync; tests exercise them directly.
 */

export function startFloor(prev: EventState, floorId: FloorId, now: number): EventState {
  return {
    ...prev,
    activeFloorId: floorId,
    floors: prev.floors.map((f) =>
      f.id !== floorId
        ? f
        : {
            ...f,
            sharedStartTimestamp: now,
            blocks: BLOCK_IDS.map((b) => ({
              id: b,
              status: 'RUNNING' as const,
              accumulatedMs: 0,
              runStartStamp: now,
              pauseStamp: null,
            })),
          },
    ),
  };
}

export function startBlock(
  prev: EventState,
  floorId: FloorId,
  blockId: BlockId,
  now: number,
): EventState {
  return {
    ...prev,
    floors: prev.floors.map((f) =>
      f.id !== floorId
        ? f
        : {
            ...f,
            sharedStartTimestamp: f.sharedStartTimestamp ?? now,
            blocks: f.blocks.map((b) =>
              b.id !== blockId || b.status !== 'READY'
                ? b
                : {
                    ...b,
                    status: 'RUNNING' as const,
                    accumulatedMs: 0,
                    runStartStamp: now,
                    pauseStamp: null,
                  },
            ),
          },
    ),
  };
}

export function pauseBlock(
  prev: EventState,
  floorId: FloorId,
  blockId: BlockId,
  now: number,
): EventState {
  return {
    ...prev,
    floors: prev.floors.map((f) => {
      if (f.id !== floorId) return f;
      const blocks = f.blocks.map((b) => {
        if (b.id !== blockId || b.status !== 'RUNNING') return b;
        return {
          ...b,
          status: 'PAUSED' as const,
          accumulatedMs: getBlockElapsed(b, now),
          runStartStamp: null,
          pauseStamp: now,
        };
      });
      // All 3 blocks paused -> auto-finalize the floor at the frozen times.
      const allPaused = blocks.every((b) => b.status === 'PAUSED');
      return {
        ...f,
        blocks: allPaused
          ? blocks.map((b) => ({
              ...b,
              status: 'FINALIZED' as const,
              pauseStamp: null,
            }))
          : blocks,
      };
    }),
  };
}

export function resumeBlock(
  prev: EventState,
  floorId: FloorId,
  blockId: BlockId,
  now: number,
): EventState {
  return {
    ...prev,
    floors: prev.floors.map((f) => {
      if (f.id !== floorId) return f;
      // Re-sync to the shared floor clock so the resumed block matches the
      // other blocks. Falls back to the preserved time when the floor has no
      // shared start timestamp (e.g. individually started block).
      const synced =
        f.sharedStartTimestamp !== null
          ? Math.max(0, now - f.sharedStartTimestamp)
          : null;
      return {
        ...f,
        blocks: f.blocks.map((b) =>
          b.id !== blockId || b.status !== 'PAUSED'
            ? b
            : {
                ...b,
                status: 'RUNNING' as const,
                accumulatedMs: synced ?? b.accumulatedMs,
                runStartStamp: now,
                pauseStamp: null,
              },
        ),
      };
    }),
  };
}

export function finalizeBlock(
  prev: EventState,
  floorId: FloorId,
  blockId: BlockId,
  now: number,
): EventState {
  return {
    ...prev,
    floors: prev.floors.map((f) =>
      f.id !== floorId
        ? f
        : {
            ...f,
            blocks: f.blocks.map((b) => {
              if (b.id !== blockId) return b;
              if (b.status === 'FINALIZED' || b.status === 'READY') return b;
              const finalMs =
                b.status === 'RUNNING' ? getBlockElapsed(b, now) : b.accumulatedMs;
              return {
                ...b,
                status: 'FINALIZED' as const,
                accumulatedMs: finalMs,
                runStartStamp: null,
                pauseStamp: null,
              };
            }),
          },
    ),
  };
}

export function resetBlock(prev: EventState, floorId: FloorId, blockId: BlockId): EventState {
  return {
    ...prev,
    floors: prev.floors.map((f) =>
      f.id !== floorId
        ? f
        : {
            ...f,
            blocks: f.blocks.map((b) =>
              b.id !== blockId
                ? b
                : {
                    ...b,
                    status: 'READY' as const,
                    accumulatedMs: 0,
                    runStartStamp: null,
                    pauseStamp: null,
                  },
            ),
            sharedStartTimestamp: f.blocks.every((b) =>
              b.id === blockId ? true : b.status === 'READY',
            )
              ? null
              : f.sharedStartTimestamp,
          },
    ),
  };
}

export function resetFloor(prev: EventState, floorId: FloorId): EventState {
  return {
    ...prev,
    activeFloorId: prev.activeFloorId === floorId ? null : prev.activeFloorId,
    floors: prev.floors.map((f) =>
      f.id !== floorId
        ? f
        : {
            ...f,
            sharedStartTimestamp: null,
            blocks: BLOCK_IDS.map((b) => ({
              id: b,
              status: 'READY' as const,
              accumulatedMs: 0,
              runStartStamp: null as number | null,
              pauseStamp: null as number | null,
            })),
          },
    ),
  };
}

/* ---------------- display-wall riddles ---------------- */

/** Push a riddle to the display wall (question hidden-answer first). */
export function showRiddle(prev: EventState, index: number): EventState {
  if (index < 0 || index >= RIDDLES.length) return prev;
  return { ...prev, displayRiddle: { index, showAnswer: false } };
}

/** Reveal or hide the answer of the currently displayed riddle. */
export function revealRiddleAnswer(prev: EventState, show: boolean): EventState {
  if (!prev.displayRiddle) return prev;
  return { ...prev, displayRiddle: { ...prev.displayRiddle, showAnswer: show } };
}

/** Remove the riddle — display returns to timers. */
export function hideRiddle(prev: EventState): EventState {
  if (!prev.displayRiddle) return prev;
  return { ...prev, displayRiddle: null };
}
