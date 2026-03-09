import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, FileText, CheckCircle2, AlertTriangle, Download, Server, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: React.ElementType;
  type: "info" | "success" | "warning";
}

const initialNotifications: Notification[] = [
  { id: "n1", title: "Extraction Complete", description: "Anatomy_Final_2025.pdf — 245 MCQs extracted", time: "2 min ago", read: false, icon: CheckCircle2, type: "success" },
  { id: "n2", title: "Review Flagged", description: "Pathology_Q42 flagged by Dr. Kim", time: "15 min ago", read: false, icon: AlertTriangle, type: "warning" },
  { id: "n3", title: "Export Ready", description: "QTI_Export_Batch_47 is ready for download", time: "1 hr ago", read: false, icon: Download, type: "info" },
  { id: "n4", title: "New Document", description: "Pharmacology_Ch12.pdf uploaded successfully", time: "2 hrs ago", read: true, icon: FileText, type: "info" },
  { id: "n5", title: "Provider Degraded", description: "Gemini Pro latency increased to 4.1s", time: "3 hrs ago", read: true, icon: Server, type: "warning" },
];

const liveNotifications: Omit<Notification, "id" | "time" | "read">[] = [
  { title: "Job Completed", description: "Neuroscience_Unit5.pdf — 87 MCQs extracted", icon: CheckCircle2, type: "success" },
  { title: "Low Confidence Alert", description: "3 MCQs below 50% confidence threshold", icon: AlertTriangle, type: "warning" },
  { title: "Export Generated", description: "CSV_Export_Batch_48 ready for download", icon: Download, type: "info" },
  { title: "New Upload", description: "Surgery_Notes_2025.pdf uploaded by Prof. Malik", icon: FileText, type: "info" },
  { title: "Provider Recovered", description: "Gemini Pro latency normalized to 2.9s", icon: Server, type: "success" },
];

const typeColors = {
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
};

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Live notification arrivals
  useEffect(() => {
    let idx = 0;
    const scheduleNext = () => {
      const delay = 30000 + Math.random() * 15000; // 30-45s
      return setTimeout(() => {
        const template = liveNotifications[idx % liveNotifications.length];
        idx++;
        const newNotif: Notification = {
          ...template,
          id: `live_${Date.now()}`,
          time: "Just now",
          read: false,
        };
        setNotifications((prev) => [newNotif, ...prev].slice(0, 12));
        timerId = scheduleNext();
      }, delay);
    };
    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

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
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          <AnimatePresence initial={false}>
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors ${
                  n.read ? "opacity-60" : "bg-muted/50"
                }`}
              >
                <n.icon className={`h-4 w-4 mt-0.5 shrink-0 ${typeColors[n.type]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{n.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                  className="shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}
