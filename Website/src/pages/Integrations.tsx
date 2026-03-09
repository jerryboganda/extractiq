import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageMeta from "@/components/layout/PageMeta";
import FinalCTA from "@/components/sections/FinalCTA";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileOutput, Cpu, Webhook, ArrowRight, Eye, MessageSquare, ScanLine } from "lucide-react";

const exportFormats = [
  "QTI 2.1", "QTI 3.0", "SCORM 1.2", "SCORM 2004", "xAPI", "cmi5", "JSON", "CSV",
];

const aiProviders = [
  { icon: ScanLine, category: "OCR Providers", items: ["Tesseract", "Google Vision", "Azure Document Intelligence", "AWS Textract"] },
  { icon: MessageSquare, category: "LLM Providers", items: ["OpenAI GPT-4", "Anthropic Claude", "Google Gemini", "Mistral"] },
  { icon: Eye, category: "VLM Providers", items: ["GPT-4 Vision", "Claude Vision", "Gemini Vision", "Custom Models"] },
];

const apiFeatures = [
  { title: "REST API", desc: "Full CRUD API for documents, jobs, extractions, and exports." },
  { title: "Webhooks", desc: "Real-time notifications for job completion, review status, and errors." },
  { title: "SDKs", desc: "Python and TypeScript SDKs for rapid integration." },
  { title: "Batch API", desc: "Submit thousands of documents in a single API call." },
];

const Integrations = () => {
  const heroRef = useScrollReveal();
  const exportsRef = useScrollReveal();
  const providersRef = useScrollReveal();
  const apiRef = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Integrations — ExtractIQ Export Formats & APIs" description="Export to QTI, SCORM, xAPI, cmi5, and more. Connect with AI providers, webhooks, and your entire tech stack." />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div ref={heroRef} className="scroll-reveal max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
            Connect to Your{" "}
            <span className="text-primary">Entire Stack</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Export formats, AI providers, APIs, and webhooks — ExtractIQ integrates with everything you already use.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary glow-primary-hover">
                Book a Demo <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Export Formats */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={exportsRef} className="scroll-reveal max-w-5xl mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 mx-auto">
            <FileOutput className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Export Formats</h2>
          <p className="text-muted-foreground mb-8">Native support for all major learning and data interchange standards.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {exportFormats.map((f) => (
              <Badge key={f} variant="outline" className="px-4 py-2 text-sm font-mono border-accent/30 text-foreground">
                {f}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* AI Providers */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={providersRef} className="scroll-reveal max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
              <Cpu className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">AI Provider Orchestration</h2>
            <p className="text-muted-foreground">Use any combination of OCR, LLM, and VLM providers — with automatic fallback and optimization.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {aiProviders.map((group) => (
              <div key={group.category} className="p-8 rounded-2xl bg-card border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <group.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-4">{group.category}</h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API & Webhooks */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={apiRef} className="scroll-reveal max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 mx-auto">
              <Webhook className="w-6 h-6 text-secondary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">API & Webhooks</h2>
            <p className="text-muted-foreground">Build on top of ExtractIQ with our comprehensive developer tools.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {apiFeatures.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
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

export default Integrations;
