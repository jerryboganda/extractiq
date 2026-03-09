import { useState, useEffect } from "react";

export function useSimulatedLoading(durationMs = 800) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  return isLoading;
}
