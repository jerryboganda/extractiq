import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, BookOpen, Download, X } from "lucide-react";

const DISMISS_KEY = "mcq_welcome_dismissed";

const steps = [
  { label: "Upload first document", icon: Upload, href: "/upload", done: true },
  { label: "Review extraction", icon: BookOpen, href: "/review", done: false },
  { label: "Export results", icon: Download, href: "/export", done: false },
];

export function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "true");
  const navigate = useNavigate();

  if (dismissed) return null;

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12, height: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
          <CardContent className="relative p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold">Welcome back, Dr. Chen</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete these steps to get the most out of your workspace — {completedCount}/{steps.length} done
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {steps.map((step) => (
                    <Button
                      key={step.label}
                      variant={step.done ? "secondary" : "outline"}
                      size="sm"
                      className="gap-2 h-8 text-xs"
                      onClick={() => navigate(step.href)}
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <step.icon className="h-3.5 w-3.5" />
                      )}
                      <span className={step.done ? "line-through text-muted-foreground" : ""}>
                        {step.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => {
                  localStorage.setItem(DISMISS_KEY, "true");
                  setDismissed(true);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
