import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageMeta from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload, Settings, Cpu, Shield, Eye, BarChart3, Download } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  { icon: Upload, num: "01", title: "Upload Your Documents", desc: "Drag and drop PDFs — single files or entire collections. ExtractIQ handles any volume, from dozens to millions of pages. Documents are encrypted in transit and at rest." },
  { icon: Settings, num: "02", title: "Configure Extraction", desc: "Select your extraction pathway (OCR+LLM, VLM, or hybrid), choose providers, set validation rules, and define your output schema. Use templates for repeatable workflows." },
  { icon: Cpu, num: "03", title: "AI Extraction Runs", desc: "The platform processes documents through your configured pipeline. Dual-pathway extraction handles both text-heavy and visually complex pages. Anti-hallucination controls verify every field." },
  { icon: Shield, num: "04", title: "Automated Validation", desc: "Every extracted record passes through the validation engine — format checks, schema validation, cross-field verification, and confidence scoring. High-confidence records are approved automatically." },
  { icon: Eye, num: "05", title: "Human Review", desc: "Uncertain records flow into the review queue. Reviewers see source documents side-by-side with extracted output. Edit, approve, reject, or reprocess with full traceability." },
  { icon: BarChart3, num: "06", title: "Quality Analytics", desc: "Monitor extraction quality, accuracy rates, processing costs, and provider performance in real time. Use insights to optimize your pipeline and reduce costs." },
  { icon: Download, num: "07", title: "Export & Integrate", desc: "Download validated data in any format — QTI, SCORM, xAPI, cmi5, JSON, CSV. Push directly to your LMS or integrate via API. Every record maintains its audit trail." },
];

const faqs = [
  { q: "What document formats does ExtractIQ support?", a: "ExtractIQ processes PDFs (text-based and scanned), images (PNG, JPEG, TIFF), and Word documents. Our dual-pathway engine handles everything from clean digital PDFs to low-quality scans." },
  { q: "How does the dual-pathway extraction work?", a: "Documents are routed through two complementary pipelines: OCR+LLM for text-heavy pages and Vision Language Models (VLM) for visually complex layouts like tables, diagrams, and multi-column content. Results are merged and cross-validated." },
  { q: "What are anti-hallucination controls?", a: "Every extracted field is traced back to its source location in the document. Confidence scores, source coordinates, and validation rules ensure that AI-generated content is grounded in the actual document — not fabricated." },
  { q: "Can I integrate ExtractIQ with my existing systems?", a: "Yes. ExtractIQ provides REST APIs, webhooks, and native integrations with popular LMS platforms (Canvas, Moodle, Blackboard), storage providers (S3, GCS), and workflow tools (Zapier, Make)." },
  { q: "How long does extraction take?", a: "Most single documents process in under 30 seconds. Batch jobs scale horizontally — a 1,000-page batch typically completes in under 10 minutes depending on complexity and provider configuration." },
  { q: "Is my data secure during processing?", a: "All documents are encrypted in transit (TLS 1.3) and at rest (AES-256). Processing happens in isolated environments. Documents are automatically purged after your configured retention period. SOC 2 Type II compliant." },
];

const HowItWorks = () => {
  const faqRef = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="How It Works — ExtractIQ Document Extraction Pipeline" description="From raw documents to validated, LMS-ready data in seven steps. Upload, configure, extract, review, validate, export, analyze." />
      <Navbar />

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            How ExtractIQ Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From raw documents to validated, LMS-ready data — in seven clear steps.
          </p>
        </div>
      </section>

      <section className="pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.num} className="flex gap-6 md:gap-8">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                {i < steps.length - 1 && <div className="w-px flex-1 bg-border mt-4" />}
              </div>
              <div className="pb-14">
                <span className="text-xs font-mono text-primary tracking-wider">STEP {step.num}</span>
                <h2 className="text-2xl font-bold text-foreground mt-1 mb-3">{step.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="scroll-reveal py-24 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Common Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 bg-card/50">
                <AccordionTrigger className="text-foreground hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center p-6 sm:p-12 rounded-2xl border border-primary/30 bg-primary/5">
          <h2 className="text-3xl font-bold text-foreground mb-4">See It in Action</h2>
          <p className="text-muted-foreground mb-8">Get a live walkthrough of the complete extraction pipeline.</p>
          <Link to="/demo">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary">
              Book a Demo
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
