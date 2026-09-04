import type { BlockState } from './types';

/**
 * Timestamp-based stopwatch helpers.
 *
 * The stored timestamps are the source of truth. UI ticking (setInterval /
 * requestAnimationFrame) only re-renders — it never mutates timer values.
 */

/** GET → SET → GO intro played on the wall before a floor's timers kick in. */
export const FLOOR_COUNTDOWN_MS = 2400;
export const COUNTDOWN_STEP_MS = 800;

/** Auto-riddle shown on the wall right after GO: question first, then answer. */
export const RIDDLE_QUESTION_MS = 8000;
export const RIDDLE_ANSWER_MS = 7000;
export const RIDDLE_SHOW_MS = RIDDLE_QUESTION_MS + RIDDLE_ANSWER_MS;

/** Live elapsed ms for a block at reference time `now`. */
export function getBlockElapsed(block: BlockState, now: number): number {
  switch (block.status) {
    case 'READY':
      return 0;
    case 'RUNNING':
      if (block.runStartStamp === null) return block.accumulatedMs;
      return block.accumulatedMs + Math.max(0, now - block.runStartStamp);
    case 'PAUSED':
    case 'FINALIZED':
      return block.accumulatedMs;
  }
}

/** Format elapsed ms as MM:SS, or H:MM:SS once past an hour. Floor at whole seconds. */
export function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, elapsedMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

/** Compact "1h 04m" style label for summaries. */
export function formatElapsedShort(elapsedMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, elapsedMs) / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m < 60) return `${m}m ${String(s).padStart(2, '0')}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, '0')}m`;
}
