import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Search, RefreshCw, Eye, Briefcase, RotateCcw } from "lucide-react";
import { useCancelJob, useJobs, useRetryJob } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { SortableHeader, SortConfig, toggleSort, useSort } from "@/components/SortableHeader";
import { Checkbox } from "@/components/ui/checkbox";
import type { JobListItem } from "@/lib/api-types";

const statusStyles: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  processing: "bg-info/10 text-info border-info/20",
  queued: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

const stages = ["Upload", "Parse", "OCR", "Extract", "Validate"];

function StageStepper({ currentStage, status }: { currentStage: number; status: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {stages.map((stage, index) => (
        <div key={stage} className="flex items-center gap-0.5">
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              status === "failed" && index === currentStage - 1 ? "bg-destructive"
                : index < currentStage ? "bg-success"
                : index === currentStage ? "bg-primary status-pulse"
                : "bg-border",
            )}
            title={stage}
          />
          {index < stages.length - 1 && (
            <div className={cn("h-px w-3", index < currentStage ? "bg-success/50" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

function VerticalStageStepper({ currentStage, status }: { currentStage: number; status: string }) {
  return (
    <div className="space-y-3">
      {stages.map((stage, index) => (
        <div key={stage} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "h-3 w-3 rounded-full transition-colors shrink-0",
                status === "failed" && index === currentStage - 1 ? "bg-destructive"
                  : index < currentStage ? "bg-success"
                  : index === currentStage ? "bg-primary status-pulse"
                  : "bg-border",
              )}
            />
            {index < stages.length - 1 && <div className={cn("w-px h-5 mt-1", index < currentStage ? "bg-success/50" : "bg-border")} />}
          </div>
          <span className={cn("text-sm -mt-0.5", index < currentStage ? "text-foreground" : index === currentStage ? "text-primary font-medium" : "text-muted-foreground")}>
            {stage}
          </span>
        </div>
      ))}
    </div>
  );
}

const sortGetters: Record<string, (job: JobListItem) => string | number> = {
  documentName: (job) => job.documentName,
  status: (job) => job.status,
  provider: (job) => job.provider,
  progress: (job) => job.progress,
  duration: (job) => job.duration,
};

export default function Jobs() {
  const PAGE_SIZE = 10;
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobListItem | null>(null);
  const [sort, setSort] = useState<SortConfig | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const { data: jobsData, refetch } = useJobs({ status: tab !== "all" ? tab : undefined });
  const retryJob = useRetryJob();
  const cancelJob = useCancelJob();

  const filtered = useMemo(() => {
    const liveJobs = jobsData?.items ?? [];
    return liveJobs.filter((job) => {
      if (tab !== "all" && job.status !== tab) return false;
      if (search && !job.documentName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [jobsData?.items, search, tab]);

  const liveJobs = jobsData?.items ?? [];
  const sorted = useSort(filtered, sort, sortGetters);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginatedJobs = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleSort = (key: string) => setSort((prev) => toggleSort(prev, key));

  const allSelected = paginatedJobs.length > 0 && paginatedJobs.every((job) => selectedIds.has(job.id));
  const toggleAll = useCallback(() => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedJobs.map((job) => job.id)));
  }, [allSelected, paginatedJobs]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor extraction pipeline jobs</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="h-9 flex-wrap">
            <TabsTrigger value="all" className="text-xs">All ({liveJobs.length})</TabsTrigger>
            <TabsTrigger value="queued" className="text-xs">Queued</TabsTrigger>
            <TabsTrigger value="processing" className="text-xs">Processing</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
            <TabsTrigger value="failed" className="text-xs">Failed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search jobs..." className="pl-9 h-9 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-2.5 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <span className="text-xs text-muted-foreground ml-auto">Bulk job actions are not available yet.</span>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="No jobs match your current filters."
          actionLabel="Clear filters"
          onAction={() => { setTab("all"); setSearch(""); }}
        />
      ) : (
        <Card className="glass border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 w-10" onClick={(event) => event.stopPropagation()}>
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Job ID</th>
                  <SortableHeader label="Document" sortKey="documentName" sort={sort} onSort={handleSort} />
                  <SortableHeader label="Status" sortKey="status" sort={sort} onSort={handleSort} />
                  <SortableHeader label="Provider" sortKey="provider" sort={sort} onSort={handleSort} className="hidden md:table-cell" />
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Pipeline</th>
                  <SortableHeader label="Duration" sortKey="duration" sort={sort} onSort={handleSort} className="text-right hidden sm:table-cell" />
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedJobs.map((job) => (
                  <tr
                    key={job.id}
                    className={`border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${selectedIds.has(job.id) ? "bg-primary/5" : ""}`}
                    onClick={() => setSelectedJob(job)}
                    onKeyDown={(event) => event.key === "Enter" && setSelectedJob(job)}
                    tabIndex={0}
                    role="button"
                  >
                    <td className="p-3" onClick={(event) => event.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(job.id)} onCheckedChange={() => toggleOne(job.id)} />
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">{job.id}</td>
                    <td className="p-3 font-medium truncate max-w-[200px]">{job.documentName}</td>
                    <td className="p-3">
                      <Badge className={`text-[10px] px-1.5 py-0 ${statusStyles[job.status]} ${job.status === "processing" ? "status-pulse" : ""}`}>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs hidden md:table-cell">{job.provider}</td>
                    <td className="p-3 hidden md:table-cell"><StageStepper currentStage={job.currentStage} status={job.status} /></td>
                    <td className="p-3 text-right text-xs font-mono text-muted-foreground hidden sm:table-cell">{job.duration}</td>
                    <td className="p-3 text-right" onClick={(event) => event.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="View job details" onClick={() => setSelectedJob(job)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Sheet open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedJob && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base">{selectedJob.documentName}</SheetTitle>
                <SheetDescription>Job {selectedJob.id}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs px-2 py-0.5 ${statusStyles[selectedJob.status]}`}>{selectedJob.status}</Badge>
                  <span className="text-xs text-muted-foreground">via {selectedJob.provider}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono">{selectedJob.progress}%</span>
                  </div>
                  <Progress value={selectedJob.progress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">Started</p><p className="font-medium">{selectedJob.startedAt}</p></div>
                  <div><p className="text-muted-foreground text-xs">Duration</p><p className="font-mono font-medium">{selectedJob.duration}</p></div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pipeline Stages</h4>
                  <VerticalStageStepper currentStage={selectedJob.currentStage} status={selectedJob.status} />
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Detailed worker logs are not exposed in the UI yet.
                </div>
                {selectedJob.status === "failed" && (
                  <Button className="w-full gap-2" onClick={() => retryJob.mutate(selectedJob.id)}>
                    <RotateCcw className="h-3.5 w-3.5" /> Retry Job
                  </Button>
                )}
                {selectedJob.status === "processing" && (
                  <Button variant="outline" className="w-full" onClick={() => cancelJob.mutate(selectedJob.id)}>
                    Cancel Job
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
