import LandingPageLayout from "@/components/layout/LandingPageLayout";
import LandingForm from "@/components/landing/LandingForm";
import MetricsStrip from "@/components/sections/MetricsStrip";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Layers, Shield, Zap, FileText, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const proofPoints = [
  { icon: Layers, title: "8+ Export Formats", desc: "QTI 2.1/3.0, SCORM 1.2/2004, xAPI, cmi5, JSON, CSV — all native." },
  { icon: Shield, title: "Spec-Compliant", desc: "Every export validated against the official specification before delivery." },
  { icon: Zap, title: "One-Click Export", desc: "Extract once, export to any format. No manual reformatting." },
];

const steps = [
  { icon: FileText, step: "01", title: "Extract Content", desc: "AI extracts structured assessment data from your documents." },
  { icon: Settings, step: "02", title: "Validate & Review", desc: "Review extracted content with field-level confidence scores." },
  { icon: Download, step: "03", title: "Export to LMS", desc: "Choose your format and download — spec-compliant, every time." },
];

const LmsAssessmentExport = () => {
  const heroRef = useScrollReveal();

  return (
    <LandingPageLayout>
      <section ref={heroRef} className="scroll-reveal pt-24 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Export Assessment Data to Any LMS. <span className="text-primary">Natively.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            QTI, SCORM, xAPI, cmi5 — ExtractIQ exports to every major learning standard with full spec compliance.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}>
            Book a Demo
          </Button>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {proofPoints.map((p) => (
            <div key={p.title} className="text-center p-6 rounded-2xl border border-border bg-card/50">
              <p.icon className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-xs font-mono text-primary mb-3">{s.step}</div>
                <s.icon className="h-8 w-8 text-accent mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MetricsStrip />
      <LandingForm />
    </LandingPageLayout>
  );
};

export default LmsAssessmentExport;
