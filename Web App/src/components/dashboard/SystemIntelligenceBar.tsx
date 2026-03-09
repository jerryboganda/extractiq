import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Brain, ArrowRight } from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

export function SystemIntelligenceBar() {
  const navigate = useNavigate();

  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StaggerItem>
        <Card className="glass border-border border-l-2 border-l-primary">
          <CardContent className="p-4 flex items-center gap-3">
            <ProgressRing progress={67} size={36} strokeWidth={3} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pipeline Throughput</p>
              <p className="text-xs font-medium mt-0.5">
                Processing <span className="font-semibold text-primary">3 docs</span> at 94.7% accuracy
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
                GPT-4o <span className="text-muted-foreground">· 96.2% acc · 3.2s latency</span>
              </p>
            </div>
            <Activity className="h-3.5 w-3.5 text-success animate-pulse" />
          </CardContent>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card className="glass border-border border-l-2 border-l-warning">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Next Action</p>
              <p className="text-xs font-medium mt-0.5">
                <span className="font-semibold text-warning">12 MCQs</span> awaiting review
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 shrink-0"
              onClick={() => navigate("/review")}
            >
              Review <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
