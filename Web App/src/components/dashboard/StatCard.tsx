import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { SparklineChart } from "./SparklineChart";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  trend: number;
  icon: LucideIcon;
  color: string;
  sparklineData?: number[];
  delay?: number;
  decimals?: number;
}

export function StatCard({ title, value, suffix = "", trend, icon: Icon, color, sparklineData, delay = 0, decimals = 0 }: StatCardProps) {
  const animatedValue = useAnimatedCounter(value, 1200, decimals);

  return (
    <motion.div
      whileHover={{ y: -4, transition: { type: "spring" as const, stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="glass border-border overflow-hidden cursor-default">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {title}
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {animatedValue}{suffix}
              </p>
            </div>
            <div className={`p-2 rounded-lg bg-muted ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 h-8">
            <SparklineChart data={sparklineData} color={`hsl(var(--${color.replace("text-", "")}))`} />
          </div>
          <div className="flex items-center gap-1 mt-2">
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            <span className={`text-xs font-medium ${trend > 0 ? "text-success" : "text-destructive"}`}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
            <span className="text-[11px] text-muted-foreground">vs last week</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
