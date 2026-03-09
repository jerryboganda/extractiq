import { useState, useMemo, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Search, RefreshCw, Eye, Briefcase, RotateCcw, Trash2, XCircle, X } from "lucide-react";
import { mockJobs } from "@/lib/mock-data";
import type { JobStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { SortableHeader, SortConfig, toggleSort, useSort } from "@/components/SortableHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";

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
      {stages.map((s, i) => (
        <div key={s} className="flex items-center gap-0.5">
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              status === "failed" && i === currentStage - 1 ? "bg-destructive"
                : i < currentStage ? "bg-success"
                : i === currentStage ? "bg-primary status-pulse"
                : "bg-border"
            )}
            title={s}
          />
          {i < stages.length - 1 && (
            <div className={cn("h-px w-3", i < currentStage ? "bg-success/50" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

function VerticalStageStepper({ currentStage, status }: { currentStage: number; status: string }) {
  return (
    <div className="space-y-3">
      {stages.map((s, i) => (
        <div key={s} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className={cn("h-3 w-3 rounded-full transition-colors shrink-0",
              status === "failed" && i === currentStage - 1 ? "bg-destructive"
                : i < currentStage ? "bg-success"
                : i === currentStage ? "bg-primary status-pulse"
                : "bg-border"
            )} />
            {i < stages.length - 1 && <div className={cn("w-px h-5 mt-1", i < currentStage ? "bg-success/50" : "bg-border")} />}
          </div>
          <span className={cn("text-sm -mt-0.5", i < currentStage ? "text-foreground" : i === currentStage ? "text-primary font-medium" : "text-muted-foreground")}>{s}</span>
        </div>
      ))}
    </div>
  );
}

const mockLogs = [
  "[14:32:01] Starting document upload...",
  "[14:32:03] Upload complete. Size: 4.2 MB",
  "[14:32:04] Parsing PDF structure...",
  "[14:32:08] Detected 48 pages, 12 chapters",
  "[14:32:09] Running OCR on scanned pages...",
  "[14:32:45] OCR complete. Text coverage: 98.2%",
  "[14:32:46] Starting MCQ extraction via GPT-4o...",
  "[14:33:15] Extracted 24/48 pages processed...",
];

const sortGetters: Record<string, (j: typeof mockJobs[0]) => string | number> = {
  documentName: (j) => j.documentName,
  status: (j) => j.status,
  provider: (j) => j.provider,
  progress: (j) => j.progress,
  duration: (j) => j.duration,
};

export default function Jobs() {
  const PAGE_SIZE = 10;
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<typeof mockJobs[0] | null>(null);
  const [sort, setSort] = useState<SortConfig | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [liveJobs, setLiveJobs] = useState(mockJobs);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveJobs((prev) =>
        prev.map((job) => {
          if (job.status !== "processing") return job;
          const increment = Math.floor(Math.random() * 5) + 1;
          const newProgress = Math.min(job.progress + increment, 100);
          const newStage = Math.min(Math.floor(newProgress / 20), 5);
          if (newProgress >= 100) {
            toast.success(`${job.documentName} — extraction complete!`);
            return { ...job, progress: 100, status: "completed" as const, currentStage: 5 };
          }
          return { ...job, progress: newProgress, currentStage: newStage };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return liveJobs.filter((job) => {
      if (tab !== "all" && job.status !== tab) return false;
      if (search && !job.documentName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tab, search, liveJobs]);

  const sorted = useSort(filtered, sort, sortGetters);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginatedJobs = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleSort = (key: string) => setSort((prev) => toggleSort(prev, key));

  const allSelected = paginatedJobs.length > 0 && paginatedJobs.every((j) => selectedIds.has(j.id));
  const toggleAll = useCallback(() => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedJobs.map((j) => j.id)));
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
        <Button variant="outline" size="sm" className="gap-2">
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
          <Input placeholder="Search jobs..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 flex-wrap"
          >
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <div className="flex gap-2 ml-auto flex-wrap">
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => { toast.success(`Retrying ${selectedIds.size} jobs`); setSelectedIds(new Set()); }}>
                <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Retry</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => { toast.success(`Cancelling ${selectedIds.size} jobs`); setSelectedIds(new Set()); }}>
                <XCircle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-destructive hover:text-destructive" onClick={() => { toast.success(`Deleted ${selectedIds.size} jobs`); setSelectedIds(new Set()); }}>
                <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Delete</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedIds(new Set())}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <th className="p-3 w-10" onClick={(e) => e.stopPropagation()}>
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
                    onKeyDown={(e) => e.key === "Enter" && setSelectedJob(job)}
                    tabIndex={0}
                    role="button"
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
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
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="View job details" onClick={() => setSelectedJob(job)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {sorted.length} results
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" className="h-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
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
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Logs</h4>
                  <div className="bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto scrollbar-thin">
                    <pre className="text-[11px] font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {mockLogs.slice(0, selectedJob.currentStage * 2).join("\n")}
                    </pre>
                  </div>
                </div>
                {selectedJob.status === "failed" && (
                  <Button className="w-full gap-2" onClick={() => { setSelectedJob(null); toast.success("Job retry queued"); }}>
                    <RotateCcw className="h-3.5 w-3.5" /> Retry Job
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
