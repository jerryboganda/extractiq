import { X, Check, ArrowRight, Zap, Target, Shield } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const oldWay = [
  "Manual data entry from PDFs",
  "Error-prone, no audit trail",
  "Weeks of processing time",
  "No quality validation",
  "Siloed, single-operator workflows",
  "No LMS interoperability",
];

const newWay = [
  "Automated dual-pathway extraction",
  "Evidence-based, fully auditable",
  "Hours, not weeks",
  "Three-tier validation engine",
  "Multi-user, role-based teams",
  "Native LMS export formats",
];

const ProblemStatement = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="scroll-reveal py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] text-center mb-3">THE PROBLEM</p>
        <h2 className="text-3xl md:text-5xl font-bold text-center text-foreground mb-4">
          Stop Wrestling with Documents
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          The old way is broken. ExtractIQ replaces manual chaos with validated intelligence.
        </p>
        <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 md:gap-4 items-stretch">
          {/* Old Way */}
          <div className="p-8 rounded-xl bg-gradient-to-b from-destructive/8 to-destructive/3 border border-destructive/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive/60 to-destructive/20" />
            <h3 className="text-xl font-semibold text-destructive mb-6">The Old Way</h3>
            <ul className="space-y-4">
              {oldWay.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <span className="line-through decoration-destructive/30">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Transformation arrow */}
          <div className="hidden md:flex flex-col items-center justify-center gap-3">
            <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
          </div>

          {/* New Way */}
          <div className="p-8 rounded-xl bg-gradient-to-b from-accent/8 to-accent/3 border border-accent/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/60 to-accent/20" />
            <h3 className="text-xl font-semibold text-accent mb-6">The ExtractIQ Way</h3>
            <ul className="space-y-4">
              {newWay.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Metric callout */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 md:gap-10">
          {[
            { icon: Zap, label: "80% Faster", desc: "than manual processing" },
            { icon: Target, label: "3x More Accurate", desc: "with dual-pathway extraction" },
            { icon: Shield, label: "100% Auditable", desc: "every field traced to source" },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border">
              <m.icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <span className="text-sm font-bold text-foreground">{m.label}</span>
                <span className="text-xs text-muted-foreground ml-1.5">{m.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemStatement;
