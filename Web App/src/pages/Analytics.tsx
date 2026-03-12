import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  useAnalyticsTimeSeries,
  useConfidenceDistribution,
  useProviderComparison,
  useProcessingTimeTrend,
  useCostBreakdown,
  useAnalyticsSummary,
} from "@/hooks/use-api";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { UpgradeBanner } from "@/components/UpgradeBanner";

const mockKpis = [
  { label: "Total Extractions", value: "48,291", change: "+8.7%", icon: BarChart3, positive: true },
  { label: "Avg Confidence", value: "91.4%", change: "+2.1%", icon: TrendingUp, positive: true },
  { label: "Total Cost", value: "$2,815", change: "+12.3%", icon: DollarSign, positive: false },
  { label: "Rejection Rate", value: "5.3%", change: "-1.2%", icon: AlertTriangle, positive: true },
];

const ranges = ["7 days", "30 days", "90 days"] as const;

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  },
};

export default function Analytics() {
  const [range, setRange] = useState<string>("30 days");

  const { data: timeSeries } = useAnalyticsTimeSeries({ days: range === '7 days' ? 7 : range === '90 days' ? 90 : 30 });
  const { data: confidenceDistribution } = useConfidenceDistribution();
  const { data: providerComparison } = useProviderComparison();
  const { data: processingTimeTrend } = useProcessingTimeTrend();
  const { data: costBreakdown } = useCostBreakdown();
  const { data: summary } = useAnalyticsSummary();

  const analyticsTimeSeries = timeSeries ?? [];
  const analyticsConfidenceDistribution = confidenceDistribution ?? [];
  const analyticsProviderComparison = providerComparison ?? [];
  const analyticsProcessingTimeTrend = processingTimeTrend ?? [];
  const analyticsCostBreakdown = costBreakdown ?? [];

  const kpis = summary ? [
    { label: "Total Extractions", value: summary.totalExtractions?.toLocaleString() ?? '0', change: summary.extractionsChange ?? '+0%', icon: BarChart3, positive: !summary.extractionsChange?.startsWith('-') },
    { label: "Avg Confidence", value: `${summary.avgConfidence ?? 0}%`, change: summary.confidenceChange ?? '+0%', icon: TrendingUp, positive: !summary.confidenceChange?.startsWith('-') },
    { label: "Total Cost", value: `$${summary.totalCost?.toLocaleString() ?? '0'}`, change: summary.costChange ?? '+0%', icon: DollarSign, positive: summary.costChange?.startsWith('-') },
    { label: "Rejection Rate", value: `${summary.rejectionRate ?? 0}%`, change: summary.rejectionChange ?? '+0%', icon: AlertTriangle, positive: summary.rejectionChange?.startsWith('-') },
  ] : mockKpis;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Extraction pipeline performance insights</p>
        </div>
        <div className="flex gap-2">
          {ranges.map((r) => (
            <Button
              key={r}
              variant={range === r ? "secondary" : "outline"}
              size="sm"
              onClick={() => setRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <StaggerItem key={kpi.label}>
            <Card className="glass border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <span className={`text-xs font-medium ${kpi.positive ? "text-success" : "text-destructive"}`}>{kpi.change}</span>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StaggerItem>
          <Card className="glass border-border">
            <CardHeader><CardTitle className="text-base">Extraction Volume</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={264}>
                <AreaChart data={analyticsTimeSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mcqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="mcqCount" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#mcqGrad)" name="MCQs Extracted" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="glass border-border">
            <CardHeader><CardTitle className="text-base">Provider Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={264}>
                <BarChart data={analyticsProviderComparison} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="provider" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Accuracy" />
                  <Bar dataKey="speed" fill="hsl(var(--info))" radius={[3, 3, 0, 0]} name="Speed" />
                  <Bar dataKey="costEfficiency" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} name="Cost Eff." />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* New: Processing Time + Cost Breakdown */}
      <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StaggerItem>
          <Card className="glass border-border">
            <CardHeader><CardTitle className="text-base">Processing Time Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={264}>
                <LineChart data={analyticsProcessingTimeTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} unit="m" />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="avgDuration" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Avg Duration" />
                  <Line type="monotone" dataKey="p95Duration" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} strokeDasharray="4 4" name="P95 Duration" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="glass border-border">
            <CardHeader><CardTitle className="text-base">Cost Breakdown by Provider</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={264}>
                <BarChart data={analyticsCostBreakdown} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} unit="$" />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="GPT-4o" stackId="cost" fill="hsl(var(--primary))" name="GPT-4o" />
                  <Bar dataKey="Claude 3.5" stackId="cost" fill="hsl(var(--info))" name="Claude 3.5" />
                  <Bar dataKey="Gemini Pro" stackId="cost" fill="hsl(var(--warning))" name="Gemini Pro" />
                  <Bar dataKey="Llama 3.2" stackId="cost" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} name="Llama 3.2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Confidence Distribution Donut */}
      <Card className="glass border-border">
        <CardHeader><CardTitle className="text-base">Confidence Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={analyticsConfidenceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="range"
                  animationDuration={800}
                >
                  {analyticsConfidenceDistribution.map((entry: any, idx: number) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {analyticsConfidenceDistribution.map((b: any) => (
                <div key={b.range} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ background: b.fill }} />
                  <span className="text-sm text-muted-foreground w-16">{b.range}</span>
                  <span className="text-sm font-semibold">{b.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <UpgradeBanner
        title="Unlock Advanced Analytics"
        description="Upgrade to Pro for custom date ranges, cost forecasting, and exportable reports."
      />
    </div>
  );
}
