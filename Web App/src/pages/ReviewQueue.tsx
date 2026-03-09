import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle, XCircle, Flag, SkipForward, ListChecks, X } from "lucide-react";
import { mockReviewQueue } from "@/lib/mock-data";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";

const statusStyles: Record<string, string> = {
  pending: "bg-info/10 text-info border-info/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  flagged: "bg-warning/10 text-warning border-warning/20",
};

const tabValues = ["all", "pending", "approved", "rejected", "flagged"] as const;

export default function ReviewQueue() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return mockReviewQueue.filter((item) => {
      if (tab !== "all" && item.status !== tab) return false;
      if (search && !item.question.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tab, search]);

  const allSelected = filtered.length > 0 && filtered.every((i) => selectedIds.has(i.id));
  const toggleAll = useCallback(() => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((i) => i.id)));
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
          <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and approve extracted MCQs</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="h-9 flex-wrap">
            {tabValues.map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs capitalize">
                {t === "all" ? `All (${mockReviewQueue.length})` : t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search questions..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-success hover:text-success" onClick={() => { toast.success(`Approved ${selectedIds.size} MCQs`); setSelectedIds(new Set()); }}>
                <CheckCircle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Approve</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-destructive hover:text-destructive" onClick={() => { toast.error(`Rejected ${selectedIds.size} MCQs`); setSelectedIds(new Set()); }}>
                <XCircle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Reject</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-warning hover:text-warning" onClick={() => { toast(`Flagged ${selectedIds.size} MCQs`); setSelectedIds(new Set()); }}>
                <Flag className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Flag</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedIds(new Set())}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No items found"
          description="No review items match your current filters. Try adjusting your search or status filter."
          actionLabel="Clear filters"
          onAction={() => { setTab("all"); setSearch(""); }}
        />
      ) : (
        <Card className="glass border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 p-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Question</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Confidence</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Document</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Reviewer</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/review/${item.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`/review/${item.id}`)}
                    tabIndex={0}
                    role="button"
                    className={`border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                      selectedIds.has(item.id) ? "bg-primary/5" : item.confidence < 50 ? "bg-destructive/[0.03]" : item.confidence < 75 ? "bg-warning/[0.03]" : ""
                    }`}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleOne(item.id)} />
                    </td>
                    <td className="p-3 max-w-xs">
                      <p className="font-medium truncate">{item.question}</p>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.confidence >= 90 ? "bg-success" : item.confidence >= 70 ? "bg-warning" : "bg-destructive"
                            }`}
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono">{item.confidence}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={`text-[10px] px-1.5 py-0 ${statusStyles[item.status]}`}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground truncate max-w-[150px] hidden lg:table-cell">{item.document}</td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">{item.reviewer || "—"}</td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:text-success hover:bg-success/10" aria-label="Approve" onClick={() => toast.success("MCQ approved")}>
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" aria-label="Reject" onClick={() => toast.error("MCQ rejected")}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-warning hover:text-warning hover:bg-warning/10 hidden sm:flex" aria-label="Flag" onClick={() => toast("MCQ flagged for review")}>
                          <Flag className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex" aria-label="Skip">
                          <SkipForward className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
