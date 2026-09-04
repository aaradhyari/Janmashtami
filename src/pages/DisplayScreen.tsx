import { useMemo } from 'react';
import FestiveBackground from '../components/FestiveBackground';
import StatusBadge from '../components/StatusBadge';
import TimerDisplay from '../components/TimerDisplay';
import { useEventStore, useNow } from '../lib/store';
import { getBlockElapsed } from '../lib/time';
import { finalizedCount, floorStatus } from '../lib/types';
import { cn } from '../lib/cn';

const CARD_RING: Record<string, string> = {
  READY: 'ring-white/10',
  RUNNING: 'ring-[#22C55E]/50 shadow-[0_0_60px_-12px_rgba(34,197,94,0.45)]',
  PAUSED: 'ring-[#FACC15]/50 shadow-[0_0_60px_-12px_rgba(250,204,21,0.35)]',
  FINALIZED: 'ring-[#8B5CF6]/60 shadow-[0_0_60px_-12px_rgba(139,92,246,0.5)]',
};

function HandiMark({ className }: { className?: string }) {
  // Stylised matki (earthen pot) mark — geometric, premium, not cartoonish.
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <ellipse cx="24" cy="10" rx="10" ry="3.5" fill="none" stroke="#FACC15" strokeWidth="2.5" />
      <path
        d="M12 14 C12 30 18 40 24 40 C30 40 36 30 36 14"
        fill="none"
        stroke="#F97316"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M16 22 h16 M15 28 h18" stroke="#EC4899" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
      <circle cx="24" cy="4.5" r="2" fill="#06B6D4" />
    </svg>
  );
}

export default function DisplayScreen() {
  const { event, config } = useEventStore();
  const now = useNow(150);

  const activeFloor = useMemo(() => {
    const byId = event.floors.find((f) => f.id === event.activeFloorId);
    if (byId && floorStatus(byId) !== 'IDLE') return byId;
    return event.floors.find((f) => floorStatus(f) === 'RUNNING') ?? null;
  }, [event]);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#0F172A] text-[#FFF7ED]">
      <FestiveBackground />

      <div className="relative z-10 flex h-full flex-col px-[3vw] py-[2.2vh]">
        {/* header */}
        <header className="flex items-center justify-center gap-4">
          <HandiMark className="h-[4.5vh] w-[4.5vh] shrink-0" />
          <div className="text-center">
            <h1 className="text-[2.4vh] font-bold tracking-[0.35em] text-[#FACC15]">
              {config.eventName}
            </h1>
            <div className="mx-auto mt-1 h-px w-[38vw] bg-gradient-to-r from-transparent via-[#8B5CF6]/70 to-transparent" />
          </div>
          <HandiMark className="h-[4.5vh] w-[4.5vh] shrink-0 -scale-x-100" />
        </header>

        {!activeFloor ? (
          /* ---------------- WAITING STATE ---------------- */
          <main className="anim-fade-in flex flex-1 flex-col items-center justify-center text-center">
            <div className="anim-float-slow">
              <HandiMark className="h-[14vh] w-[14vh] opacity-90" />
            </div>
            <p className="mt-6 text-[3.2vh] font-semibold tracking-[0.3em] text-[#FFF7ED]/60">
              WAITING FOR NEXT FLOOR
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="anim-pulse-dot h-3 w-3 rounded-full bg-[#22C55E]" />
              <span className="text-[1.8vh] tracking-[0.25em] text-[#FFF7ED]/40">
                STANDBY · DISPLAY LIVE
              </span>
            </div>
          </main>
        ) : (
          /* ---------------- ACTIVE FLOOR ---------------- */
          <main className="flex min-h-0 flex-1 flex-col">
            <div className="mt-[1.2vh] text-center">
              <h2
                key={activeFloor.id}
                className="anim-card-in text-[5.5vh] font-bold leading-none tracking-[0.12em]"
              >
                {config.floorNames[activeFloor.id]}
              </h2>
              {floorStatus(activeFloor) === 'COMPLETE' ? (
                <div className="anim-complete mt-[1vh] inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#FACC15] via-[#F97316] to-[#EC4899] px-[2.5vw] py-[0.8vh]">
                  <span className="text-[2.6vh] font-bold tracking-[0.25em] text-[#0F172A]">
                    ✦ FLOOR COMPLETE ✦
                  </span>
                </div>
              ) : (
                <p className="mt-[0.6vh] text-[1.7vh] tracking-[0.4em] text-[#FFF7ED]/50">
                  {finalizedCount(activeFloor) > 0
                    ? `${finalizedCount(activeFloor)} / 3 FINALIZED`
                    : 'LIVE TIMING'}
                </p>
              )}
            </div>

            <div className="mt-[2vh] grid min-h-0 flex-1 grid-cols-3 gap-[2vw]">
              {activeFloor.blocks.map((block, i) => {
                const elapsed = getBlockElapsed(block, now);
                const label = config.blockNames[block.id];
                return (
                  <section
                    key={`${activeFloor.id}-${block.id}-${block.status === 'FINALIZED' ? 'f' : 'l'}`}
                    className={cn(
                      'anim-card-in flex min-h-0 flex-col items-center justify-center rounded-[1.5vw] bg-white/[0.04] px-4 py-[2vh] ring-2 backdrop-blur-sm',
                      CARD_RING[block.status],
                      i === 0 && 'stagger-1',
                      i === 1 && 'stagger-2',
                      i === 2 && 'stagger-3',
                      block.status === 'FINALIZED' && 'anim-finalize',
                    )}
                  >
                    <h3 className="text-[2.6vh] font-semibold tracking-[0.3em] text-[#06B6D4]">
                      {label}
                    </h3>
                    <div className="my-[1.5vh]">
                      <TimerDisplay
                        elapsedMs={elapsed}
                        size="xl"
                        dimmed={block.status === 'READY'}
                        highlight={block.status === 'FINALIZED'}
                      />
                    </div>
                    <StatusBadge status={block.status} size="lg" pulse />
                  </section>
                );
              })}
            </div>
          </main>
        )}

        {/* footer strip */}
        <footer className="flex items-center justify-between pt-[1.5vh] text-[1.4vh] tracking-[0.3em] text-[#FFF7ED]/35">
          <span>DAHI HANDI · LIVE</span>
          <span className="hidden sm:inline">🪔 SHUBH JANMASHTAMI 🪔</span>
          <span className="flex items-center gap-2">
            <span className="anim-pulse-dot inline-block h-2 w-2 rounded-full bg-[#EF4444]" />
            ON AIR
          </span>
        </footer>
      </div>
    </div>
  );
}
