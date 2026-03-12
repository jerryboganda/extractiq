import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText, BookOpen, CheckCircle2, Activity, Upload, FolderKanban, ListChecks,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatCardSkeleton } from "@/components/ui/skeleton-cards";
import { ActiveJobsPanel } from "@/components/dashboard/ActiveJobsPanel";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { ProviderHealthStrip } from "@/components/dashboard/ProviderHealthStrip";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { SystemIntelligenceBar } from "@/components/dashboard/SystemIntelligenceBar";
import { useDashboardStats, useDashboardSparklines } from "@/hooks/use-api";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

const quickActions = [
  { label: "Upload Documents", icon: Upload, href: "/upload" },
  { label: "New Project", icon: FolderKanban, href: "/projects" },
  { label: "Review Queue", icon: ListChecks, href: "/review" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: sparklines } = useDashboardSparklines();

  const statCards = stats ? [
    { title: "Documents Processed", value: stats.documentsProcessed ?? 0, trend: stats.documentsProcessedTrend ?? 0, icon: FileText, color: "electric", sparkline: sparklines?.documentsProcessed },
    { title: "MCQs Extracted", value: stats.mcqsExtracted ?? 0, trend: stats.mcqsExtractedTrend ?? 0, icon: BookOpen, color: "violet", sparkline: sparklines?.mcqsExtracted },
    { title: "Approval Rate", value: stats.approvalRate ?? 0, suffix: "%", trend: stats.approvalRateTrend ?? 0, icon: CheckCircle2, color: "success", sparkline: sparklines?.approvalRate, decimals: 1 },
    { title: "Active Jobs", value: stats.activeJobs ?? 0, trend: stats.activeJobsTrend ?? 0, icon: Activity, color: "warning", sparkline: sparklines?.activeJobs },
  ] : [];

  return (
    <div className="space-y-6">
      <WelcomeBanner />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your MCQ extraction pipeline</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {quickActions.map((action) => (
            <Button key={action.label} variant="outline" size="sm" className="gap-2 h-9" onClick={() => navigate(action.href)}>
              <action.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>)
          : statCards.map((stat) => (
              <StaggerItem key={stat.title}>
                <StatCard title={stat.title} value={stat.value} suffix={stat.suffix} trend={stat.trend} icon={stat.icon} color={`text-${stat.color}`} sparklineData={stat.sparkline} decimals={stat.decimals} />
              </StaggerItem>
            ))
        }
      </StaggerContainer>

      <SystemIntelligenceBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActiveJobsPanel />
        <ActivityTimeline />
      </div>

      <ProviderHealthStrip />
    </div>
  );
}
