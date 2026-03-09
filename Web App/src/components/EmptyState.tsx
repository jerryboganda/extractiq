import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="p-4 rounded-2xl bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[280px]">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
