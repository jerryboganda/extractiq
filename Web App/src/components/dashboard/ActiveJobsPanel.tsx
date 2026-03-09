import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { mockActiveJobs } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

const stages = ["Upload", "Parse", "OCR", "Extract", "Validate"];

function StageStepper({ currentStage }: { currentStage: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {stages.map((s, i) => (
        <div key={s} className="flex items-center gap-0.5">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              i < currentStage ? "bg-success" : i === currentStage ? "bg-primary status-pulse" : "bg-border"
            )}
            title={s}
          />
          {i < stages.length - 1 && (
            <div className={cn("h-px w-2", i < currentStage ? "bg-success/50" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

function getStageIndex(stage: string): number {
  const map: Record<string, number> = {
    "Queued": 0,
    "OCR Processing": 2,
    "Extracting MCQs": 3,
  };
  return map[stage] ?? 0;
}

export function ActiveJobsPanel() {
  return (
    <Card className="lg:col-span-2 glass border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Active Jobs</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <StaggerContainer className="space-y-3">
          {mockActiveJobs.map((job) => (
            <StaggerItem key={job.id}>
              <div className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <ProgressRing
                  progress={job.progress}
                  size={44}
                  strokeWidth={3.5}
                  pulse={job.status === "processing"}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{job.document}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={job.status === "processing" ? "default" : "secondary"}
                      className={cn("text-[10px] px-1.5 py-0", job.status === "processing" && "status-pulse")}
                    >
                      {job.stage}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">{job.provider}</span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <StageStepper currentStage={getStageIndex(job.stage)} />
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </CardContent>
    </Card>
  );
}
