import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileOutput, ArrowRight, Upload, CheckCircle, Download } from "lucide-react";

const formats = [
  { name: "QTI 2.1", desc: "IMS Question & Test Interoperability — the most widely adopted assessment standard.", who: "Universities, LMS platforms, certification bodies" },
  { name: "QTI 3.0", desc: "Latest QTI standard with enhanced item types and accessibility features.", who: "Modern assessment platforms, next-gen LMS" },
  { name: "SCORM 1.2", desc: "Sharable Content Object Reference Model — legacy standard still used widely.", who: "Enterprise LMS, legacy training systems" },
  { name: "SCORM 2004", desc: "Enhanced SCORM with sequencing and navigation capabilities.", who: "Complex training programs, adaptive learning" },
  { name: "xAPI", desc: "Experience API for tracking learning experiences across any platform.", who: "Modern L&D, mobile learning, blended learning" },
  { name: "cmi5", desc: "Combines xAPI data with LMS launch and reporting — best of both worlds.", who: "Enterprise training, next-gen compliance" },
  { name: "JSON", desc: "Universal structured data format for custom integrations and APIs.", who: "Developers, custom platforms, data pipelines" },
  { name: "CSV", desc: "Simple tabular export for spreadsheets and bulk import tools.", who: "Quick imports, data analysis, migration" },
];

const workflowSteps = [
  { icon: Upload, title: "Extract", desc: "AI extracts structured content from your documents." },
  { icon: CheckCircle, title: "Validate", desc: "Human review ensures accuracy before export." },
  { icon: Download, title: "Export", desc: "One-click export in your chosen format." },
];

const LmsExport = () => {
  const heroRef = useScrollReveal();
  const formatsRef = useScrollReveal();
  const workflowRef = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--accent)/0.12),transparent_60%)]" />
        <div ref={heroRef} className="scroll-reveal max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-6">
            Solution
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
            Export to Any Learning System.{" "}
            <span className="text-accent">Natively.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            QTI, SCORM, xAPI, cmi5, JSON, CSV — ExtractIQ exports validated content directly into any learning management system format. No conversion tools. No middleware.
          </p>
          <Link to="/demo">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary glow-primary-hover">
              Book a Demo <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Format Grid */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={formatsRef} className="scroll-reveal max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Every Format. One Platform.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Native support for all major learning and assessment standards.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {formats.map((f) => (
              <div key={f.name} className="p-6 rounded-2xl bg-card border border-border hover:border-accent/30 transition-colors group">
                <div className="flex items-center gap-3 mb-3">
                  <FileOutput className="w-5 h-5 text-accent" />
                  <Badge variant="outline" className="font-mono text-xs">{f.name}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{f.desc}</p>
                <p className="text-xs text-muted-foreground/60"><span className="font-medium text-muted-foreground/80">Used by:</span> {f.who}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={workflowRef} className="scroll-reveal max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-12">Extract → Validate → Export</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {workflowSteps.map((step, i) => (
              <div key={step.title} className="p-8 rounded-2xl bg-card border border-border relative">
                <div className="absolute top-4 right-4 text-sm font-mono text-muted-foreground/40">{String(i + 1).padStart(2, "0")}</div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 mx-auto">
                  <step.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Diagram */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Seamless LMS Integration</h2>
          <p className="text-muted-foreground mb-12 max-w-xl mx-auto">ExtractIQ sits between your document library and your learning ecosystem.</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="p-6 rounded-2xl bg-card border border-border text-center min-w-[160px]">
              <p className="text-sm font-semibold text-foreground">Your Documents</p>
              <p className="text-xs text-muted-foreground mt-1">PDFs, Exams, Textbooks</p>
            </div>
            <ArrowRight className="w-6 h-6 text-primary rotate-90 md:rotate-0" />
            <div className="p-6 rounded-2xl bg-primary/10 border border-primary/30 text-center min-w-[160px]">
              <p className="text-sm font-bold text-primary">ExtractIQ</p>
              <p className="text-xs text-muted-foreground mt-1">Extract · Validate · Export</p>
            </div>
            <ArrowRight className="w-6 h-6 text-primary rotate-90 md:rotate-0" />
            <div className="p-6 rounded-2xl bg-card border border-border text-center min-w-[160px]">
              <p className="text-sm font-semibold text-foreground">Your LMS</p>
              <p className="text-xs text-muted-foreground mt-1">Any format, any platform</p>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LmsExport;
