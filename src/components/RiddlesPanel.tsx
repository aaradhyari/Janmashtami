import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { RIDDLES } from '../lib/riddles';
import { useEventStore } from '../lib/store';
import { cn } from '../lib/cn';

/**
 * Riddles section of the admin panel: browse all 25 पहेलियाँ, preview Q&A,
 * push one live to the display wall and control its answer from here.
 *
 * A riddle shown on the wall (question or answer) is DONE forever —
 * used riddles can never be reused.
 */
export default function RiddlesPanel() {
  const {
    event,
    showRiddle,
    revealRiddleAnswer,
    hideRiddle,
    resetRiddleHistory,
  } = useEventStore();
  const [selected, setSelected] = useState(0);
  const [localReveal, setLocalReveal] = useState(false);
  const [confirmHistoryReset, setConfirmHistoryReset] = useState(false);

  const live = event.displayRiddle;
  const used = event.usedRiddles;
  const riddle = RIDDLES[selected]!;
  const isLiveSelected = live?.index === selected;
  const isUsedSelected = used.includes(selected);
  const doneCount = used.length;

  const pick = (i: number) => {
    setSelected(i);
    setLocalReveal(false);
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* ---------- riddle list ---------- */}
      <section
        aria-label="Riddle list"
        className="nice-scroll max-h-[32rem] overflow-y-auto rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 lg:max-h-[38rem]"
      >
        <p className="px-1 pb-3 text-[11px] tracking-[0.25em] text-[#FFF7ED]/50">
          25 पहेलियाँ · {doneCount} DONE · TAP TO PREVIEW
        </p>
        <ol className="grid grid-cols-1 gap-2">
          {RIDDLES.map((r, i) => {
            const isSel = i === selected;
            const isLive = live?.index === i;
            const isDone = used.includes(i);
            return (
              <li key={i}>
                <button
                  onClick={() => pick(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition active:scale-[0.99]',
                    isSel
                      ? 'bg-[#8B5CF6]/20 ring-[#8B5CF6]/60'
                      : 'bg-[#0F172A]/60 ring-white/10 hover:bg-white/[0.07]',
                    isDone && !isSel && 'opacity-55',
                  )}
                >
                  <span
                    className={cn(
                      'font-timer flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                      isLive
                        ? 'bg-gradient-to-br from-[#FACC15] to-[#F97316] text-[#0F172A]'
                        : 'bg-white/10 text-[#FFF7ED]/80',
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
                  {isLive ? (
                    <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-[#EF4444]/15 px-2.5 py-1 text-[10px] font-bold tracking-widest text-[#FCA5A5] ring-1 ring-[#EF4444]/40">
                      <span className="anim-pulse-dot h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                      LIVE
                    </span>
                  ) : (
                    isDone && (
                      <span className="ml-auto shrink-0 rounded-full bg-[#22C55E]/15 px-2.5 py-1 text-[10px] font-bold tracking-widest text-[#4ADE80] ring-1 ring-[#22C55E]/40">
                        ✓ DONE
                      </span>
                    )
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ---------- preview + display controls ---------- */}
      <section
        aria-label="Riddle preview"
        className="flex flex-col rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[0.25em] text-[#FACC15]">
            ❓ पहेली {selected + 1} / {RIDDLES.length}
          </p>
          {isLiveSelected ? (
            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-[#FCA5A5]">
              <span className="anim-pulse-dot h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
              ON DISPLAY WALL
            </p>
          ) : (
            isUsedSelected && (
              <p className="text-[11px] font-bold tracking-widest text-[#4ADE80]">
                ✓ DONE — CANNOT REUSE
              </p>
            )
          )}
        </div>

        <blockquote className="mt-4 rounded-xl bg-[#0F172A]/70 p-5 text-lg font-medium leading-relaxed ring-1 ring-white/10 sm:text-xl">
          {riddle.question}
        </blockquote>

        <div className="mt-4 min-h-[4.5rem] rounded-xl ring-1">
          {localReveal ? (
            <div className="anim-pop-in rounded-xl bg-[#FACC15]/10 p-4 text-center ring-1 ring-[#FACC15]/40">
              <p className="text-[11px] tracking-[0.3em] text-[#FACC15]/80">उत्तर</p>
              <p className="mt-1 text-2xl font-bold text-[#FACC15]">{riddle.answer}</p>
            </div>
          ) : (
            <button
              onClick={() => setLocalReveal(true)}
              className="w-full rounded-xl bg-white/[0.04] p-4 text-sm font-semibold tracking-widest text-[#FFF7ED]/50 ring-1 ring-dashed ring-white/20 transition hover:bg-white/[0.08] hover:text-[#FFF7ED]"
            >
              👁 TAP TO REVEAL ANSWER (OPERATOR ONLY)
            </button>
          )}
        </div>

        {/* display-wall controls */}
        {!isLiveSelected ? (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              disabled={isUsedSelected}
              onClick={() => showRiddle(selected)}
              title={isUsedSelected ? 'Already shown — cannot reuse' : 'Show question on the wall'}
              className="rounded-xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] px-4 py-3.5 text-sm font-bold tracking-wide transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
            >
              📺 SHOW QUESTION
            </button>
            <button
              disabled={isUsedSelected}
              onClick={() => showRiddle(selected, true)}
              title={isUsedSelected ? 'Already shown — cannot reuse' : 'Go live with the answer revealed'}
              className="rounded-xl bg-gradient-to-r from-[#FACC15] to-[#F97316] px-4 py-3.5 text-sm font-bold tracking-wide text-[#0F172A] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
            >
              ✨ LIVE + ANSWER
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={() => revealRiddleAnswer(!live?.showAnswer)}
              className={cn(
                'rounded-xl px-4 py-3.5 text-sm font-bold tracking-wide transition active:scale-[0.99]',
                live?.showAnswer
                  ? 'bg-white/10 hover:bg-white/20'
                  : 'bg-gradient-to-r from-[#FACC15] to-[#F97316] text-[#0F172A] hover:brightness-110',
              )}
            >
              {live?.showAnswer ? '🙈 HIDE WALL ANSWER' : '✨ SHOW WALL ANSWER'}
            </button>
            <button
              onClick={hideRiddle}
              className="rounded-xl bg-white/10 px-4 py-3.5 text-sm font-bold tracking-wide transition hover:bg-[#EF4444]/25 active:scale-[0.99]"
            >
              ✖ REMOVE FROM DISPLAY
            </button>
          </div>
        )}
        {isUsedSelected && !isLiveSelected && (
          <p className="mt-2 text-center text-xs font-semibold tracking-wider text-[#4ADE80]/80">
            ✓ Shown on the wall before — marked DONE, cannot be reused.
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => pick((selected + RIDDLES.length - 1) % RIDDLES.length)}
            className="flex-1 rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-semibold transition hover:bg-white/[0.12]"
          >
            ← PREV
          </button>
          <button
            onClick={() => pick((selected + 1) % RIDDLES.length)}
            className="flex-1 rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-semibold transition hover:bg-white/[0.12]"
          >
            NEXT →
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-[#FFF7ED]/45">
          Control everything from here: push a question live, reveal its
          answer on the wall, then remove it. Any riddle shown on the wall is
          marked DONE forever. Starting a floor asks which fresh riddle to
          play after its GET SET GO, then timers.
        </p>
        <button
          onClick={() => setConfirmHistoryReset(true)}
          className="mt-2 self-center rounded-lg px-2 py-1 text-[11px] font-semibold text-[#EF4444]/70 transition hover:bg-[#EF4444]/15 hover:text-[#EF4444]"
        >
          Reset riddle history ({doneCount} done)
        </button>
      </section>

      {confirmHistoryReset && (
        <ConfirmDialog
          spec={{
            title: 'Reset riddle history?',
            message: `This marks all ${doneCount} DONE riddles as fresh again.\nOnly do this for a brand-new quiz round.`,
            confirmLabel: 'RESET HISTORY',
            tone: 'danger',
            onConfirm: () => {
              resetRiddleHistory();
              setConfirmHistoryReset(false);
            },
          }}
          onClose={() => setConfirmHistoryReset(false)}
        />
      )}
    </div>
  );
}
