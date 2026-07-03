'use client';

import { useEffect, useRef, useState } from 'react';
import { toast as sonnerToast } from 'sonner';
import {
  CheckCircle2,
  Info,
  Loader2,
  OctagonX,
  TriangleAlert,
  X,
} from 'lucide-react';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

type ToastCardProps = {
  id: string | number;
  type: ToastType;
  message: string;
  description?: string;
  duration: number;
};

const typeConfig: Record<
  ToastType,
  { icon: React.ReactNode; bg: string; border: string; barColor: string }
> = {
  default: {
    icon: null,
    bg: '#20242C',
    border: '#323846',
    barColor: '#FFD369',
  },
  success: {
    icon: <CheckCircle2 className="size-[18px]" style={{ color: '#22c55e' }} />,
    bg: '#131b16',
    border: '#1e3828',
    barColor: '#22c55e',
  },
  error: {
    icon: <OctagonX className="size-[18px]" style={{ color: '#f87171' }} />,
    bg: '#170e12',
    border: '#3b1e26',
    barColor: '#f87171',
  },
  warning: {
    icon: <TriangleAlert className="size-[18px]" style={{ color: '#fbbf24' }} />,
    bg: '#1a1508',
    border: '#3d2e10',
    barColor: '#fbbf24',
  },
  info: {
    icon: <Info className="size-[18px]" style={{ color: '#60a5fa' }} />,
    bg: '#0e1620',
    border: '#1a2c42',
    barColor: '#60a5fa',
  },
  loading: {
    icon: (
      <Loader2
        className="size-[18px] animate-spin"
        style={{ color: '#aeb7c2' }}
      />
    ),
    bg: '#20242C',
    border: '#323846',
    barColor: '#aeb7c2',
  },
};

export function ToastCard({ id, type, message, description, duration }: ToastCardProps) {
  const config = typeConfig[type];
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const TICK = 50; // ms per tick

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!paused) {
        setElapsed((prev) => Math.min(prev + TICK, duration));
      }
    }, TICK);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, duration]);

  const progress = 1 - elapsed / duration; // 1 → 0

  return (
    <div
      className="relative overflow-hidden rounded-[12px] border"
      style={{
        background: config.bg,
        borderColor: config.border,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        width: '380px',
        maxWidth: '92vw',
        fontFamily: 'inherit',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Main content row */}
      <div className="flex items-start gap-3 px-5 py-4">
        {/* Icon */}
        {config.icon ? (
          <span className="mt-[1px] shrink-0">{config.icon}</span>
        ) : null}

        {/* Text */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p
            className="text-[13px] font-bold leading-snug text-white"
          >
            {message}
          </p>
          {description ? (
            <p className="text-[12px] leading-relaxed" style={{ color: '#aeb7c2' }}>
              {description}
            </p>
          ) : null}
        </div>

        {/* Close button */}
        <button
          aria-label="Close notification"
          className="mt-[1px] shrink-0 rounded-[4px] transition-colors duration-150"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7480',
            cursor: 'pointer',
            padding: '2px',
          }}
          type="button"
          onClick={() => sonnerToast.dismiss(id)}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            (e.currentTarget as HTMLButtonElement).style.background = '#323846';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#6b7480';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <X className="size-[14px]" />
        </button>
      </div>

      {/* Progress bar — real DOM div, follows transforms correctly */}
      {type !== 'loading' ? (
        <div
          className="absolute bottom-0 left-0 h-[3px] rounded-b-[12px]"
          style={{
            width: `${progress * 100}%`,
            background: config.barColor,
            transition: `width ${TICK}ms linear`,
          }}
        />
      ) : null}
    </div>
  );
}
