import { Activity, Circle } from 'lucide-react';

import { fallbackFileActivity } from '../file-ui';

const activityToneClassName = {
  default: 'text-[#8b94a1]',
  success: 'text-[#9df2c7]',
  warning: 'text-[#FFD369]',
};

type FileActivityPanelProps = {
  fileId: number | string;
};

export function FileActivityPanel({ fileId }: FileActivityPanelProps) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-white">
          <Activity className="size-4 text-[#FFD369]" />
          Activity
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
          File #{fileId}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        {fallbackFileActivity.map((item) => (
          <article className="relative ml-2 border-l border-[#39424f] pb-4 pl-4 last:pb-0" key={item.id}>
            <Circle
              className={`absolute -left-1.5 top-1 size-3 fill-[#0d151e] ${activityToneClassName[item.tone]}`}
            />
            <p className="text-[11px] font-bold leading-5 text-[#dce7f3]">
              <span className="font-black text-white">{item.actor}</span> {item.label}
            </p>
            <p className="mt-1 text-[10px] font-bold text-[#8b94a1]">{item.time}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
