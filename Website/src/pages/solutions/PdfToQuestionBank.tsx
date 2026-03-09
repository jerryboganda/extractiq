import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { FileText, Brain, CheckCircle, Upload, Cpu, ClipboardCheck, BookOpen, GraduationCap, Award } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload PDFs", desc: "Batch-upload hundreds of exam PDFs, textbooks, or assessment documents in any format." },
  { icon: Cpu, title: "AI Extracts MCQs", desc: "Dual-pathway extraction identifies questions, options, correct answers, and metadata — with anti-hallucination controls." },
  { icon: ClipboardCheck, title: "Review & Export", desc: "Human-in-the-loop review queue lets you verify, edit, and approve — then export to QTI, SCORM, or any LMS format." },
];

const benefits = [
  { icon: Brain, title: "99.2% Extraction Accuracy", desc: "Dual AI pathways cross-validate every question, option, and answer key." },
  { icon: CheckCircle, title: "Zero Hallucinations", desc: "Three-tier anti-hallucination architecture traces every field back to source." },
  { icon: FileText, title: "LMS-Ready Output", desc: "Export directly to QTI 2.1/3.0, SCORM, xAPI, cmi5, JSON, or CSV." },
];

const useCases = [
  { icon: GraduationCap, title: "Exam Prep Companies", desc: "Convert decades of past papers into digital question banks at scale." },
  { icon: Award, title: "Certification Bodies", desc: "Digitize certification exam content with full audit trails and accuracy guarantees." },
  { icon: BookOpen, title: "Educational Publishers", desc: "Transform legacy print assessments into interactive, LMS-compatible question pools." },
];

const PdfToQuestionBank = () => {
  const heroRef = useScrollReveal();
  const stepsRef = useScrollReveal();
  const benefitsRef = useScrollReveal();
  const useCasesRef = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div ref={heroRef} className="scroll-reveal max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
            Solution
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
            Convert PDF Exam Libraries into{" "}
            <span className="text-primary">Validated Question Banks</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Stop manually copying questions from PDFs. ExtractIQ's dual AI extraction converts entire document libraries into structured, LMS-ready question banks — with every answer traced to source.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary glow-primary-hover">
                Book a Demo
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20">
            <h3 className="text-xl font-bold text-foreground mb-4">The Manual Way</h3>
            <ul className="space-y-3 text-muted-foreground">
              {["Hours per exam copying questions by hand", "Error-prone manual data entry", "No audit trail or traceability", "Impossible to scale past a few documents", "Format conversion nightmare for each LMS"].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20">
            <h3 className="text-xl font-bold text-foreground mb-4">The ExtractIQ Way</h3>
            <ul className="space-y-3 text-muted-foreground">
              {["Batch-process hundreds of PDFs in minutes", "AI-validated extraction with 99.2% accuracy", "Every field traced to source page and location", "Scale from 10 to 10,000 documents seamlessly", "Native export to QTI, SCORM, xAPI, cmi5"].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={stepsRef} className="scroll-reveal max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Three Steps. Thousands of Questions.</h2>
          <p className="text-muted-foreground mb-12 max-w-xl mx-auto">From raw PDF to validated, export-ready question bank.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="absolute top-4 right-4 text-sm font-mono text-muted-foreground/40">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={benefitsRef} className="scroll-reveal max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-12">Why ExtractIQ for Question Banks</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((b) => (
              <div key={b.title} className="p-8 rounded-2xl bg-card border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={useCasesRef} className="scroll-reveal max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-12">Built for Your Workflow</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((uc) => (
              <div key={uc.title} className="p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 mx-auto">
                  <uc.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{uc.title}</h3>
                <p className="text-sm text-muted-foreground">{uc.desc}</p>
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

export default PdfToQuestionBank;
