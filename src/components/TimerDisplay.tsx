import { formatElapsed } from '../lib/time';
import { cn } from '../lib/cn';

export default function TimerDisplay({
  elapsedMs,
  size = 'md',
  dimmed = false,
  highlight = false,
  className,
  textClass,
}: {
  elapsedMs: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  dimmed?: boolean;
  highlight?: boolean;
  className?: string;
  /** Full override for the size classes (avoids specificity fights). */
  textClass?: string;
}) {
  return (
    <div
      className={cn(
        'font-timer font-bold tabular-nums leading-none tracking-tight whitespace-nowrap',
        textClass ??
          (size === 'sm' ? 'text-2xl'
            : size === 'md' ? 'text-4xl'
              : size === 'lg' ? 'text-6xl'
                : 'text-[clamp(2.75rem,8vw,7.5rem)]'),
        dimmed ? 'text-[#FFF7ED]/45' : 'text-[#FFF7ED]',
        highlight && 'text-[#FACC15] drop-shadow-[0_0_28px_rgba(250,204,21,0.35)]',
        className,
      )}
    >
      {formatElapsed(elapsedMs)}
    </div>
  );
}
