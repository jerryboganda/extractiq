import LandingPageLayout from "@/components/layout/LandingPageLayout";
import LandingForm from "@/components/landing/LandingForm";
import MetricsStrip from "@/components/sections/MetricsStrip";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Eye, GitCompare, Award, Upload, Cpu, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const proofPoints = [
  { icon: Eye, title: "Full Traceability", desc: "Every field links back to the exact source region — see exactly where data came from." },
  { icon: GitCompare, title: "Dual-Pathway Validation", desc: "OCR and LLM extract independently, then cross-validate for maximum accuracy." },
  { icon: Award, title: "99.2% Accuracy", desc: "Field-level confidence scores so you know exactly what to trust." },
];

const steps = [
  { icon: Upload, step: "01", title: "Upload Documents", desc: "Any PDF, any layout — our engine adapts automatically." },
  { icon: Cpu, step: "02", title: "Dual AI Extraction", desc: "Two independent pathways extract and cross-validate every field." },
  { icon: CheckCircle, step: "03", title: "Verify & Ship", desc: "Review confidence scores, approve, and export." },
];

const AccurateExtraction = () => {
  const heroRef = useScrollReveal();

  return (
    <LandingPageLayout>
      <section ref={heroRef} className="scroll-reveal pt-24 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            The AI Extraction Platform That <span className="text-primary">Proves Its Work</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Don't trust black-box AI. ExtractIQ shows you exactly where every data point came from — with field-level confidence and dual-pathway validation.
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

export default AccurateExtraction;
