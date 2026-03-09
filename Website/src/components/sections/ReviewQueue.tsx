import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Check, X, Pencil, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ReviewQueue = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="scroll-reveal py-24 px-4 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">HUMAN IN THE LOOP</p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Human Intelligence Meets Artificial Intelligence.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Uncertain records flow into a human review queue. Side-by-side source evidence and
            extracted output — edit, approve, reject, or reprocess.
          </p>
        </div>

        {/* Mock review interface */}
        <div className="rounded-xl border border-border bg-background overflow-hidden max-w-4xl mx-auto shadow-xl shadow-primary/5">
          {/* Header bar */}
          <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-foreground">Review Queue</span>
              <span className="text-xs text-muted-foreground">— 12 records pending</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-accent/10 text-accent border border-accent/20">
              Medium Confidence
            </span>
          </div>

          {/* Two-pane view */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Source pane */}
            <div className="p-6">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">
                Source Document
              </h4>
              <div className="space-y-3 font-mono text-sm text-muted-foreground">
                <div className="bg-muted/30 p-3 rounded-lg">
                  Q: What is the primary function of mitochondria in eukaryotic cells?
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  A) Cell division &nbsp; B) Energy production &nbsp; C) Protein synthesis &nbsp; D) Waste removal
                </div>
                <div className="bg-accent/10 p-3 rounded-lg border border-accent/20 text-accent">
                  Answer: B) Energy production
                </div>
              </div>
            </div>

            {/* Extracted pane */}
            <div className="p-6">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">
                Extracted Output
              </h4>
              <div className="space-y-3 text-sm">
                {[
                  { field: "Question", status: "Matched" },
                  { field: "Options (4)", status: "Complete" },
                  { field: "Answer Key", status: "Verified" },
                  { field: "Source Excerpt", status: "Linked" },
                ].map((row) => (
                  <div key={row.field} className="flex justify-between items-center py-1.5">
                    <span className="text-muted-foreground">{row.field}</span>
                    <span className="text-success text-xs font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> {row.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-6 flex-wrap">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 hover:-translate-y-0.5 transition-all">
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 hover:-translate-y-0.5 transition-all">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 hover:-translate-y-0.5 transition-all">
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 hover:-translate-y-0.5 transition-all">
                  <RefreshCw className="h-3.5 w-3.5" /> Reprocess
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA below review queue */}
        <div className="text-center mt-10">
          <Link to="/demo">
            <Button variant="outline" className="hover:-translate-y-0.5 transition-all">
              Try the Review Queue →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ReviewQueue;
