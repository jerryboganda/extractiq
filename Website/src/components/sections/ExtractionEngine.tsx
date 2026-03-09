import { Brain, Eye, Shield, Lock, Database } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const tiers = [
  {
    icon: Shield,
    title: "Model Controls",
    desc: "Temperature constraints, structured output schemas, prompt engineering guardrails",
    bgClass: "bg-primary/10",
    textClass: "text-primary",
  },
  {
    icon: Lock,
    title: "Context Controls",
    desc: "Source excerpt requirements, confidence thresholds, null-on-uncertainty policies",
    bgClass: "bg-accent/10",
    textClass: "text-accent",
  },
  {
    icon: Database,
    title: "Data Controls",
    desc: "Cross-field validation, format verification, traceability linking for every field",
    bgClass: "bg-secondary/10",
    textClass: "text-secondary",
  },
];

const ExtractionEngine = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="scroll-reveal py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Dual Extraction */}
        <div className="text-center mb-24">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">EXTRACTION ENGINE</p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Two AI Pathways. One Trusted Result.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Choose the optimal extraction method for every document — or let the platform decide.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-left">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Brain className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">OCR + LLM Pipeline</h3>
              <p className="text-muted-foreground mb-6">
                Traditional OCR extracts text, then LLMs structure and interpret. Proven, fast,
                cost-effective for text-heavy documents.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Multi-provider OCR support
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Structured LLM extraction
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> High throughput processing
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-xl bg-card border border-border hover:border-secondary/50 transition-all text-left">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
                <Eye className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">VLM Direct Understanding</h3>
              <p className="text-muted-foreground mb-6">
                Vision Language Models process pages as images — understanding layout, tables,
                diagrams, and visual context natively.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Visual document understanding
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Complex layout handling
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Diagram & table extraction
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Anti-Hallucination */}
        <div className="text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">ANTI-HALLUCINATION</p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Three Layers of Trust. Zero Hallucinations.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Our tiered anti-hallucination architecture ensures every extraction is evidence-based.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div key={tier.title} className="p-6 rounded-xl bg-card border border-border text-center">
                <div className={`w-12 h-12 rounded-lg ${tier.bgClass} flex items-center justify-center mb-4 mx-auto`}>
                  <tier.icon className={`h-6 w-6 ${tier.textClass}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{tier.title}</h3>
                <p className="text-sm text-muted-foreground">{tier.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExtractionEngine;
