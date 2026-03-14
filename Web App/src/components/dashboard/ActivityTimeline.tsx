import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, CheckCircle2, Cog, Flag, Download, Settings } from "lucide-react";
import { useRecentActivity } from "@/hooks/use-api";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { type LucideIcon } from "lucide-react";
import type { ActivityItem } from "@/lib/api-types";
import { EmptyState } from "@/components/EmptyState";

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
        {activity.length === 0 ? (
          <EmptyState
            icon={FileUp}
            title="No activity yet"
            description="Recent actions will appear here once your workspace starts processing documents."
          />
        ) : (
          <StaggerContainer className="relative space-y-0">
            {activity.slice(0, 5).map((item: ActivityItem, index: number) => {
              const style = typeStyles[item.type] || typeStyles.settings;
              const IconComponent = style.icon;

              return (
                <StaggerItem key={item.id}>
                  <div className="relative flex items-start gap-3 pb-4 last:pb-0">
                    {index < 4 && (
                      <div className="absolute left-[13px] top-7 w-px h-[calc(100%-12px)] bg-border" />
                    )}
                    <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                      <IconComponent className={`h-3.5 w-3.5 ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-xs leading-tight">
                        <span className="font-medium">{item.action}</span>
                        <span className="text-muted-foreground"> — {item.target}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.user} · {item.time}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </CardContent>
    </Card>
  );
}
