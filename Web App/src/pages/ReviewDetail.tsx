import { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PdfViewerPanel } from "@/components/review/PdfViewerPanel";
import { McqEditorPanel } from "@/components/review/McqEditorPanel";
import { ReviewActionBar } from "@/components/review/ReviewActionBar";
import { mockReviewDetails, mockReviewIds } from "@/lib/mock-data";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const statusStyles: Record<string, string> = {
  pending: "bg-info/10 text-info border-info/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  flagged: "bg-warning/10 text-warning border-warning/20",
};

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const detail = id ? mockReviewDetails[id] : undefined;

  const currentIndex = id ? mockReviewIds.indexOf(id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < mockReviewIds.length - 1;

  const goTo = useCallback((direction: "prev" | "next") => {
    const nextIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < mockReviewIds.length) {
      navigate(`/review/${mockReviewIds[nextIndex]}`);
    }
  }, [currentIndex, navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case "a": toast("✅ MCQ approved successfully"); break;
        case "r": toast("❌ MCQ rejected"); break;
        case "f": toast("🚩 MCQ flagged for review"); break;
        case "arrowleft": hasPrev && goTo("prev"); break;
        case "arrowright": hasNext && goTo("next"); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasPrev, hasNext, goTo]);

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Review item not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/review")} aria-label="Back to review queue">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold truncate">{detail.document}</h1>
            <Badge className={`text-[10px] px-1.5 py-0 ${statusStyles[detail.status]}`}>
              {detail.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            Question {currentIndex + 1} of {mockReviewIds.length}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={!hasPrev} onClick={() => goTo("prev")} aria-label="Previous question">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={!hasNext} onClick={() => goTo("next")} aria-label="Next question">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Split pane — vertical on mobile, horizontal on desktop */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"}>
          <ResizablePanel defaultSize={isMobile ? 40 : 45} minSize={25}>
            <PdfViewerPanel
              documentName={detail.document}
              page={detail.page}
              pageContent={detail.pageContent}
              sourceExcerpt={detail.sourceExcerpt}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={isMobile ? 60 : 55} minSize={30}>
            <McqEditorPanel
              question={detail.question}
              options={detail.options}
              correctIndex={detail.correctIndex}
              explanation={detail.explanation}
              confidence={detail.confidence}
              confidenceBreakdown={detail.confidenceBreakdown}
              difficulty={detail.difficulty}
              tags={detail.tags}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Action bar */}
      <ReviewActionBar onNavigate={goTo} />
    </div>
  );
}
