import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Flag, SkipForward } from "lucide-react";
import { toast } from "sonner";

interface ReviewActionBarProps {
  onNavigate: (direction: "prev" | "next") => void;
  onApprove?: () => void;
  onReject?: () => void;
  onFlag?: () => void;
}

export function ReviewActionBar({ onNavigate, onApprove, onReject, onFlag }: ReviewActionBarProps) {
  const handleAction = (action: string) => {
    const messages: Record<string, string> = {
      approve: "✅ MCQ approved successfully",
      reject: "❌ MCQ rejected",
      flag: "🚩 MCQ flagged for review",
      skip: "⏭ Skipped to next MCQ",
    };
    if (action === "approve" && onApprove) {
      onApprove();
      return;
    }
    if (action === "reject" && onReject) {
      onReject();
      return;
    }
    if (action === "flag" && onFlag) {
      onFlag();
      return;
    }

    toast(messages[action] || action);
    if (action === "skip") onNavigate("next");
  };

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={() => handleAction("approve")}
          className="gap-1.5 sm:gap-2 bg-success/15 text-success border border-success/30 hover:bg-success/25"
          variant="outline"
          size="sm"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Approve</span>
          <kbd className="ml-1 text-[9px] font-mono bg-success/10 border border-success/20 rounded px-1 py-0.5 hidden md:inline">A</kbd>
        </Button>
        <Button
          onClick={() => handleAction("reject")}
          className="gap-1.5 sm:gap-2 bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
          variant="outline"
          size="sm"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reject</span>
          <kbd className="ml-1 text-[9px] font-mono bg-destructive/10 border border-destructive/20 rounded px-1 py-0.5 hidden md:inline">R</kbd>
        </Button>
        <Button
          onClick={() => handleAction("flag")}
          className="gap-1.5 sm:gap-2 bg-warning/15 text-warning border border-warning/30 hover:bg-warning/25"
          variant="outline"
          size="sm"
        >
          <Flag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Flag</span>
          <kbd className="ml-1 text-[9px] font-mono bg-warning/10 border border-warning/20 rounded px-1 py-0.5 hidden md:inline">F</kbd>
        </Button>
        <Button
          onClick={() => handleAction("skip")}
          variant="outline"
          size="sm"
          className="gap-1.5 sm:gap-2"
        >
          <SkipForward className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Skip</span>
          <kbd className="ml-1 text-[9px] font-mono bg-muted border border-border rounded px-1 py-0.5 hidden md:inline">→</kbd>
        </Button>
      </div>
    </div>
  );
}
