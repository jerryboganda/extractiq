import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Brain, ArrowRight } from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { useActiveJobs, useProviderHealth, useReviewQueue } from "@/hooks/use-api";
import type { DashboardStats } from "@/lib/api-types";

export function SystemIntelligenceBar({ stats }: { stats?: DashboardStats }) {
  const navigate = useNavigate();
  const { data: activeJobs } = useActiveJobs();
  const { data: reviewQueue } = useReviewQueue({ page: 1, limit: 1 });
  const { data: providerHealth } = useProviderHealth();

  const queuedForReview = Array.isArray(reviewQueue) ? reviewQueue.length : reviewQueue?.total ?? 0;
  const activeJobCount = activeJobs?.length ?? stats?.activeJobs ?? 0;
  const topProvider = providerHealth?.[0];
  const progress = stats?.documentsProcessed
    ? Math.min(100, Math.round(((stats.mcqsExtracted ?? 0) / Math.max(stats.documentsProcessed, 1)) * 100))
    : 0;

  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StaggerItem>
        <Card className="glass border-border border-l-2 border-l-primary">
          <CardContent className="p-4 flex items-center gap-3">
            <ProgressRing progress={progress} size={36} strokeWidth={3} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pipeline Throughput</p>
              <p className="text-xs font-medium mt-0.5">
                {activeJobCount > 0
                  ? <>Processing <span className="font-semibold text-primary">{activeJobCount} active job{activeJobCount === 1 ? "" : "s"}</span></>
                  : "No active processing right now"}
              </p>
            </div>
          </CardContent>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card className="glass border-border border-l-2 border-l-violet-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Model Status</p>
              <p className="text-xs font-medium mt-0.5">
                {topProvider
                  ? <>{topProvider.name} <span className="text-muted-foreground">· {topProvider.accuracy}% acc · {topProvider.latency}</span></>
                  : "No provider benchmarks available yet"}
              </p>
            </div>
            <Activity className={`h-3.5 w-3.5 ${topProvider ? "text-success animate-pulse" : "text-muted-foreground"}`} />
          </CardContent>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card className="glass border-border border-l-2 border-l-warning">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Next Action</p>
              <p className="text-xs font-medium mt-0.5">
                {queuedForReview > 0
                  ? <><span className="font-semibold text-warning">{queuedForReview} MCQ{queuedForReview === 1 ? "" : "s"}</span> awaiting review</>
                  : "Upload your first document to begin processing"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 shrink-0"
              onClick={() => navigate(queuedForReview > 0 ? "/review" : "/upload")}
            >
              {queuedForReview > 0 ? "Review" : "Upload"} <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
