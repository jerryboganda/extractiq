import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { SortableHeader, SortConfig, toggleSort, useSort } from "@/components/SortableHeader";
import { useAuditLogs } from "@/hooks/use-api";
import type { AuditLogItem } from "@/lib/api-types";

const actionColors: Record<string, string> = {
  "document.upload": "bg-info/10 text-info",
  "job.started": "bg-primary/10 text-primary",
  "job.completed": "bg-success/10 text-success",
  "job.failed": "bg-destructive/10 text-destructive",
  "mcq.approved": "bg-success/10 text-success",
  "mcq.flagged": "bg-warning/10 text-warning",
  "export.generated": "bg-violet/10 text-violet",
  "provider.updated": "bg-muted text-muted-foreground",
  "user.invited": "bg-primary/10 text-primary",
};

const actionCategories: Record<string, string[]> = {
  uploads: ["document.upload"],
  approvals: ["mcq.approved", "mcq.flagged"],
  exports: ["export.generated"],
  system: ["job.started", "job.completed", "job.failed", "provider.updated", "user.invited"],
};

const PAGE_SIZE = 6;

const sortGetters: Record<string, (log: AuditLogItem) => string | number> = {
  timestamp: (log) => log.timestamp,
  actor: (log) => log.actor,
  action: (log) => log.action,
};

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortConfig | null>(null);
  const { data: logsData } = useAuditLogs({ page: page + 1, limit: PAGE_SIZE });

  const filtered = useMemo(() => {
    const allLogs = logsData?.items ?? [];
    return allLogs.filter((log) => {
      const matchesSearch =
        !search ||
        [log.actor, log.resource, log.details, log.action].some((field) =>
          field.toLowerCase().includes(search.toLowerCase()),
        );
      const matchesCategory = category === "all" || actionCategories[category]?.includes(log.action);
      return matchesSearch && matchesCategory;
    });
  }, [category, logsData?.items, search]);

  const sorted = useSort(filtered, sort, sortGetters);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleCategoryChange = (value: string) => { setCategory(value); setPage(0); };
  const handleSearchChange = (value: string) => { setSearch(value); setPage(0); };
  const handleSort = (key: string) => { setSort((prev) => toggleSort(prev, key)); setPage(0); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">System activity and change history</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-9 h-9 text-sm" value={search} onChange={(event) => handleSearchChange(event.target.value)} />
        </div>
        <Tabs value={category} onValueChange={handleCategoryChange}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="uploads" className="text-xs">Uploads</TabsTrigger>
            <TabsTrigger value="approvals" className="text-xs">Approvals</TabsTrigger>
            <TabsTrigger value="exports" className="text-xs">Exports</TabsTrigger>
            <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No logs found"
          description="No audit log entries match your current filters."
          actionLabel="Clear filters"
          onAction={() => { setCategory("all"); setSearch(""); setPage(0); }}
        />
      ) : (
        <Card className="glass border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <SortableHeader label="Timestamp" sortKey="timestamp" sort={sort} onSort={handleSort} />
                  <SortableHeader label="Actor" sortKey="actor" sort={sort} onSort={handleSort} />
                  <SortableHeader label="Action" sortKey="action" sort={sort} onSort={handleSort} />
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Resource</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Details</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3 text-xs font-medium">{log.actor}</td>
                    <td className="p-3"><Badge className={`text-[10px] px-1.5 py-0 font-mono ${actionColors[log.action] || ""}`}>{log.action}</Badge></td>
                    <td className="p-3 text-xs font-mono text-muted-foreground hidden md:table-cell">{log.resource}</td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} entries · Page {page + 1} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
