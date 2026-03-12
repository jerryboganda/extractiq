import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Edit, Trash2, Download, X } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useMcqRecords } from "@/hooks/use-api";

const difficultyColors: Record<string, string> = {
  Easy: "bg-success/10 text-success border-success/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  Hard: "bg-destructive/10 text-destructive border-destructive/20",
};

type DifficultyFilter = "All" | "Easy" | "Medium" | "Hard";
type ConfidenceFilter = "All" | "High" | "Medium" | "Low";

export default function McqRecords() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("All");
  const [confidence, setConfidence] = useState<ConfidenceFilter>("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: mcqData } = useMcqRecords({
    confidence: confidence !== 'All' ? confidence.toLowerCase() : undefined,
  });
  const allMcqs = mcqData?.items ?? [];

  const filtered = useMemo(() => {
    return allMcqs.filter((mcq: any) => {
      if (difficulty !== "All" && mcq.difficulty !== difficulty) return false;
      if (confidence === "High" && mcq.confidence < 90) return false;
      if (confidence === "Medium" && (mcq.confidence < 70 || mcq.confidence >= 90)) return false;
      if (confidence === "Low" && mcq.confidence >= 70) return false;
      if (search && !(mcq.question || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [difficulty, confidence, search, allMcqs]);

  const allSelected = filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));
  const toggleAll = useCallback(() => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((m) => m.id)));
  }, [allSelected, filtered]);
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
          <h1 className="text-2xl font-bold tracking-tight">MCQ Records</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse and edit extracted questions</p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={toggleAll}>
              {allSelected ? "Deselect All" : "Select All"}
            </Button>
          )}
          <Badge variant="secondary" className="text-xs">{filtered.length} records</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search MCQs..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyFilter)}>
            <TabsList className="h-8">
              {(["All", "Easy", "Medium", "Hard"] as const).map((d) => (
                <TabsTrigger key={d} value={d} className="text-xs px-3 h-7">{d}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Tabs value={confidence} onValueChange={(v) => setConfidence(v as ConfidenceFilter)}>
            <TabsList className="h-8">
              <TabsTrigger value="All" className="text-xs px-3 h-7">All</TabsTrigger>
              <TabsTrigger value="High" className="text-xs px-3 h-7">90+</TabsTrigger>
              <TabsTrigger value="Medium" className="text-xs px-3 h-7">70–90</TabsTrigger>
              <TabsTrigger value="Low" className="text-xs px-3 h-7">&lt;70</TabsTrigger>
            </TabsList>
          </Tabs>
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
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => { toast.success(`Exported ${selectedIds.size} MCQs`); setSelectedIds(new Set()); }}>
                <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-destructive hover:text-destructive" onClick={() => { toast.success(`Deleted ${selectedIds.size} MCQs`); setSelectedIds(new Set()); }}>
                <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Delete</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedIds(new Set())}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No MCQs found"
            description="No MCQ records match your current filters. Try adjusting your difficulty or confidence filters."
            actionLabel="Clear filters"
            onAction={() => { setDifficulty("All"); setConfidence("All"); setSearch(""); }}
          />
        ) : (
          <StaggerContainer className="space-y-4">
            {filtered.map((mcq) => (
              <StaggerItem key={mcq.id}>
                <motion.div
                  whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                >
                  <Card className={`glass border-border ${selectedIds.has(mcq.id) ? "ring-1 ring-primary/40" : ""}`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <Checkbox
                            checked={selectedIds.has(mcq.id)}
                            onCheckedChange={() => toggleOne(mcq.id)}
                            className="mr-1 shrink-0"
                          />
                          <BookOpen className="h-4 w-4 text-primary shrink-0" />
                          <Badge className={`text-[10px] px-1.5 py-0 ${difficultyColors[mcq.difficulty]}`}>{mcq.difficulty}</Badge>
                          {mcq.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit MCQ"><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label="Delete MCQ"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-3">{mcq.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {mcq.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg text-xs border ${
                              idx === mcq.correct
                                ? "bg-success/10 border-success/30 text-success font-medium"
                                : "bg-muted/50 border-border/50"
                            }`}
                          >
                            <span className="font-semibold mr-1.5">{String.fromCharCode(65 + idx)}.</span>
                            {opt}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[11px] text-muted-foreground">Confidence:</span>
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${mcq.confidence >= 90 ? "bg-success" : mcq.confidence >= 70 ? "bg-warning" : "bg-destructive"}`}
                            style={{ width: `${mcq.confidence}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono">{mcq.confidence}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
