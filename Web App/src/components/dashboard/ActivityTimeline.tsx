import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, CheckCircle2, Cog, Flag, Download, Settings } from "lucide-react";
import { useRecentActivity } from "@/hooks/use-api";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { type LucideIcon } from "lucide-react";

const typeStyles: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  upload: { icon: FileUp, bg: "bg-primary/10", color: "text-primary" },
  approve: { icon: CheckCircle2, bg: "bg-success/10", color: "text-success" },
  extract: { icon: Cog, bg: "bg-violet-500/10", color: "text-violet-500" },
  flag: { icon: Flag, bg: "bg-destructive/10", color: "text-destructive" },
  export: { icon: Download, bg: "bg-info/10", color: "text-info" },
  settings: { icon: Settings, bg: "bg-warning/10", color: "text-warning" },
};

export function ActivityTimeline() {
  const navigate = useNavigate();
  const { data: recentActivity } = useRecentActivity();
  const activity = recentActivity ?? [];

  return (
    <Card className="glass border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground h-7"
          onClick={() => navigate("/audit")}
        >
          View all
        </Button>
      </CardHeader>
      <CardContent>
        <StaggerContainer className="relative space-y-0">
          {activity.slice(0, 5).map((a: any, i: number) => {
            const style = typeStyles[a.type] || typeStyles.settings;
            const IconComponent = style.icon;
            return (
              <StaggerItem key={a.id}>
                <div className="relative flex items-start gap-3 pb-4 last:pb-0">
                  {i < 4 && (
                    <div className="absolute left-[13px] top-7 w-px h-[calc(100%-12px)] bg-border" />
                  )}
                  <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                    <IconComponent className={`h-3.5 w-3.5 ${style.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-xs leading-tight">
                      <span className="font-medium">{a.action}</span>
                      <span className="text-muted-foreground"> — {a.target}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {a.user} · {a.time}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </CardContent>
    </Card>
  );
}
