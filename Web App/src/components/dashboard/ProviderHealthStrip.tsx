import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useProviderHealth } from "@/hooks/use-api";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

const statusColors: Record<string, string> = {
  healthy: "bg-success",
  degraded: "bg-warning",
  offline: "bg-destructive",
};

export function ProviderHealthStrip() {
  const { data: providerHealth } = useProviderHealth();
  const providers = providerHealth ?? [];

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Provider Health</h3>
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TooltipProvider delayDuration={200}>
          {providers.map((p: any) => (
            <StaggerItem key={p.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="glass border-border hover-lift cursor-default">
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={cn(
                          "absolute inline-flex h-full w-full rounded-full opacity-75",
                          statusColors[p.status],
                          p.status === "healthy" && "animate-ping"
                        )} />
                        <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", statusColors[p.status])} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.latency}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-semibold">{p.name}</p>
                  <p>Accuracy: {p.accuracy}%</p>
                  <p>Latency: {p.latency}</p>
                  <p>Status: {p.status}</p>
                </TooltipContent>
              </Tooltip>
            </StaggerItem>
          ))}
        </TooltipProvider>
      </StaggerContainer>
    </div>
  );
}
