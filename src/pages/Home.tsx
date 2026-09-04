import FestiveBackground from '../components/FestiveBackground';
import { useEventStore } from '../lib/store';

export default function Home() {
  const { config } = useEventStore();
  const card =
    'group block rounded-2xl bg-white/[0.05] p-7 ring-1 ring-white/10 backdrop-blur transition hover:bg-white/[0.08] hover:ring-[#FACC15]/40';
  return (
    <div className="relative min-h-screen bg-[#0F172A] text-[#FFF7ED]">
      <FestiveBackground />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-xs font-semibold tracking-[0.4em] text-[#FACC15]">
          🪔 SHUBH JANMASHTAMI 🪔
        </p>
        <h1 className="anim-card-in mt-3 text-4xl font-bold leading-tight tracking-wide sm:text-5xl">
          {config.eventName}
        </h1>
        <p className="mt-3 text-sm tracking-[0.3em] text-[#FFF7ED]/55">
          FLOOR &amp; BLOCK STOPWATCH SYSTEM
        </p>

        <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          <a href="/display" className={card}>
            <div className="text-3xl">📺</div>
            <h2 className="mt-2 text-lg font-bold">DISPLAY</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#FFF7ED]/60">
              Full-screen LED wall / projector view. Open on the big screen.
            </p>
            <span className="font-timer mt-3 inline-block text-xs text-[#06B6D4]">
              /display →
            </span>
          </a>
          <a href="/admin" className={card}>
            <div className="text-3xl">🎛️</div>
            <h2 className="mt-2 text-lg font-bold">ADMIN</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#FFF7ED]/60">
              Operator control panel. Start floors, pause &amp; finalize blocks.
            </p>
            <span className="font-timer mt-3 inline-block text-xs text-[#F97316]">
              /admin →
            </span>
          </a>
          <a href="/setup" className={card}>
            <div className="text-3xl">⚙️</div>
            <h2 className="mt-2 text-lg font-bold">SETUP</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#FFF7ED]/60">
              Rename event, floors and blocks. Saved in this browser.
            </p>
            <span className="font-timer mt-3 inline-block text-xs text-[#EC4899]">
              /setup →
            </span>
          </a>
        </div>

        <p className="mt-8 text-[11px] tracking-[0.25em] text-[#FFF7ED]/35">
          TIP — OPEN DISPLAY + ADMIN IN TWO WINDOWS · SYNC IS AUTOMATIC
        </p>
      </div>
    </div>
  );
}
