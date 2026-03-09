import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Search, Download, FileText, RotateCcw, BookOpen, Trash2, X } from "lucide-react";
import { mockDocuments } from "@/lib/mock-data";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { SortableHeader, SortConfig, toggleSort, useSort } from "@/components/SortableHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";

const statusStyles: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  processing: "bg-info/10 text-info border-info/20",
  review: "bg-warning/10 text-warning border-warning/20",
  queued: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

const tabValues = ["all", "queued", "processing", "completed", "review", "failed"] as const;

function countByStatus(status: string) {
  return mockDocuments.filter((d) => d.status === status).length;
}

const sortGetters: Record<string, (d: typeof mockDocuments[0]) => string | number> = {
  filename: (d) => d.filename,
  status: (d) => d.status,
  pages: (d) => d.pages,
  mcqCount: (d) => d.mcqCount,
  confidence: (d) => d.confidence,
  uploadDate: (d) => d.uploadDate,
};

export default function Documents() {
  const navigate = useNavigate();
  const PAGE_SIZE = 10;
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<typeof mockDocuments[0] | null>(null);
  const [sort, setSort] = useState<SortConfig | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockDocuments.filter((doc) => {
      if (tab !== "all" && doc.status !== tab) return false;
      if (search && !doc.filename.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tab, search]);

  const sorted = useSort(filtered, sort, sortGetters);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginatedDocs = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: string) => setSort((prev) => toggleSort(prev, key));

  const allSelected = paginatedDocs.length > 0 && paginatedDocs.every((d) => selectedIds.has(d.id));
  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedDocs.map((d) => d.id)));
    }
  }, [allSelected, paginatedDocs]);

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
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">{mockDocuments.length} documents across all projects</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span></Button>
          <Button size="sm" className="gap-2"><FileText className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Upload</span></Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="h-9 flex-wrap">
            {tabValues.map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs capitalize">
                {t === "all" ? `All (${mockDocuments.length})` : `${t} (${countByStatus(t)})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => { toast.success(`Exporting ${selectedIds.size} documents`); setSelectedIds(new Set()); }}>
                <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => { toast.success(`Reprocessing ${selectedIds.size} documents`); setSelectedIds(new Set()); }}>
                <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Reprocess</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-destructive hover:text-destructive" onClick={() => { toast.success(`Deleted ${selectedIds.size} documents`); setSelectedIds(new Set()); }}>
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
          icon={FileText}
          title="No documents found"
          description="No documents match your current filters. Try adjusting your search or status filter."
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
                  <SortableHeader label="Filename" sortKey="filename" sort={sort} onSort={handleSort} />
                  <SortableHeader label="Status" sortKey="status" sort={sort} onSort={handleSort} />
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Project</th>
                  <SortableHeader label="Pages" sortKey="pages" sort={sort} onSort={handleSort} className="text-right hidden sm:table-cell" />
                  <SortableHeader label="MCQs" sortKey="mcqCount" sort={sort} onSort={handleSort} className="text-right hidden sm:table-cell" />
                  <SortableHeader label="Confidence" sortKey="confidence" sort={sort} onSort={handleSort} className="text-right hidden lg:table-cell" />
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Size</th>
                  <SortableHeader label="Date" sortKey="uploadDate" sort={sort} onSort={handleSort} className="text-right hidden md:table-cell" />
                </tr>
              </thead>
              <tbody>
                {paginatedDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${selectedIds.has(doc.id) ? "bg-primary/5" : ""}`}
                    onClick={() => setSelectedDoc(doc)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedDoc(doc)}
                    tabIndex={0}
                    role="button"
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(doc.id)} onCheckedChange={() => toggleOne(doc.id)} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={`text-[10px] px-1.5 py-0 ${statusStyles[doc.status]} ${doc.status === "processing" ? "status-pulse" : ""}`}>
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">{doc.project}</td>
                    <td className="p-3 text-right font-mono text-xs hidden sm:table-cell">{doc.pages}</td>
                    <td className="p-3 text-right font-mono text-xs hidden sm:table-cell">{doc.mcqCount || "—"}</td>
                    <td className="p-3 text-right hidden lg:table-cell">
                      {doc.confidence > 0 ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                doc.confidence >= 90 ? "bg-success" : doc.confidence >= 70 ? "bg-warning" : "bg-destructive"
                              }`}
                              style={{ width: `${doc.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono">{doc.confidence}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-xs text-muted-foreground hidden lg:table-cell">{doc.size}</td>
                    <td className="p-3 text-right text-xs text-muted-foreground hidden md:table-cell">{doc.uploadDate}</td>
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

      <Sheet open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedDoc && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {selectedDoc.filename}
                </SheetTitle>
                <SheetDescription>{selectedDoc.project}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 mt-6">
                <Badge className={`text-xs px-2 py-0.5 ${statusStyles[selectedDoc.status]}`}>
                  {selectedDoc.status}
                </Badge>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs">Pages</p><p className="font-mono font-medium">{selectedDoc.pages}</p></div>
                  <div><p className="text-muted-foreground text-xs">MCQs Extracted</p><p className="font-mono font-medium">{selectedDoc.mcqCount || "—"}</p></div>
                  <div><p className="text-muted-foreground text-xs">File Size</p><p className="font-medium">{selectedDoc.size}</p></div>
                  <div><p className="text-muted-foreground text-xs">Upload Date</p><p className="font-medium">{selectedDoc.uploadDate}</p></div>
                </div>
                {selectedDoc.confidence > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1.5">Confidence</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${selectedDoc.confidence >= 90 ? "bg-success" : selectedDoc.confidence >= 70 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${selectedDoc.confidence}%` }} />
                      </div>
                      <span className="text-sm font-mono font-medium">{selectedDoc.confidence}%</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2">
                  {selectedDoc.mcqCount > 0 && (
                    <Button variant="outline" className="w-full gap-2" onClick={() => { setSelectedDoc(null); navigate("/mcq-records"); }}>
                      <BookOpen className="h-3.5 w-3.5" /> View MCQs
                    </Button>
                  )}
                  <Button variant="outline" className="w-full gap-2" onClick={() => toast.success("Reprocess job queued for " + selectedDoc.filename)}>
                    <RotateCcw className="h-3.5 w-3.5" /> Reprocess
                  </Button>
                  <Button variant="outline" className="w-full gap-2" onClick={() => toast.success("Download started for " + selectedDoc.filename)}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
