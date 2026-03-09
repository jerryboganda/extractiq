import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText, BookOpen, CheckCircle2, Activity, Upload, FolderKanban, ListChecks,
} from "lucide-react";
import { mockStats, mockSparklineData } from "@/lib/mock-data";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatCardSkeleton } from "@/components/ui/skeleton-cards";
import { ActiveJobsPanel } from "@/components/dashboard/ActiveJobsPanel";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { ProviderHealthStrip } from "@/components/dashboard/ProviderHealthStrip";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { SystemIntelligenceBar } from "@/components/dashboard/SystemIntelligenceBar";
import { useSimulatedLoading } from "@/hooks/use-simulated-loading";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

const statCards = [
  { title: "Documents Processed", value: mockStats.documentsProcessed, trend: mockStats.documentsProcessedTrend, icon: FileText, color: "electric", sparkline: mockSparklineData.documentsProcessed },
  { title: "MCQs Extracted", value: mockStats.mcqsExtracted, trend: mockStats.mcqsExtractedTrend, icon: BookOpen, color: "violet", sparkline: mockSparklineData.mcqsExtracted },
  { title: "Approval Rate", value: mockStats.approvalRate, suffix: "%", trend: mockStats.approvalRateTrend, icon: CheckCircle2, color: "success", sparkline: mockSparklineData.approvalRate, decimals: 1 },
  { title: "Active Jobs", value: mockStats.activeJobs, trend: mockStats.activeJobsTrend, icon: Activity, color: "warning", sparkline: mockSparklineData.activeJobs },
];

const quickActions = [
  { label: "Upload Documents", icon: Upload, href: "/upload" },
  { label: "New Project", icon: FolderKanban, href: "/projects" },
  { label: "Review Queue", icon: ListChecks, href: "/review" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const isLoading = useSimulatedLoading(800);

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
        {isLoading
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
