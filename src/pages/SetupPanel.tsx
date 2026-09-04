import { useState } from 'react';
import FestiveBackground from '../components/FestiveBackground';
import { useEventStore } from '../lib/store';
import { BLOCK_IDS, FLOOR_IDS, type BlockId, type FloorId } from '../lib/types';

export default function SetupPanel() {
  const { config, updateConfig } = useEventStore();
  const [eventName, setEventName] = useState(config.eventName);
  const [blockNames, setBlockNames] = useState(config.blockNames);
  const [floorNames, setFloorNames] = useState(config.floorNames);
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateConfig({
      eventName: eventName.trim() || 'JANMASHTAMI — DAHI HANDI',
      blockNames,
      floorNames,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const resetDefaults = () => {
    setEventName('JANMASHTAMI — DAHI HANDI');
    setBlockNames({ A: 'BLOCK A', B: 'BLOCK B', C: 'BLOCK C' });
    setFloorNames({
      'floor-1': 'FLOOR 1',
      'floor-2': 'FLOOR 2',
      'floor-3': 'FLOOR 3',
      'floor-4': 'FLOOR 4',
    });
  };

  const inputCls =
    'w-full rounded-xl border border-white/15 bg-[#0F172A]/80 px-4 py-3 text-sm font-semibold tracking-wider text-[#FFF7ED] placeholder:text-[#FFF7ED]/30 focus:border-[#FACC15]/60 focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30';

  return (
    <div className="relative min-h-screen bg-[#0F172A] text-[#FFF7ED]">
      <FestiveBackground density="light" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-16 pt-10">
        <p className="text-center text-[11px] font-semibold tracking-[0.35em] text-[#FACC15]">
          {config.eventName}
        </p>
        <h1 className="mt-1 text-center text-3xl font-bold tracking-wide">
          EVENT SETUP
        </h1>
        <p className="mt-2 text-center text-sm text-[#FFF7ED]/55">
          Names appear instantly on the display wall. Changes persist in this
          browser via localStorage.
        </p>

        <div className="anim-card-in mt-8 rounded-2xl bg-white/[0.05] p-6 ring-1 ring-white/10">
          <label className="text-xs font-semibold tracking-[0.25em] text-[#FFF7ED]/60">
            EVENT NAME
          </label>
          <input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className={`${inputCls} mt-2`}
            maxLength={60}
            placeholder="JANMASHTAMI — DAHI HANDI"
          />

          <h2 className="mt-6 text-xs font-semibold tracking-[0.25em] text-[#FFF7ED]/60">
            BLOCK NAMES
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {BLOCK_IDS.map((b: BlockId) => (
              <div key={b}>
                <label className="text-[11px] tracking-widest text-[#06B6D4]">
                  BLOCK {b}
                </label>
                <input
                  value={blockNames[b]}
                  onChange={(e) =>
                    setBlockNames({ ...blockNames, [b]: e.target.value.toUpperCase().slice(0, 24) })
                  }
                  className={`${inputCls} mt-1`}
                  maxLength={24}
                />
              </div>
            ))}
          </div>

          <h2 className="mt-6 text-xs font-semibold tracking-[0.25em] text-[#FFF7ED]/60">
            FLOOR NAMES
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FLOOR_IDS.map((f: FloorId, i: number) => (
              <div key={f}>
                <label className="text-[11px] tracking-widest text-[#06B6D4]">
                  FLOOR {i + 1}
                </label>
                <input
                  value={floorNames[f]}
                  onChange={(e) =>
                    setFloorNames({ ...floorNames, [f]: e.target.value.toUpperCase().slice(0, 24) })
                  }
                  className={`${inputCls} mt-1`}
                  maxLength={24}
                />
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={save}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EC4899] px-5 py-3.5 text-sm font-bold tracking-wide transition hover:brightness-110 active:scale-[0.99]"
            >
              {saved ? '✓ SAVED' : 'SAVE CHANGES'}
            </button>
            <button
              onClick={resetDefaults}
              className="rounded-xl bg-white/10 px-5 py-3.5 text-sm font-semibold transition hover:bg-white/20"
            >
              Reset defaults
            </button>
          </div>
          <p className="mt-3 text-xs text-[#FFF7ED]/45">
            Example: BLOCK A → BLOCK RED · FLOOR 1 → GROUND FLOOR
          </p>
        </div>

        <nav className="mt-6 flex justify-center gap-3 text-sm font-semibold">
          <a href="/admin" className="rounded-xl bg-[#2563EB] px-5 py-2.5 transition hover:bg-[#1D4ED8]">
            ← ADMIN
          </a>
          <a
            href="/display"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-white/10 px-5 py-2.5 transition hover:bg-white/20"
          >
            OPEN DISPLAY ⛶
          </a>
        </nav>
      </div>
    </div>
  );
}
