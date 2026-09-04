import { useEffect, useState } from 'react';
import { RIDDLES } from '../lib/riddles';
import { cn } from '../lib/cn';

/**
 * Shown when START FLOOR is pressed: the operator picks which riddle plays
 * after GET SET GO (or skips the riddle), then the floor starts.
 */
export default function RiddlePickerDialog({
  floorName,
  defaultIndex,
  usedRiddles,
  warning,
  onConfirm,
  onClose,
}: {
  floorName: string;
  defaultIndex: number | null;
  usedRiddles: number[];
  warning: string | null;
  onConfirm: (riddleIndex: number | null) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(defaultIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm(selected);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, onConfirm, onClose]);

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Pick a riddle for ${floorName}`}
        className="anim-pop-in flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#1E293B] shadow-2xl ring-1 ring-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-[#22C55E] to-[#06B6D4]" />
        <div className="px-6 pt-5">
          <h2 className="text-xl font-bold text-[#FFF7ED]">
            START {floorName} <span className="text-[#FACC15]">+ ❓ RIDDLE?</span>
          </h2>
          {warning && (
            <p className="mt-2 whitespace-pre-line rounded-xl bg-[#EF4444]/10 p-3 text-sm font-semibold leading-relaxed text-[#FCA5A5] ring-1 ring-[#EF4444]/30">
              ⚠ {warning}
            </p>
          )}
          <p className="mt-2 text-sm text-[#FFF7ED]/60">
            Pick the riddle that plays after GET SET GO — or skip it.
          </p>
        </div>

        <ol className="nice-scroll mx-6 mb-2 mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          <li>
            <button
              onClick={() => setSelected(null)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition',
                selected === null
                  ? 'bg-white/15 ring-[#FACC15]/60'
                  : 'bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]',
              )}
            >
              <span className="font-timer flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm">
                🚫
              </span>
              <span className="text-sm font-semibold text-[#FFF7ED]/85">
                No riddle — timers only
              </span>
            </button>
          </li>
          {RIDDLES.map((r, i) => {
            const isDone = usedRiddles.includes(i);
            return (
            <li key={i}>
              <button
                disabled={isDone}
                onClick={() => setSelected(i)}
                title={isDone ? 'Already shown — DONE, cannot reuse' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition',
                  selected === i
                    ? 'bg-[#8B5CF6]/20 ring-[#8B5CF6]/60'
                    : 'bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]',
                  isDone && 'cursor-not-allowed opacity-45 hover:bg-white/[0.04]',
                )}
              >
                <span
                  className={cn(
                    'font-timer flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                    selected === i ? 'bg-[#8B5CF6] text-white' : 'bg-white/10 text-[#FFF7ED]/80',
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#FFF7ED]/90">
                    {r.answer}
                  </span>
                  <span className="block truncate text-xs text-[#FFF7ED]/45">
                    {r.question}
                  </span>
                </span>
                {isDone && (
                  <span className="ml-auto shrink-0 rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#4ADE80] ring-1 ring-[#22C55E]/40">
                    ✓ DONE
                  </span>
                )}
              </button>
            </li>
            );
          })}
        </ol>

        <div className="flex gap-3 px-6 pb-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-[#FFF7ED] transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            CANCEL
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EC4899] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
          >
            ▶ START {floorName}
          </button>
        </div>
        <p className="px-6 pb-4 text-center text-[11px] text-[#FFF7ED]/40">
          {selected === null
            ? 'No riddle will play — timers start after GET SET GO.'
            : `Riddle ${selected + 1} plays after GET SET GO. Answers never show on the wall.`}
        </p>
      </div>
    </div>
  );
}
