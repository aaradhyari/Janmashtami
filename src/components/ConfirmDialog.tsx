import { useEffect } from 'react';
import { cn } from '../lib/cn';

export interface ConfirmSpec {
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'danger' | 'celebrate' | 'start';
  onConfirm: () => void;
}

const TONE: Record<ConfirmSpec['tone'], { bar: string; btn: string }> = {
  danger: {
    bar: 'from-[#EF4444] to-[#F97316]',
    btn: 'bg-[#EF4444] hover:bg-[#DC2626] focus-visible:ring-[#EF4444]',
  },
  celebrate: {
    bar: 'from-[#FACC15] to-[#F97316]',
    btn: 'bg-[#FACC15] text-[#0F172A] hover:bg-[#FDE047] focus-visible:ring-[#FACC15]',
  },
  start: {
    bar: 'from-[#22C55E] to-[#06B6D4]',
    btn: 'bg-[#F97316] hover:bg-[#EA580C] focus-visible:ring-[#F97316]',
  },
};

export default function ConfirmDialog({
  spec,
  onClose,
}: {
  spec: ConfirmSpec;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') {
        e.preventDefault();
        spec.onConfirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [spec, onClose]);

  const tone = TONE[spec.tone];

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={spec.title}
        className="anim-pop-in w-full max-w-md overflow-hidden rounded-2xl bg-[#1E293B] shadow-2xl ring-1 ring-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('h-1.5 bg-gradient-to-r', tone.bar)} />
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#FFF7ED]">{spec.title}</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#FFF7ED]/70">
            {spec.message}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              autoFocus
              onClick={onClose}
              className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-[#FFF7ED] transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              CANCEL
            </button>
            <button
              onClick={spec.onConfirm}
              className={cn(
                'flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition focus-visible:outline-none focus-visible:ring-2',
                tone.btn,
              )}
            >
              {spec.confirmLabel}
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] text-[#FFF7ED]/40">
            Press Enter to confirm · Esc to cancel
          </p>
        </div>
      </div>
    </div>
  );
}
