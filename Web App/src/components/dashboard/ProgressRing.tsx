import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  pulse?: boolean;
  className?: string;
}

export function ProgressRing({ progress, size = 48, strokeWidth = 4, pulse = false, className }: ProgressRingProps) {
  const [offset, setOffset] = useState(100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timeout = setTimeout(() => setOffset(100 - progress), 100);
    return () => clearTimeout(timeout);
  }, [progress]);

  const strokeColor =
    progress >= 80 ? "hsl(var(--success))" :
    progress >= 40 ? "hsl(var(--warning))" :
    "hsl(var(--muted-foreground))";

  return (
    <div className={cn("relative inline-flex items-center justify-center", pulse && "status-pulse", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={(offset / 100) * circumference}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-mono font-semibold text-foreground">
        {progress}%
      </span>
    </div>
  );
}
