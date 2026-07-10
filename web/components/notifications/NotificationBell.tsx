'use client';

import { Bell, CheckCheck, Circle } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { formatNotificationText } from '@/lib/activity-message';
import { cn } from '@/lib/utils';

type NotificationBellProps = {
  className?: string;
  dotClassName?: string;
  triggerClassName?: string;
};

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(date);
}

export function NotificationBell({
  className,
  dotClassName,
  triggerClassName,
}: NotificationBellProps) {
  const { error, isConnected, isLoading, markAllAsRead, markAsRead, notifications, unreadCount } =
    useRealtimeNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open notifications"
          className={cn(
            'relative rounded-lg p-2 text-[#B8BEC8] transition hover:bg-[#2F3742] hover:text-white',
            triggerClassName,
            className,
          )}
          type="button"
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <span
              className={cn(
                'absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-[#222831] bg-[#FFD369]',
                dotClassName,
              )}
            />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[360px] rounded-[6px] border border-[#393E46] bg-[#101820] p-0 text-white"
      >
        <DropdownMenuLabel className="flex items-center justify-between gap-3 px-4 py-3">
          <span>
            <span className="block text-sm font-black">Notifications</span>
            <span className="mt-1 block text-[11px] font-bold text-[#8B93A5]">
              {isConnected ? '' : 'Realtime pending'}
            </span>
          </span>
          {unreadCount > 0 ? (
            <button
              className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-[11px] font-bold text-[#FFD369] hover:bg-[#222831]"
              onClick={(event) => {
                event.preventDefault();
                void markAllAsRead();
              }}
              type="button"
            >
              <CheckCheck className="size-3.5" />
              Read all
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#393E46]" />
        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <div className="px-4 py-6 text-center text-xs font-bold text-[#8B93A5]">
              Loading notifications...
            </div>
          ) : notifications.length ? (
            notifications.slice(0, 12).map((notification) => {
              const text = formatNotificationText(notification);

              return (
                <DropdownMenuItem
                  className="cursor-pointer items-start gap-3 rounded-none border-b border-[#222831] px-4 py-3 focus:bg-[#222831] focus:text-white"
                  key={notification.id}
                  onClick={() => void markAsRead(notification.id)}
                >
                  <Circle
                    className={cn(
                      'mt-1 size-2 shrink-0 fill-current',
                      notification.isRead ? 'text-[#50555D]' : 'text-[#FFD369]',
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-white">{text.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#C8C8C8]">
                      {text.description}
                    </span>
                    <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#8B93A5]">
                      {formatTime(notification.createdAt)}
                    </span>
                  </span>
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-xs font-bold text-[#8B93A5]">
              No notifications yet.
            </div>
          )}
        </ScrollArea>
        {error ? (
          <>
            <DropdownMenuSeparator className="bg-[#393E46]" />
            <p className="px-4 py-3 text-xs font-bold text-red-300">{error}</p>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
