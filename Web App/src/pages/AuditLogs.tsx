import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { SortableHeader, SortConfig, toggleSort, useSort } from "@/components/SortableHeader";

const mockLogs = [
  { id: "log_01", timestamp: "2025-03-08 14:32:15", actor: "Dr. Sarah Chen", action: "document.upload", resource: "Pharmacology_Ch12.pdf", details: "4.2 MB PDF uploaded" },
  { id: "log_02", timestamp: "2025-03-08 14:30:00", actor: "System", action: "job.started", resource: "job_001", details: "Extraction job started for Pharmacology_Ch12.pdf" },
  { id: "log_03", timestamp: "2025-03-08 14:15:42", actor: "Prof. Amir Malik", action: "mcq.approved", resource: "mcq_batch_47", details: "Batch of 12 MCQs approved" },
  { id: "log_04", timestamp: "2025-03-08 13:50:10", actor: "Dr. Ji-Yeon Kim", action: "mcq.flagged", resource: "mcq_042", details: "Flagged for inaccurate answer option" },
  { id: "log_05", timestamp: "2025-03-08 12:00:00", actor: "Dr. Sarah Chen", action: "export.generated", resource: "QTI_Export_Batch_47", details: "410 records exported as QTI" },
  { id: "log_06", timestamp: "2025-03-08 11:30:00", actor: "Admin", action: "provider.updated", resource: "GPT-4o", details: "Model updated to gpt-4o-2025-02" },
  { id: "log_07", timestamp: "2025-03-08 10:45:00", actor: "Dr. Sarah Chen", action: "document.upload", resource: "Anatomy_Final_2025.pdf", details: "12.8 MB PDF uploaded" },
  { id: "log_08", timestamp: "2025-03-08 09:20:00", actor: "System", action: "job.completed", resource: "job_098", details: "Extraction completed — 245 MCQs" },
  { id: "log_09", timestamp: "2025-03-07 16:30:00", actor: "Prof. Amir Malik", action: "mcq.approved", resource: "mcq_batch_46", details: "Batch of 28 MCQs approved" },
  { id: "log_10", timestamp: "2025-03-07 15:00:00", actor: "Dr. Ji-Yeon Kim", action: "document.upload", resource: "Neuroscience_Unit5.pdf", details: "3.7 MB PDF uploaded" },
  { id: "log_11", timestamp: "2025-03-07 12:00:00", actor: "System", action: "job.failed", resource: "job_097", details: "Extraction failed — timeout after 15 min" },
  { id: "log_12", timestamp: "2025-03-07 10:10:00", actor: "Dr. Sarah Chen", action: "export.generated", resource: "CSV_Export_Batch_45", details: "320 records exported as CSV" },
  { id: "log_13", timestamp: "2025-03-07 08:45:00", actor: "Admin", action: "user.invited", resource: "c.rivera@university.edu", details: "Invited as Viewer" },
  { id: "log_14", timestamp: "2025-03-06 17:00:00", actor: "Dr. Carlos Rivera", action: "document.upload", resource: "Microbiology_Lab.pdf", details: "2.9 MB PDF uploaded" },
];

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

const sortGetters: Record<string, (l: typeof mockLogs[0]) => string | number> = {
  timestamp: (l) => l.timestamp,
  actor: (l) => l.actor,
  action: (l) => l.action,
};

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortConfig | null>(null);

  const filtered = useMemo(() => {
    return mockLogs.filter((log) => {
      const matchesSearch = !search || [log.actor, log.resource, log.details, log.action].some((f) => f.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = category === "all" || (actionCategories[category]?.includes(log.action));
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const sorted = useSort(filtered, sort, sortGetters);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleCategoryChange = (v: string) => { setCategory(v); setPage(0); };
  const handleSearchChange = (v: string) => { setSearch(v); setPage(0); };
  const handleSort = (key: string) => { setSort((prev) => toggleSort(prev, key)); setPage(0); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">System activity and change history</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Logs exported")}><Download className="h-3.5 w-3.5" /> Export Logs</Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => handleSearchChange(e.target.value)} />
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
