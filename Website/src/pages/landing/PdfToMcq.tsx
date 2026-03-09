import LandingPageLayout from "@/components/layout/LandingPageLayout";
import LandingForm from "@/components/landing/LandingForm";
import MetricsStrip from "@/components/sections/MetricsStrip";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { FileText, Brain, CheckCircle, Upload, Cpu, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const proofPoints = [
  { icon: FileText, title: "Any PDF Format", desc: "Scanned, digital, multi-column — our dual-pathway engine handles it all." },
  { icon: Brain, title: "Anti-Hallucination", desc: "Every extracted question is cross-validated against the source document." },
  { icon: CheckCircle, title: "LMS-Ready Output", desc: "Export directly to QTI, SCORM, xAPI, or any learning platform." },
];

const steps = [
  { icon: Upload, step: "01", title: "Upload PDFs", desc: "Drop your exam PDFs — any format, any layout." },
  { icon: Cpu, step: "02", title: "AI Extracts MCQs", desc: "Dual-pathway extraction with field-level confidence scores." },
  { icon: Download, step: "03", title: "Review & Export", desc: "Human review queue, then export to your LMS." },
];

const PdfToMcq = () => {
  const heroRef = useScrollReveal();
  const stepsRef = useScrollReveal();

  return (
    <LandingPageLayout>
      <section ref={heroRef} className="scroll-reveal pt-24 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Convert PDF Exam Libraries into <span className="text-primary">Validated Question Banks</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop manually re-typing exam questions. ExtractIQ uses dual AI pathways to extract, validate, and export MCQs — with zero hallucinations.
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

      <section ref={stepsRef} className="scroll-reveal py-20 px-4 bg-card/30">
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

export default PdfToMcq;
