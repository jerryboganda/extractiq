import LandingPageLayout from "@/components/layout/LandingPageLayout";
import LandingForm from "@/components/landing/LandingForm";
import MetricsStrip from "@/components/sections/MetricsStrip";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ShieldCheck, BarChart3, Server, Upload, Cpu, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const proofPoints = [
  { icon: ShieldCheck, title: "Zero Hallucinations", desc: "Dual-pathway cross-validation ensures every extracted field is evidence-backed." },
  { icon: BarChart3, title: "Cost Intelligence", desc: "Real-time cost tracking and provider orchestration to minimize spend." },
  { icon: Server, title: "Enterprise Scale", desc: "Resumable jobs, audit trails, and SOC 2 compliant infrastructure." },
];

const steps = [
  { icon: Upload, step: "01", title: "Ingest Documents", desc: "Upload via API, batch, or UI — any format at any scale." },
  { icon: Cpu, step: "02", title: "AI Extracts & Validates", desc: "Dual OCR + LLM pathways with cross-validation." },
  { icon: CheckCircle, step: "03", title: "Review & Integrate", desc: "Human review queue, then push to your systems." },
];

const DocumentExtraction = () => {
  const heroRef = useScrollReveal();

  return (
    <LandingPageLayout>
      <section ref={heroRef} className="scroll-reveal pt-24 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Enterprise AI Document Extraction. <span className="text-primary">Zero Hallucinations.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Extract structured data from any document with dual-pathway AI validation, full audit trails, and enterprise-grade reliability.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}>
            Talk to Sales
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

export default DocumentExtraction;
