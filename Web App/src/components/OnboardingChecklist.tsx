import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, BookOpen, Download, Users, Cog, CheckCircle2, ChevronUp, X } from "lucide-react";
import { ProgressRing } from "@/components/dashboard/ProgressRing";

const STORAGE_KEY = "mcq_onboarding";

const steps = [
  { id: "upload", label: "Upload a document", icon: Upload, href: "/upload" },
  { id: "process", label: "Process extraction", icon: Cog, href: "/jobs" },
  { id: "review", label: "Review MCQs", icon: BookOpen, href: "/review" },
  { id: "export", label: "Export results", icon: Download, href: "/export" },
  { id: "team", label: "Invite team member", icon: Users, href: "/users" },
];

function getCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (parsed.dismissed) return new Set();
    return new Set(parsed.completed || []);
  } catch {
    return new Set();
  }
}

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Set<string>>(getCompleted);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").dismissed === true;
    } catch {
      return false;
    }
  });

  if (dismissed || completed.size >= steps.length) return null;

  const progress = Math.round((completed.size / steps.length) * 100);

  const handleStepClick = (stepId: string, href: string) => {
    const next = new Set(completed);
    next.add(stepId);
    setCompleted(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: Array.from(next) }));
    navigate(href);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissed: true }));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <Card className="w-72 shadow-xl border-border glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Getting Started</h4>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss}>
                      <X className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(false)}>
                      <ChevronUp className="h-3 w-3 rotate-180" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {steps.map((step) => {
                    const isDone = completed.has(step.id);
                    return (
                      <button
                        key={step.id}
                        onClick={() => !isDone && handleStepClick(step.id, step.href)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors text-xs ${
                          isDone
                            ? "bg-success/10 text-muted-foreground"
                            : "hover:bg-muted cursor-pointer"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        ) : (
                          <step.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={isDone ? "line-through" : "font-medium"}>{step.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Button
              onClick={() => setExpanded(true)}
              className="gap-2 rounded-full shadow-lg h-10 px-4"
              size="sm"
            >
              <ProgressRing progress={progress} size={20} strokeWidth={2.5} />
              <span className="text-xs">{completed.size}/{steps.length} complete</span>
              <ChevronUp className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
