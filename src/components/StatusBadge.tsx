import type { BlockStatus } from '../lib/types';
import { cn } from '../lib/cn';

const STYLES: Record<BlockStatus, string> = {
  READY: 'bg-white/10 text-[#FFF7ED]/70 ring-white/15',
  RUNNING: 'bg-[#22C55E]/15 text-[#4ADE80] ring-[#22C55E]/40',
  PAUSED: 'bg-[#FACC15]/15 text-[#FACC15] ring-[#FACC15]/40',
  FINALIZED: 'bg-[#8B5CF6]/20 text-[#C4B5FD] ring-[#8B5CF6]/50',
};

export default function StatusBadge({
  status,
  pulse = false,
  size = 'md',
}: {
  status: BlockStatus;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-semibold tracking-[0.18em] ring-1',
        STYLES[status],
        size === 'sm' && 'px-2.5 py-1 text-[10px]',
        size === 'md' && 'px-3.5 py-1.5 text-xs',
        size === 'lg' && 'px-5 py-2 text-sm',
      )}
    >
      {status === 'RUNNING' && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full bg-[#4ADE80]',
              pulse && 'anim-pulse-dot',
            )}
          />
        </span>
      )}
      {status === 'FINALIZED' ? '✓ FINALIZED' : status}
    </span>
  );
}
