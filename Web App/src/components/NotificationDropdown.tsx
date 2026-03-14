import { Bell, CheckCircle2, AlertTriangle, Download, FileText, Server, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/use-api";
import { motion } from "framer-motion";
import type { NotificationItem } from "@/lib/api-types";

const typeIcons = {
  job_completed: CheckCircle2,
  export_ready: Download,
  upload_complete: FileText,
  provider_error: Server,
  review_required: AlertTriangle,
  job_failed: AlertTriangle,
  default: Bell,
} as const;

const typeColors = {
  job_completed: "text-success",
  export_ready: "text-info",
  upload_complete: "text-info",
  provider_error: "text-warning",
  review_required: "text-warning",
  job_failed: "text-destructive",
  default: "text-info",
} as const;

function formatNotificationTime(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;
  return date.toLocaleString();
}

export function NotificationDropdown() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground"
            >
              {unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => markAllRead.mutate()}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">No notifications yet.</div>
          ) : notifications.map((notification: NotificationItem) => {
            const Icon = typeIcons[notification.type as keyof typeof typeIcons] ?? typeIcons.default;
            const colorClass = typeColors[notification.type as keyof typeof typeColors] ?? typeColors.default;

            return (
              <div
                key={notification.id}
                className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors ${notification.read ? "opacity-60" : "bg-muted/50"}`}
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorClass}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{notification.title}</p>
                  <p className="text-[11px] text-muted-foreground">{notification.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatNotificationTime(notification.createdAt)}</p>
                </div>
                {!notification.read ? (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      markRead.mutate(notification.id);
                    }}
                    className="shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                    aria-label="Mark as read"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
