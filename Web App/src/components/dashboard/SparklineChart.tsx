import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export function SparklineChart({ data, color = "hsl(var(--primary))", height = 32 }: SparklineChartProps) {
  if (!data || data.length === 0) return null;
  const chartData = data.map((value, i) => ({ v: value, i }));
  const id = `sparkline-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${id})`}
          dot={false}
          isAnimationActive={true}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
