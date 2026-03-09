import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface PdfViewerPanelProps {
  documentName: string;
  page: number;
  pageContent: string;
  sourceExcerpt: string;
}

export function PdfViewerPanel({ documentName, page, pageContent, sourceExcerpt }: PdfViewerPanelProps) {
  // Highlight the source excerpt within the page content
  const highlightContent = () => {
    const idx = pageContent.indexOf(sourceExcerpt);
    if (idx === -1) {
      return (
        <>
          <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{pageContent}</p>
          <div className="mt-4 rounded-md border-2 border-warning/60 bg-warning/5 p-3 shadow-[0_0_12px_hsl(var(--warning)/0.15)]">
            <p className="text-xs font-semibold text-warning mb-1">📌 Source Passage</p>
            <p className="text-sm leading-relaxed text-foreground/90">{sourceExcerpt}</p>
          </div>
        </>
      );
    }
    const before = pageContent.slice(0, idx);
    const after = pageContent.slice(idx + sourceExcerpt.length);
    return (
      <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
        {before}
        <mark className="inline rounded bg-warning/20 text-foreground ring-2 ring-warning/40 px-0.5 shadow-[0_0_8px_hsl(var(--warning)/0.2)]">
          {sourceExcerpt}
        </mark>
        {after}
      </p>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Document header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground truncate">{documentName}</span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          Page {page}
        </span>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Card className="glass border-border/50 p-6 min-h-[500px]">
          {highlightContent()}
        </Card>
      </div>

      {/* Page navigation */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-border">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs font-mono text-muted-foreground">Page {page}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
