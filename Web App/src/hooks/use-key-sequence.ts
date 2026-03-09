import { useEffect, useRef } from "react";

type KeySequenceMap = Record<string, () => void>;

export function useKeySequence(sequences: KeySequenceMap) {
  const pendingRef = useRef<{ key: string; time: number } | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInput || e.metaKey || e.ctrlKey || e.altKey) return;

      const now = Date.now();
      const pending = pendingRef.current;

      if (pending && now - pending.time < 500) {
        const combo = `${pending.key} ${e.key.toLowerCase()}`;
        if (sequences[combo]) {
          e.preventDefault();
          sequences[combo]();
          pendingRef.current = null;
          return;
        }
      }

      // Check single-key shortcuts
      const single = e.key.toLowerCase();
      if (sequences[single]) {
        e.preventDefault();
        sequences[single]();
        pendingRef.current = null;
        return;
      }

      // Store as pending for combo
      pendingRef.current = { key: e.key.toLowerCase(), time: now };
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [sequences]);
}
