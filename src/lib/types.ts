/** Core data model for JANMASHTAMI — DAHI HANDI timing system. */

export type BlockStatus = 'READY' | 'RUNNING' | 'PAUSED' | 'FINALIZED';

export type FloorId = 'floor-1' | 'floor-2' | 'floor-3' | 'floor-4';
export type BlockId = 'A' | 'B' | 'C';

export interface BlockState {
  id: BlockId;
  status: BlockStatus;
  /** Frozen elapsed ms. For RUNNING this is the base; live elapsed = accumulatedMs + (now - runStartStamp). */
  accumulatedMs: number;
  /** Timestamp (Date.now()) when the current running segment started. Null unless RUNNING. */
  runStartStamp: number | null;
  /** Timestamp of the last pause, for audit/recovery display. Null unless PAUSED. */
  pauseStamp: number | null;
}

export interface FloorState {
  id: FloorId;
  /** Shared timestamp created when START FLOOR was pressed. All 3 blocks derive t=0 from this. */
  sharedStartTimestamp: number | null;
  blocks: BlockState[];
}

export type FloorDerivedStatus = 'IDLE' | 'RUNNING' | 'COMPLETE';

export interface EventState {
  activeFloorId: FloorId | null;
  floors: FloorState[];
  /** Riddle pushed to the display wall. Null = display shows timers. */
  displayRiddle: { index: number; showAnswer: boolean } | null;
  /** Last mutation timestamp — used for sync + recovery ordering. */
  updatedAt: number;
}

export interface EventConfig {
  eventName: string;
  blockNames: Record<BlockId, string>;
  floorNames: Record<FloorId, string>;
}

export const FLOOR_IDS: FloorId[] = ['floor-1', 'floor-2', 'floor-3', 'floor-4'];
export const BLOCK_IDS: BlockId[] = ['A', 'B', 'C'];

export const FLOOR_INDEX: Record<FloorId, number> = {
  'floor-1': 1,
  'floor-2': 2,
  'floor-3': 3,
  'floor-4': 4,
};

export function createInitialEvent(now: number = Date.now()): EventState {
  return {
    activeFloorId: null,
    displayRiddle: null,
    updatedAt: now,
    floors: FLOOR_IDS.map((id) => ({
      id,
      sharedStartTimestamp: null,
      blocks: BLOCK_IDS.map((b) => ({
        id: b,
        status: 'READY' as BlockStatus,
        accumulatedMs: 0,
        runStartStamp: null,
        pauseStamp: null,
      })),
    })),
  };
}

export function createDefaultConfig(): EventConfig {
  return {
    eventName: 'JANMASHTAMI — DAHI HANDI',
    blockNames: { A: 'BLOCK A', B: 'BLOCK B', C: 'BLOCK C' },
    floorNames: {
      'floor-1': 'FLOOR 1',
      'floor-2': 'FLOOR 2',
      'floor-3': 'FLOOR 3',
      'floor-4': 'FLOOR 4',
    },
  };
}

/** Derived floor status: COMPLETE when all 3 finalized, RUNNING when anything started, else IDLE. */
export function floorStatus(floor: FloorState): FloorDerivedStatus {
  if (floor.blocks.every((b) => b.status === 'FINALIZED')) return 'COMPLETE';
  if (
    floor.sharedStartTimestamp !== null ||
    floor.blocks.some((b) => b.status !== 'READY')
  )
    return 'RUNNING';
  return 'IDLE';
}

export function isFloorActive(floor: FloorState): boolean {
  const s = floorStatus(floor);
  return s === 'RUNNING';
}

export function finalizedCount(floor: FloorState): number {
  return floor.blocks.filter((b) => b.status === 'FINALIZED').length;
}
