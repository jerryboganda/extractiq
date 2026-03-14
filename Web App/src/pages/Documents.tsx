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
import { Search, FileText, BookOpen } from "lucide-react";
import { useDocuments } from "@/hooks/use-api";
import { EmptyState } from "@/components/EmptyState";
import { SortableHeader, SortConfig, toggleSort, useSort } from "@/components/SortableHeader";
import { Checkbox } from "@/components/ui/checkbox";
import type { DocumentListItem } from "@/lib/api-types";

const statusStyles: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  processing: "bg-info/10 text-info border-info/20",
  review: "bg-warning/10 text-warning border-warning/20",
  queued: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

const tabValues = ["all", "queued", "processing", "completed", "review", "failed"] as const;

function countByStatus(documents: DocumentListItem[], status: string) {
  return documents.filter((document) => document.status === status).length;
}

const sortGetters: Record<string, (document: DocumentListItem) => string | number> = {
  filename: (document) => document.filename,
  status: (document) => document.status,
  pages: (document) => document.pages,
  mcqCount: (document) => document.mcqCount,
  confidence: (document) => document.confidence,
  uploadDate: (document) => document.uploadDate,
};

export default function Documents() {
  const navigate = useNavigate();
  const PAGE_SIZE = 10;
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentListItem | null>(null);
  const [sort, setSort] = useState<SortConfig | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const { data: docsData } = useDocuments({ status: tab !== "all" ? tab : undefined });

  const filtered = useMemo(() => {
    const allDocuments = docsData?.items ?? [];
    return allDocuments.filter((document) => {
      if (tab !== "all" && document.status !== tab) return false;
      if (search && !document.filename.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [docsData?.items, search, tab]);

  const allDocuments = docsData?.items ?? [];
  const sorted = useSort(filtered, sort, sortGetters);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginatedDocs = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleSort = (key: string) => setSort((prev) => toggleSort(prev, key));

  const allSelected = paginatedDocs.length > 0 && paginatedDocs.every((document) => selectedIds.has(document.id));
  const toggleAll = useCallback(() => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedDocs.map((document) => document.id)));
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
          <p className="text-sm text-muted-foreground mt-1">{allDocuments.length} documents across all projects</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="gap-2" onClick={() => navigate("/upload")}>
            <FileText className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="h-9 flex-wrap">
            {tabValues.map((value) => (
              <TabsTrigger key={value} value={value} className="text-xs capitalize">
                {value === "all" ? `All (${allDocuments.length})` : `${value} (${countByStatus(allDocuments, value)})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9 h-9 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-2.5 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <span className="text-xs text-muted-foreground ml-auto">Bulk document actions are not available yet.</span>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="No documents match your current filters."
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
                {paginatedDocs.map((document) => (
                  <tr
                    key={document.id}
                    className={`border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${selectedIds.has(document.id) ? "bg-primary/5" : ""}`}
                    onClick={() => setSelectedDoc(document)}
                    onKeyDown={(event) => event.key === "Enter" && setSelectedDoc(document)}
                    tabIndex={0}
                    role="button"
                  >
                    <td className="p-3" onClick={(event) => event.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(document.id)} onCheckedChange={() => toggleOne(document.id)} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{document.filename}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={`text-[10px] px-1.5 py-0 ${statusStyles[document.status]} ${document.status === "processing" ? "status-pulse" : ""}`}>
                        {document.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">{document.project}</td>
                    <td className="p-3 text-right font-mono text-xs hidden sm:table-cell">{document.pages}</td>
                    <td className="p-3 text-right font-mono text-xs hidden sm:table-cell">{document.mcqCount || "—"}</td>
                    <td className="p-3 text-right hidden lg:table-cell">
                      {document.confidence > 0 ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                document.confidence >= 90 ? "bg-success" : document.confidence >= 70 ? "bg-warning" : "bg-destructive"
                              }`}
                              style={{ width: `${document.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono">{document.confidence}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-xs text-muted-foreground hidden lg:table-cell">{document.size}</td>
                    <td className="p-3 text-right text-xs text-muted-foreground hidden md:table-cell">{document.uploadDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                        <div
                          className={`h-full rounded-full transition-all ${selectedDoc.confidence >= 90 ? "bg-success" : selectedDoc.confidence >= 70 ? "bg-warning" : "bg-destructive"}`}
                          style={{ width: `${selectedDoc.confidence}%` }}
                        />
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
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
