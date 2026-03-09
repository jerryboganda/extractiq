import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Clock, CreditCard, Check } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { Progress } from "@/components/ui/progress";

const StatItem = ({ end, suffix, label }: { end: number; suffix: string; label: string }) => {
  const { ref, display } = useCountUp({ end, suffix, duration: 1400 });
  return (
    <div ref={ref} className="text-center">
      <span className="text-foreground font-semibold">{display}</span>
      <span className="text-muted-foreground ml-1">{label}</span>
    </div>
  );
};

const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center px-4 pt-28 sm:pt-32 overflow-hidden">
    {/* Animated grid background */}
    <div className="absolute inset-0 hero-grid-bg" />
    {/* Floating glow orbs */}
    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px] animate-pulse" />
    <div
      className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[150px] animate-pulse"
      style={{ animationDelay: "2s" }}
    />
    <div
      className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[120px] animate-pulse"
      style={{ animationDelay: "4s" }}
    />

    <div className="relative z-10 max-w-6xl mx-auto text-center">
      {/* Category badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-8 animate-fade-in-up">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-sm text-muted-foreground">Document Intelligence Operations Platform</span>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-foreground mb-6 leading-[0.95]">
        Document Intelligence.
        <br />
        <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
          Production Grade.
        </span>
      </h1>

      <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
        Dual-pathway AI extraction with anti-hallucination controls, human review workflows,
        and LMS-ready exports. Every field traced. Every record auditable. Every provider optimized.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/demo">
          <Button
            size="lg"
            className="text-base px-8 h-13 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary glow-primary-hover transition-all hover:-translate-y-0.5"
          >
            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link to="/how-it-works">
          <Button
            size="lg"
            variant="outline"
            className="text-base px-8 h-13 border-border hover:bg-card text-foreground hover:-translate-y-0.5 transition-all"
          >
            <Play className="mr-2 h-4 w-4" /> See How It Works
          </Button>
        </Link>
      </div>

      {/* Trust badges row */}
      <div className="flex flex-wrap justify-center gap-6 mt-6 text-xs text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-accent" /> SOC 2 Ready</span>
        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-accent" /> 99.9% SLA</span>
        <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-accent" /> No credit card required</span>
      </div>

      {/* Stats bar */}
      <div className="mt-10 flex flex-wrap justify-center gap-6 md:gap-10 text-sm animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <StatItem end={500} suffix="+" label="enterprises" />
        <span className="hidden md:block text-border">|</span>
        <StatItem end={10} suffix="M+" label="pages processed" />
        <span className="hidden md:block text-border">|</span>
        <StatItem end={99.2} suffix="%" label="accuracy" />
      </div>

      {/* Glassmorphic Product Mockup */}
      <div
        className="mt-14 mx-auto max-w-4xl rounded-2xl border border-border/60 glass-card overflow-hidden shadow-2xl shadow-primary/5 animate-fade-in-up"
        style={{ animationDelay: "0.6s" }}
      >
        {/* Mockup top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-card/40">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
            </div>
            <span className="text-xs text-muted-foreground ml-3 font-mono">extractiq.app/dashboard</span>
          </div>
          <span className="text-xs text-accent font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Live
          </span>
        </div>

        {/* Mockup content */}
        <div className="p-5 md:p-6 grid md:grid-cols-3 gap-4">
          {/* Left: document being processed */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Extraction Pipeline</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent border border-accent/20 font-medium">Batch #2847</span>
            </div>

            {/* Processing items */}
            {[
              { name: "biology_exam_2024.pdf", pages: "48 pages", status: "Complete", confidence: 97.3, color: "text-success" },
              { name: "chemistry_midterm.pdf", pages: "32 pages", status: "Processing", confidence: 84, color: "text-accent" },
              { name: "physics_final_v2.pdf", pages: "56 pages", status: "In Queue", confidence: 0, color: "text-muted-foreground" },
            ].map((doc, i) => (
              <div key={doc.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30 group hover:border-primary/20 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-success/10 text-success" : i === 1 ? "bg-accent/10 text-accent" : "bg-muted/40 text-muted-foreground"
                }`}>
                  {i === 0 ? <Check className="h-4 w-4" /> : i === 1 ? <span className="animate-spin">⟳</span> : "…"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground truncate">{doc.name}</span>
                    <span className={`text-[10px] font-medium ${doc.color}`}>{doc.status}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{doc.pages}</span>
                    {doc.confidence > 0 && (
                      <>
                        <Progress value={doc.confidence} className="h-1 flex-1 bg-muted/40 max-w-[120px]" />
                        <span className="text-[10px] font-mono text-muted-foreground">{doc.confidence}%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: stats sidebar */}
          <div className="space-y-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Session Stats</span>
            {[
              { label: "Fields Extracted", value: "1,247", trend: "+12%" },
              { label: "Confidence Avg", value: "96.8%", trend: "+2.1%" },
              { label: "Reviewed", value: "18/23", trend: "78%" },
              { label: "Export Ready", value: "892", trend: "QTI 2.1" },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className="text-[10px] text-muted-foreground mb-0.5">{stat.label}</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-foreground">{stat.value}</span>
                  <span className="text-[10px] text-accent font-medium">{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
