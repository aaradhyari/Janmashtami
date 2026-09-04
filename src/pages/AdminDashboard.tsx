import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog, { type ConfirmSpec } from '../components/ConfirmDialog';
import FestiveBackground from '../components/FestiveBackground';
import StatusBadge from '../components/StatusBadge';
import TimerDisplay from '../components/TimerDisplay';
import { useEventStore, useNow } from '../lib/store';
import { formatElapsed, getBlockElapsed } from '../lib/time';
import {
  FLOOR_INDEX,
  finalizedCount,
  floorStatus,
  type BlockId,
  type BlockState,
  type FloorId,
  type FloorState,
} from '../lib/types';
import { cn } from '../lib/cn';

interface Selection {
  floorId: FloorId;
  blockId: BlockId;
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
}

export default function AdminDashboard() {
  const store = useEventStore();
  const { event, config } = store;
  const now = useNow(200);
  const [confirm, setConfirm] = useState<ConfirmSpec | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);

  const activeFloor: FloorState | null = useMemo(() => {
    const byId = event.floors.find((f) => f.id === event.activeFloorId) ?? null;
    if (byId && floorStatus(byId) !== 'IDLE') return byId;
    return event.floors.find((f) => floorStatus(f) === 'RUNNING') ?? null;
  }, [event]);

  const otherActiveName = (exclude: FloorId): string | null => {
    const other = event.floors.find(
      (f) => f.id !== exclude && floorStatus(f) === 'RUNNING',
    );
    return other ? config.floorNames[other.id] : null;
  };

  /* ---------- floor flows ---------- */

  const requestStartFloor = (floorId: FloorId) => {
    const floor = event.floors.find((f) => f.id === floorId);
    if (!floor) return;
    const status = floorStatus(floor);
    const other = otherActiveName(floorId);
    const name = config.floorNames[floorId];

    if (status !== 'IDLE') {
      setConfirm({
        title: `Restart ${name}?`,
        message: `${name} already has timer data.\nStarting again will reset all three blocks to 00:00.`,
        confirmLabel: `RESTART ${name}`,
        tone: 'danger',
        onConfirm: () => {
          store.startFloor(floorId);
          setConfirm(null);
        },
      });
      return;
    }
    if (other) {
      setConfirm({
        title: `${other} is currently active`,
        message: `${other} is currently active.\n\nStart ${name}?`,
        confirmLabel: `START ${name}`,
        tone: 'start',
        onConfirm: () => {
          store.startFloor(floorId);
          setConfirm(null);
        },
      });
      return;
    }
    store.startFloor(floorId);
  };

  const requestResetFloor = (floorId: FloorId) => {
    const name = config.floorNames[floorId];
    setConfirm({
      title: `Reset ${name}?`,
      message: `This will reset all three block timers of ${name} to 00:00 READY.`,
      confirmLabel: 'RESET',
      tone: 'danger',
      onConfirm: () => {
        store.resetFloor(floorId);
        setConfirm(null);
      },
    });
  };

  /* ---------- block flows ---------- */

  const requestFinalize = (floor: FloorState, block: BlockState) => {
    const elapsed = getBlockElapsed(block, now);
    const label = config.blockNames[block.id];
    setConfirm({
      title: `Finalize ${label}?`,
      message: `Finalize ${label} at ${formatElapsed(elapsed)}?\nThis permanently freezes the time.`,
      confirmLabel: 'FINALIZE',
      tone: 'celebrate',
      onConfirm: () => {
        store.finalizeBlock(floor.id, block.id);
        setConfirm(null);
      },
    });
  };

  const requestResetBlock = (floor: FloorState, block: BlockState) => {
    const label = config.blockNames[block.id];
    setConfirm({
      title: `Reset ${label}?`,
      message: `Reset ${label} on ${config.floorNames[floor.id]} to 00:00 READY?`,
      confirmLabel: 'RESET',
      tone: 'danger',
      onConfirm: () => {
        store.resetBlock(floor.id, block.id);
        setConfirm(null);
      },
    });
  };

  /* ---------- keyboard controls ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || confirm) return;
      if (e.key >= '1' && e.key <= '4') {
        const floor = event.floors[Number(e.key) - 1];
        if (floor) requestStartFloor(floor.id);
        return;
      }
      if (e.key === ' ' && selected) {
        e.preventDefault();
        const floor = event.floors.find((f) => f.id === selected.floorId);
        const block = floor?.blocks.find((b) => b.id === selected.blockId);
        if (!floor || !block) return;
        if (block.status === 'RUNNING') store.pauseBlock(floor.id, block.id);
        else if (block.status === 'PAUSED') store.resumeBlock(floor.id, block.id);
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && selected) {
        const floor = event.floors.find((f) => f.id === selected.floorId);
        const block = floor?.blocks.find((b) => b.id === selected.blockId);
        if (floor && block && block.status !== 'READY') requestResetBlock(floor, block);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, selected, confirm, config]);

  const systemStatus = !activeFloor
    ? 'STANDBY'
    : floorStatus(activeFloor) === 'COMPLETE'
      ? 'FLOOR COMPLETE'
      : 'RUNNING';

  return (
    <div className="relative min-h-screen bg-[#0F172A] text-[#FFF7ED]">
      <FestiveBackground density="light" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        {/* ---------- status header ---------- */}
        <header className="overflow-hidden rounded-2xl bg-white/[0.05] ring-1 ring-white/10 backdrop-blur">
          <div className="h-1 bg-gradient-to-r from-[#2563EB] via-[#8B5CF6] via-[#EC4899] to-[#FACC15]" />
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.3em] text-[#FACC15]">
                {config.eventName}
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-wide">
                EVENT CONTROL DASHBOARD
              </h1>
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="text-[10px] tracking-[0.25em] text-[#FFF7ED]/50">
                  ACTIVE FLOOR
                </dt>
                <dd className="font-timer text-lg font-bold text-[#06B6D4]">
                  {activeFloor ? config.floorNames[activeFloor.id] : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.25em] text-[#FFF7ED]/50">
                  SYSTEM STATUS
                </dt>
                <dd
                  className={cn(
                    'text-lg font-bold',
                    systemStatus === 'RUNNING' && 'text-[#4ADE80]',
                    systemStatus === 'STANDBY' && 'text-[#FFF7ED]/60',
                    systemStatus === 'FLOOR COMPLETE' && 'text-[#FACC15]',
                  )}
                >
                  {systemStatus}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.25em] text-[#FFF7ED]/50">
                  BLOCKS FINALIZED
                </dt>
                <dd className="font-timer text-lg font-bold">
                  {activeFloor ? `${finalizedCount(activeFloor)} / 3` : '—'}
                </dd>
              </div>
            </dl>
            <nav className="ml-auto flex flex-wrap gap-2 text-sm font-semibold">
              <a
                href="/display"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#2563EB] px-4 py-2.5 transition hover:bg-[#1D4ED8]"
              >
                ⛶ OPEN DISPLAY
              </a>
              <a
                href="/setup"
                className="rounded-xl bg-white/10 px-4 py-2.5 transition hover:bg-white/20"
              >
                ⚙ SETUP
              </a>
            </nav>
          </div>
        </header>

        {/* ---------- floors ---------- */}
        <main className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          {event.floors.map((floor) => {
            const status = floorStatus(floor);
            const isActive = activeFloor?.id === floor.id;
            const fname = config.floorNames[floor.id];
            return (
              <section
                key={floor.id}
                aria-label={fname}
                className={cn(
                  'overflow-hidden rounded-2xl bg-white/[0.04] ring-1 backdrop-blur transition',
                  isActive ? 'ring-[#FACC15]/60' : 'ring-white/10',
                  status === 'COMPLETE' && 'ring-[#22C55E]/50',
                )}
              >
                {/* floor header */}
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-timer flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] text-base font-bold">
                      {FLOOR_INDEX[floor.id]}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold tracking-[0.1em]">{fname}</h2>
                      <p className="text-[11px] tracking-[0.25em] text-[#FFF7ED]/50">
                        {status === 'IDLE' && 'READY TO START'}
                        {status === 'RUNNING' && (isActive ? '● LIVE NOW' : '● IN PROGRESS')}
                        {status === 'COMPLETE' && '✓ COMPLETE'}
                      </p>
                    </div>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => requestStartFloor(floor.id)}
                      className="rounded-xl bg-gradient-to-r from-[#F97316] to-[#EC4899] px-5 py-3 text-sm font-bold tracking-wide shadow-lg shadow-[#F97316]/25 transition hover:brightness-110 active:scale-[0.98]"
                    >
                      ▶ START {fname}
                    </button>
                    <button
                      onClick={() => requestResetFloor(floor.id)}
                      className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-[#FFF7ED]/80 transition hover:bg-[#EF4444]/25 hover:text-white active:scale-[0.98]"
                      title={`Reset ${fname}`}
                    >
                      ⟲ RESET
                    </button>
                  </div>
                </div>

                {/* blocks */}
                <div className="grid grid-cols-3 gap-3 px-5 pb-5">
                  {floor.blocks.map((block) => (
                    <BlockCard
                      key={block.id}
                      floor={floor}
                      block={block}
                      now={now}
                      blockLabel={config.blockNames[block.id]}
                      isSelected={
                        selected?.floorId === floor.id && selected?.blockId === block.id
                      }
                      onSelect={() =>
                        setSelected({ floorId: floor.id, blockId: block.id })
                      }
                      onPause={() => store.pauseBlock(floor.id, block.id)}
                      onResume={() => store.resumeBlock(floor.id, block.id)}
                      onStart={() => store.startBlock(floor.id, block.id)}
                      onFinalize={() => requestFinalize(floor, block)}
                      onReset={() => requestResetBlock(floor, block)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </main>

        {/* ---------- footer ---------- */}
        <footer className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-white/[0.03] px-5 py-4 text-xs text-[#FFF7ED]/55 ring-1 ring-white/10">
          <span className="font-semibold tracking-wider text-[#FFF7ED]/80">
            KEYBOARD
          </span>
          <span>
            <Kbd>1</Kbd>–<Kbd>4</Kbd> start floor
          </span>
          <span>
            <Kbd>Space</Kbd> pause / resume selected block
          </span>
          <span>
            <Kbd>R</Kbd> reset selected block
          </span>
          <span className="ml-auto">Click a block card to select it · sync via BroadcastChannel + localStorage</span>
          <button
            onClick={() =>
              setConfirm({
                title: 'Reset entire event?',
                message:
                  'This clears ALL floors, ALL blocks and the active floor.\nUse only between events.',
                confirmLabel: 'RESET EVERYTHING',
                tone: 'danger',
                onConfirm: () => {
                  store.resetAll();
                  setSelected(null);
                  setConfirm(null);
                },
              })
            }
            className="rounded-lg px-2 py-1 font-semibold text-[#EF4444]/80 transition hover:bg-[#EF4444]/15 hover:text-[#EF4444]"
          >
            Reset entire event
          </button>
        </footer>
      </div>

      {confirm && (
        <ConfirmDialog spec={confirm} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="font-timer mx-0.5 rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#FFF7ED] ring-1 ring-white/15">
      {children}
    </kbd>
  );
}

/* ================= BlockCard ================= */

function BlockCard({
  floor,
  block,
  now,
  blockLabel,
  isSelected,
  onSelect,
  onPause,
  onResume,
  onStart,
  onFinalize,
  onReset,
}: {
  floor: FloorState;
  block: BlockState;
  now: number;
  blockLabel: string;
  isSelected: boolean;
  onSelect: () => void;
  onPause: () => void;
  onResume: () => void;
  onStart: () => void;
  onFinalize: () => void;
  onReset: () => void;
}) {
  const elapsed = getBlockElapsed(block, now);

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex min-h-[13rem] cursor-pointer flex-col items-center justify-between gap-2 rounded-xl bg-[#0F172A]/70 px-2 py-4 text-center ring-1 transition',
        block.status === 'RUNNING' && 'ring-[#22C55E]/50',
        block.status === 'PAUSED' && 'ring-[#FACC15]/50',
        block.status === 'FINALIZED' && 'ring-[#8B5CF6]/60',
        block.status === 'READY' && 'ring-white/10',
        isSelected
          ? 'ring-2 ring-[#06B6D4] ring-offset-2 ring-offset-[#0F172A]'
          : 'outline-none',
      )}
      role="button"
      tabIndex={0}
      aria-label={`${blockLabel} ${block.status} ${formatElapsed(elapsed)}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect();
      }}
    >
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#06B6D4]">
          {blockLabel}
        </p>
        <div className="mt-2">
          <TimerDisplay
            elapsedMs={elapsed}
            dimmed={block.status === 'READY'}
            highlight={block.status === 'FINALIZED'}
            textClass="text-[1.7rem] sm:text-3xl"
          />
        </div>
        <div className="mt-2">
          <StatusBadge status={block.status} size="sm" pulse />
        </div>
      </div>

      <div className="flex w-full flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
        {block.status === 'RUNNING' && (
          <button
            onClick={onPause}
            className="w-full rounded-lg bg-[#FACC15] px-2 py-2.5 text-xs font-bold text-[#0F172A] transition hover:bg-[#FDE047] active:scale-[0.98]"
          >
            ⏸ PAUSE
          </button>
        )}
        {block.status === 'PAUSED' && (
          <>
            <button
              onClick={onResume}
              className="w-full rounded-lg bg-[#22C55E] px-2 py-2.5 text-xs font-bold text-[#0F172A] transition hover:bg-[#4ADE80] active:scale-[0.98]"
            >
              ▶ RESUME
            </button>
            <button
              onClick={onFinalize}
              className="w-full rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] px-2 py-2.5 text-xs font-bold transition hover:brightness-110 active:scale-[0.98]"
            >
              ✓ FINALIZE TIME
            </button>
          </>
        )}
        {block.status === 'READY' &&
          (floor.sharedStartTimestamp !== null ? (
            <button
              onClick={onStart}
              className="w-full rounded-lg bg-[#2563EB] px-2 py-2.5 text-xs font-bold transition hover:bg-[#1D4ED8] active:scale-[0.98]"
            >
              ▶ START
            </button>
          ) : (
            <p className="py-1 text-[11px] tracking-widest text-[#FFF7ED]/40">READY</p>
          ))}
        {block.status === 'FINALIZED' && (
          <p className="font-timer py-0.5 text-[11px] font-semibold text-[#C4B5FD]">
            ✓ {formatElapsed(elapsed)}
          </p>
        )}
        {block.status !== 'READY' && (
          <button
            onClick={onReset}
            className="w-full rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#FFF7ED]/45 transition hover:bg-[#EF4444]/20 hover:text-[#FCA5A5]"
            title={`Reset ${blockLabel}`}
          >
            ⟲ reset
          </button>
        )}
      </div>
    </div>
  );
}
