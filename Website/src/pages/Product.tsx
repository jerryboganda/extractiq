import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageMeta from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, Brain, Eye, Shield, GitBranch, BarChart3, Download, ArrowRight, FileText, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

/* Mini-UI mockup components for each feature */
const ExtractionMockup = () => (
  <div className="rounded-xl bg-background border border-border overflow-hidden h-full">
    <div className="px-4 py-2 border-b border-border/50 flex items-center gap-2 bg-card/40">
      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      <span className="text-[10px] text-muted-foreground font-mono">pipeline.active</span>
    </div>
    <div className="p-4 space-y-2.5">
      {[
        { label: "OCR → Tesseract", status: "✓", color: "text-success" },
        { label: "LLM → GPT-4o", status: "✓", color: "text-success" },
        { label: "VLM → Gemini Pro", status: "⟳", color: "text-accent" },
      ].map((r) => (
        <div key={r.label} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/20 border border-border/30">
          <span className="text-xs text-muted-foreground font-mono">{r.label}</span>
          <span className={`text-xs font-bold ${r.color}`}>{r.status}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-2">
        <Progress value={78} className="h-1.5 flex-1 bg-muted/40" />
        <span className="text-[10px] text-muted-foreground font-mono">78%</span>
      </div>
    </div>
  </div>
);

const ValidationMockup = () => (
  <div className="rounded-xl bg-background border border-border overflow-hidden h-full">
    <div className="px-4 py-2 border-b border-border/50 bg-card/40">
      <span className="text-[10px] text-muted-foreground font-mono">validation_engine</span>
    </div>
    <div className="p-4 space-y-2">
      {[
        { tier: "Model", rule: "Temperature ≤ 0.1", pass: true },
        { tier: "Context", rule: "Confidence ≥ 0.85", pass: true },
        { tier: "Data", rule: "Schema match", pass: true },
        { tier: "Data", rule: "Null-on-uncertainty", pass: false },
      ].map((v, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/20 border border-border/30">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${v.pass ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
            {v.pass ? "✓" : "!"}
          </span>
          <span className="text-[10px] text-muted-foreground flex-1 font-mono">{v.tier}</span>
          <span className="text-[10px] text-foreground">{v.rule}</span>
        </div>
      ))}
    </div>
  </div>
);

const ReviewMockup = () => (
  <div className="rounded-xl bg-background border border-border overflow-hidden h-full">
    <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between bg-card/40">
      <span className="text-[10px] text-muted-foreground font-mono">review_queue</span>
      <span className="px-2 py-0.5 rounded-full text-[9px] bg-accent/10 text-accent border border-accent/20">8 pending</span>
    </div>
    <div className="p-4 space-y-2">
      {["Q: Mitochondria function?", "Q: Cell division phases?", "Q: DNA replication?"].map((q, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/20 border border-border/30">
          <span className="text-[10px] text-foreground truncate flex-1">{q}</span>
          <div className="flex gap-1 ml-2">
            <span className="w-5 h-5 rounded bg-success/10 text-success flex items-center justify-center text-[8px]">✓</span>
            <span className="w-5 h-5 rounded bg-destructive/10 text-destructive flex items-center justify-center text-[8px]">✗</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RoutingMockup = () => (
  <div className="rounded-xl bg-background border border-border overflow-hidden h-full">
    <div className="px-4 py-2 border-b border-border/50 bg-card/40">
      <span className="text-[10px] text-muted-foreground font-mono">provider_routing</span>
    </div>
    <div className="p-4 space-y-2">
      {[
        { provider: "GPT-4o", accuracy: "98.2%", cost: "$0.03", bar: 98 },
        { provider: "Claude 3.5", accuracy: "97.8%", cost: "$0.02", bar: 97 },
        { provider: "Gemini Pro", accuracy: "96.1%", cost: "$0.01", bar: 96 },
      ].map((p) => (
        <div key={p.provider} className="px-3 py-2 rounded-md bg-muted/20 border border-border/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-foreground">{p.provider}</span>
            <span className="text-[10px] text-accent font-mono">{p.accuracy}</span>
          </div>
          <Progress value={p.bar} className="h-1 bg-muted/40" />
        </div>
      ))}
    </div>
  </div>
);

const CostMockup = () => (
  <div className="rounded-xl bg-background border border-border overflow-hidden h-full">
    <div className="px-4 py-2 border-b border-border/50 bg-card/40">
      <span className="text-[10px] text-muted-foreground font-mono">cost_intelligence</span>
    </div>
    <div className="p-4 grid grid-cols-2 gap-2">
      {[
        { label: "This Month", value: "$847", trend: "↓12%" },
        { label: "Per Page", value: "$0.017", trend: "↓8%" },
        { label: "Budget Used", value: "63%", trend: "On track" },
        { label: "Saved vs Manual", value: "$12.4k", trend: "+340%" },
      ].map((s) => (
        <div key={s.label} className="p-2.5 rounded-md bg-muted/20 border border-border/30">
          <div className="text-[9px] text-muted-foreground mb-0.5">{s.label}</div>
          <div className="text-xs font-bold text-foreground">{s.value}</div>
          <div className="text-[9px] text-accent">{s.trend}</div>
        </div>
      ))}
    </div>
  </div>
);

const ExportMockup = () => (
  <div className="rounded-xl bg-background border border-border overflow-hidden h-full">
    <div className="px-4 py-2 border-b border-border/50 bg-card/40">
      <span className="text-[10px] text-muted-foreground font-mono">export_engine</span>
    </div>
    <div className="p-4 space-y-2">
      {[
        { format: "QTI 2.1", records: "247 items", ready: true },
        { format: "SCORM 2004", records: "247 items", ready: true },
        { format: "xAPI", records: "247 items", ready: true },
        { format: "CSV", records: "247 items", ready: true },
      ].map((e) => (
        <div key={e.format} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/20 border border-border/30">
          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-medium text-foreground">{e.format}</span>
          </div>
          <span className="text-[9px] text-success font-medium">Ready</span>
        </div>
      ))}
    </div>
  </div>
);

const mockups = [ExtractionMockup, ValidationMockup, ReviewMockup, RoutingMockup, CostMockup, ExportMockup];

const sections = [
  {
    title: "Dual-Pathway Extraction Engine",
    desc: "Choose between OCR+LLM and VLM pathways — or run both in parallel for maximum accuracy. The platform routes documents to the optimal pathway based on content complexity.",
    icon: Brain,
    features: ["Multi-provider OCR integration", "Structured LLM extraction", "VLM visual understanding", "Hybrid pathway orchestration", "Automatic complexity routing"],
  },
  {
    title: "Anti-Hallucination Architecture",
    desc: "Three tiers of controls ensure every extraction is evidence-based. No fabricated answers. No blind confidence. Just verified, traceable data.",
    icon: Shield,
    features: ["Model-level temperature controls", "Context-level confidence thresholds", "Data-level validation rules", "Null-on-uncertainty policy", "Source excerpt requirements"],
  },
  {
    title: "Human Review Queue",
    desc: "Uncertain records flow automatically into a review queue where human reviewers validate extractions side-by-side with source documents.",
    icon: Eye,
    features: ["Side-by-side source comparison", "Edit / Approve / Reject / Reprocess", "Confidence-based routing", "Batch review workflows", "Review analytics"],
  },
  {
    title: "Provider Orchestration",
    desc: "Route across multiple OCR, LLM, and VLM providers with fallback chains, A/B testing, shadow mode comparison, and performance benchmarking.",
    icon: GitBranch,
    features: ["Multi-provider routing", "Automatic fallback chains", "A/B quality testing", "Shadow mode comparison", "Provider leaderboards"],
  },
  {
    title: "Cost Intelligence",
    desc: "Track costs at every level — per page, per record, per provider. Set budget guardrails and compare pathway economics in real time.",
    icon: BarChart3,
    features: ["Per-record cost tracking", "Budget guardrails", "Provider cost comparison", "ROI dashboards", "Pathway cost analysis"],
  },
  {
    title: "LMS Export Engine",
    desc: "Export validated content directly to any major LMS format. QTI, SCORM, xAPI, cmi5, JSON, CSV — all native, all production-ready.",
    icon: Download,
    features: ["QTI 2.1 & 3.0", "SCORM 1.2 & 2004", "xAPI & cmi5", "JSON / JSONL / CSV", "Custom format templates"],
  },
];

const Product = () => (
  <div className="min-h-screen bg-background">
    <PageMeta title="Product — ExtractIQ Document Intelligence Platform" description="Dual-pathway AI extraction engine with OCR+LLM and VLM pathways, anti-hallucination controls, human review workflows, and LMS-ready exports." />
    <Navbar />
    <section className="pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">PLATFORM</p>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          The Complete Document Intelligence Platform
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Every capability you need to transform unstructured documents into validated, structured, export-ready data.
        </p>
        <Link to="/demo">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary hover:-translate-y-0.5 transition-all">
            See It In Action <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>

    {sections.map((s, i) => {
      const Mockup = mockups[i];
      return (
        <section key={s.title} className={`py-20 px-4 ${i % 2 === 0 ? "" : "bg-card/30"}`}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <s.icon className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">{s.title}</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">{s.desc}</p>
              <ul className="space-y-2.5">
                {s.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-accent shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className={i % 2 === 1 ? "md:order-1" : ""}>
              <Mockup />
            </div>
          </div>
        </section>
      );
    })}

    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto text-center p-6 sm:p-12 rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/8 to-primary/3">
        <h2 className="text-3xl font-bold text-foreground mb-4">See the Full Platform in Action</h2>
        <p className="text-muted-foreground mb-8">Get a personalized demo tailored to your document workflows.</p>
        <Link to="/demo">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary hover:-translate-y-0.5 transition-all">
            Book a Demo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
    <Footer />
  </div>
);

export default Product;
