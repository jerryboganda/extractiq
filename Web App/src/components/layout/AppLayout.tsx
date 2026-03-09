import { useState, useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { PageTransition } from "@/components/PageTransition";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { useKeySequence } from "@/hooks/use-key-sequence";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (e.key === "?" && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const sequences = useMemo(() => ({
    "g d": () => navigate("/"),
    "g j": () => navigate("/jobs"),
    "g r": () => navigate("/review"),
    "g u": () => navigate("/upload"),
    "g p": () => navigate("/projects"),
    "g a": () => navigate("/analytics"),
    "g s": () => navigate("/settings"),
  }), [navigate]);

  useKeySequence(sequences);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 overflow-auto scrollbar-thin">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                {children || <Outlet />}
              </PageTransition>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <CommandPalette onOpenShortcuts={() => setShortcutsOpen(true)} />
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <OnboardingChecklist />
    </SidebarProvider>
  );
}
