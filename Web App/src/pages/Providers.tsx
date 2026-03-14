import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Settings, Zap, Server, Loader2, Trash2 } from "lucide-react";
import { useProviders, useTestProvider, useDeleteProvider } from "@/hooks/use-api";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import type { ProviderItem } from "@/lib/api-types";
import { EmptyState } from "@/components/EmptyState";

const statusDotColors: Record<string, string> = {
  healthy: "bg-success",
  degraded: "bg-warning",
  offline: "bg-destructive",
};

export default function Providers() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: providersData } = useProviders();
  const testProvider = useTestProvider();
  const deleteProvider = useDeleteProvider();
  const allProviders = providersData ?? [];

  const filtered = allProviders.filter((provider: ProviderItem) => statusFilter === "all" || provider.status === statusFilter);

  const handleTest = (provider: ProviderItem) => {
    setTestingId(provider.id);
    testProvider.mutate(provider.id, {
      onSettled: () => setTestingId(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage AI extraction providers</p>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="h-9">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="healthy" className="text-xs">Healthy</TabsTrigger>
          <TabsTrigger value="degraded" className="text-xs">Degraded</TabsTrigger>
          <TabsTrigger value="offline" className="text-xs">Offline</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No providers configured"
          description="Add provider records through the backend or admin tooling, then test them here."
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((provider) => (
            <StaggerItem key={provider.id}>
              <motion.div
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="glass border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10"><Server className="h-5 w-5 text-primary" /></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold">{provider.name}</h3>
                            <span className={`h-2 w-2 rounded-full ${statusDotColors[provider.status]}`} />
                          </div>
                          <p className="text-[11px] text-muted-foreground">{provider.provider} · {provider.model}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Settings className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="gap-2" onClick={() => handleTest(provider)}>
                            <Zap className="h-3.5 w-3.5" /> Test Connectivity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => deleteProvider.mutate(provider.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Accuracy</p>
                        <p className="text-sm font-bold mt-0.5">{provider.accuracy}%</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Latency</p>
                        <p className="text-sm font-bold mt-0.5">{provider.avgLatency}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cost/Record</p>
                        <p className="text-sm font-bold mt-0.5">${provider.costPerRecord}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Error Rate</p>
                        <p className="text-sm font-bold mt-0.5">{provider.errorRate}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">Total cost: <span className="font-semibold text-foreground">${provider.totalCost.toLocaleString()}</span></span>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={testingId === provider.id} onClick={() => handleTest(provider)}>
                        {testingId === provider.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                        {testingId === provider.id ? "Testing..." : "Test"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      <UpgradeBanner
        title="Provider Configuration"
        description="Provider creation and advanced editing should be handled through a dedicated admin workflow, not placeholder UI actions."
      />
    </div>
  );
}
