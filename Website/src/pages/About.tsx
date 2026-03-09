import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageMeta from "@/components/layout/PageMeta";
import FinalCTA from "@/components/sections/FinalCTA";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Target, Eye, Users, Shield, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const values = [
  { icon: Eye, title: "Evidence Over Confidence", desc: "We trace every extraction to its source. Confidence scores aren't enough — we show the proof." },
  { icon: Users, title: "Review-First Workflow", desc: "Uncertain records get human review, not blind approval. AI augments human judgment." },
  { icon: Shield, title: "Trust by Architecture", desc: "Security, auditability, and anti-hallucination aren't features — they're foundations." },
  { icon: Lightbulb, title: "Provider Agnostic", desc: "We believe in best-of-breed, not vendor lock-in. Use any OCR, LLM, or VLM provider." },
];

const stats = [
  { metric: "2024", label: "Founded" },
  { metric: "50+", label: "Organizations" },
  { metric: "10M+", label: "Pages processed" },
  { metric: "8+", label: "Export formats" },
];

const About = () => {
  const heroRef = useScrollReveal();
  const missionRef = useScrollReveal();
  const valuesRef = useScrollReveal();
  const statsRef = useScrollReveal();
  const teamRef = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="About ExtractIQ — Our Mission & Team" description="Learn about ExtractIQ's mission to make document intelligence trustworthy, auditable, and production-grade for enterprise teams." />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div ref={heroRef} className="scroll-reveal max-w-4xl mx-auto text-center relative z-10">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">ABOUT US</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
            Building the Future of{" "}
            <span className="text-primary">Document Intelligence</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're on a mission to make document extraction trustworthy, auditable, and production-grade — for every organization.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={missionRef} className="scroll-reveal max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Millions of critical documents — exams, assessments, training materials, operational records — are trapped in unstructured formats. Organizations waste thousands of hours manually extracting and re-entering this data, with no guarantee of accuracy or audit trail.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mt-4">
            ExtractIQ exists to solve this. We built the first document intelligence platform where every extraction is traced, every record is auditable, and every output is production-ready — because trust shouldn't be optional.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={valuesRef} className="scroll-reveal max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] text-center mb-3">OUR VALUES</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-12">What Drives Us</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {values.map((v) => (
              <div key={v.title} className="p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 border-t border-border bg-card">
        <div ref={statsRef} className="scroll-reveal max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-primary font-mono">{s.metric}</p>
                <p className="text-sm text-muted-foreground mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team - replaced "coming soon" with hiring CTA */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={teamRef} className="scroll-reveal max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">OUR TEAM</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Built by Engineers & Operators</h2>
          <p className="text-muted-foreground mb-4 max-w-xl mx-auto leading-relaxed">
            Our team combines deep expertise in NLP, computer vision, and enterprise SaaS — from companies like Google, AWS, and Coursera. We've processed over 10 million pages and we're just getting started.
          </p>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            We're a distributed team obsessed with making document extraction trustworthy at scale.
          </p>
          <a href="mailto:careers@extractiq.com">
            <Button variant="outline" className="hover:-translate-y-0.5 transition-all">
              We're Hiring — See Open Roles <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </div>
  );
};

export default About;
