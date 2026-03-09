import { useEffect, useState, useRef } from "react";

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function useAnimatedCounter(
  target: number,
  duration = 1200,
  decimals = 0
): string {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);

      setValue(eased * target);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
}
