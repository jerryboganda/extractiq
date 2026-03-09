import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { Upload, Cpu, Download, ArrowRight, Shield, Clock, Zap } from "lucide-react";

const steps = [
  { icon: Upload, step: "01", title: "Upload", desc: "Drop your PDF collection — any size, any complexity." },
  { icon: Cpu, step: "02", title: "Extract & Review", desc: "AI extracts, validates, and routes uncertain records for human review." },
  { icon: Download, step: "03", title: "Export", desc: "Download validated data in any LMS format — QTI, SCORM, xAPI, and more." },
];

const FinalCTA = () => {
  const ref = useScrollReveal();
  const refCta = useScrollReveal();

  return (
    <>
      <section ref={ref} className="scroll-reveal py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">HOW IT WORKS</p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-16">
            Three Steps to Validated Data
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((s) => (
              <div key={s.step} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <s.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-xs font-mono text-primary mb-2 tracking-wider">
                  STEP {s.step}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={refCta} className="scroll-reveal py-24 px-4">
        <div className="max-w-4xl mx-auto text-center p-6 sm:p-12 md:p-16 rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/8 to-primary/3 shadow-[0_0_80px_hsl(var(--primary)/0.1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Ready to Transform Your Document Workflows?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto text-lg">
              Join 500+ enterprises processing millions of pages with enterprise-grade accuracy and auditability.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-accent" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-accent" /> No credit card</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-accent" /> Setup in under 30 min</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/demo">
                <Button
                  size="lg"
                  className="text-base px-8 h-13 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary glow-primary-hover transition-all hover:-translate-y-0.5 animate-glow-pulse"
                >
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 h-13 border-border hover:bg-card text-foreground hover:-translate-y-0.5 transition-all"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FinalCTA;
