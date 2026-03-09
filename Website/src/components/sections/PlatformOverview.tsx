import { FileText, Cpu, Shield, Eye, Download, ArrowRight, ArrowDown } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  { icon: FileText, label: "Ingest", desc: "Upload PDFs at scale" },
  { icon: Cpu, label: "Extract", desc: "Dual AI pathways" },
  { icon: Shield, label: "Validate", desc: "Anti-hallucination checks" },
  { icon: Eye, label: "Review", desc: "Human-in-the-loop QA" },
  { icon: Download, label: "Export", desc: "LMS-ready formats" },
];

const PlatformOverview = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="scroll-reveal py-24 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">PLATFORM</p>
        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          One Platform. Complete Document Intelligence.
        </h2>
        <p className="text-muted-foreground mb-16 max-w-2xl mx-auto">
          From raw PDF to validated, export-ready data — orchestrated in a single workflow.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
              <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all min-w-[150px] group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold text-foreground">{step.label}</span>
                <span className="text-xs text-muted-foreground">{step.desc}</span>
              </div>
              {i < steps.length - 1 && (
                <>
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50 hidden md:block shrink-0" />
                  <ArrowDown className="h-5 w-5 text-muted-foreground/50 md:hidden shrink-0" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformOverview;
