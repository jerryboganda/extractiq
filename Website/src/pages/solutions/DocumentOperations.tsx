import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { ArrowRight, Layers, DollarSign, RotateCcw, ClipboardList, BarChart3, Shield, Server, Zap } from "lucide-react";

const capabilities = [
  { icon: Layers, title: "Provider Orchestration", desc: "Route documents to optimal OCR, LLM, or VLM providers with automatic fallback chains and A/B testing." },
  { icon: DollarSign, title: "Cost Intelligence", desc: "Per-page, per-provider cost visibility with budget guardrails and spend optimization recommendations." },
  { icon: RotateCcw, title: "Resumable Jobs", desc: "Long-running extraction jobs resume automatically after interruptions — no lost progress, no re-processing." },
  { icon: ClipboardList, title: "Audit Trails", desc: "Every extraction, review, and export action logged with timestamps, user IDs, and change history." },
  { icon: BarChart3, title: "Analytics & Observability", desc: "Real-time dashboards for throughput, accuracy, cost, and provider performance metrics." },
  { icon: Shield, title: "Enterprise Controls", desc: "RBAC, encrypted secrets, SSO-ready architecture, and private deployment options." },
];

const scalePoints = [
  { metric: "10M+", label: "Pages processed" },
  { metric: "99.9%", label: "Uptime SLA" },
  { metric: "<200ms", label: "API response" },
  { metric: "SOC 2", label: "Compliance ready" },
];

const DocumentOperations = () => {
  const heroRef = useScrollReveal();
  const capsRef = useScrollReveal();
  const scaleRef = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.12),transparent_60%)]" />
        <div ref={heroRef} className="scroll-reveal max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-sm font-medium mb-6">
            Solution
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
            Scalable Document Intelligence{" "}
            <span className="text-secondary">Infrastructure</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            For operations teams that need production-grade extraction at scale — with provider orchestration, cost controls, full observability, and enterprise security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary glow-primary-hover">
                Talk to Sales <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/product">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted">
                Explore Platform
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={capsRef} className="scroll-reveal max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Operations-Grade Capabilities</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to run document extraction as a reliable, observable, cost-efficient operation.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <div key={cap.title} className="p-8 rounded-2xl bg-card border border-border hover:border-secondary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <cap.icon className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{cap.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scale Proof Points */}
      <section className="py-16 px-4 sm:px-6 border-t border-border bg-card">
        <div ref={scaleRef} className="scroll-reveal max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Built for Enterprise Scale</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {scalePoints.map((sp) => (
              <div key={sp.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-secondary font-mono">{sp.metric}</p>
                <p className="text-sm text-muted-foreground mt-2">{sp.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Production Architecture</h2>
          <p className="text-muted-foreground mb-12 max-w-xl mx-auto">Designed for reliability, scalability, and observability from day one.</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Server, title: "Distributed Processing", desc: "Horizontal scaling with queue-based job distribution." },
              { icon: Zap, title: "Real-Time Streaming", desc: "Live progress updates and webhook notifications." },
              { icon: Shield, title: "Zero-Trust Security", desc: "End-to-end encryption, RBAC, and audit logging." },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-2xl bg-card border border-border">
                <item.icon className="w-8 h-8 text-secondary mb-4 mx-auto" />
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </div>
  );
};

export default DocumentOperations;
