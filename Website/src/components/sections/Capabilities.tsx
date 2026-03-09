import { useScrollReveal } from "@/hooks/useScrollReveal";
import { GitBranch, DollarSign, BarChart3, Target, RefreshCw, TrendingDown } from "lucide-react";

const orchestrationFeatures = [
  { icon: GitBranch, label: "Provider Routing", desc: "Smart fallback chains" },
  { icon: Target, label: "A/B Testing", desc: "Compare provider quality" },
  { icon: RefreshCw, label: "Shadow Mode", desc: "Test without risk" },
  { icon: BarChart3, label: "Benchmarking", desc: "Performance leaderboards" },
];

const costFeatures = [
  { icon: DollarSign, title: "Per-Record Costs", desc: "Track spending at the finest granularity — per page, per record, per provider." },
  { icon: TrendingDown, title: "Budget Guardrails", desc: "Set spending limits per job, per workspace. Never exceed budget unexpectedly." },
  { icon: BarChart3, title: "ROI Dashboard", desc: "Compare pathway costs, provider efficiency, and quality-to-cost ratios in real time." },
];

const lmsFormats = ["QTI 2.1", "QTI 3.0", "SCORM 1.2", "SCORM 2004", "xAPI", "cmi5", "JSON", "JSONL", "CSV"];

const Capabilities = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="scroll-reveal py-24 px-4">
      <div className="max-w-6xl mx-auto space-y-28">
        {/* Provider Orchestration */}
        <div className="text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">ORCHESTRATION</p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Any Provider. Optimal Results.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Route across OCR, LLM, and VLM vendors with fallback chains, A/B testing, and shadow-mode comparison.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {orchestrationFeatures.map((item, i) => (
              <div
                key={item.label}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(var(--primary)/0.08)] transition-all duration-300 group"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <item.icon className="h-8 w-8 text-primary mb-3 mx-auto group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1 text-sm">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Intelligence */}
        <div>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">COST INTELLIGENCE</p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              See Every Dollar. Optimize Every Decision.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Per-page, per-record, per-provider cost tracking with budget guardrails and ROI visibility.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {costFeatures.map((item, i) => (
              <div
                key={item.title}
                className="p-8 rounded-xl bg-card border border-border hover:border-accent/30 hover:scale-[1.02] transition-all duration-300"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <item.icon className="h-8 w-8 text-accent mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LMS Interoperability */}
        <div className="text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">LMS EXPORT</p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Export to Any Learning System.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Native support for every major LMS format — not an afterthought, a core feature.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {lmsFormats.map((format) => (
              <span
                key={format}
                className="px-5 py-2.5 rounded-lg bg-card border border-border text-sm font-mono text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all cursor-default"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Capabilities;
