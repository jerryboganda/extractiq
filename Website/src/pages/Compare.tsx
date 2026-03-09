import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageMeta from "@/components/layout/PageMeta";
import FinalCTA from "@/components/sections/FinalCTA";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Check, X, Minus } from "lucide-react";

type CellValue = "yes" | "no" | "partial";

const competitors = ["ExtractIQ", "Manual Process", "Basic OCR Tools", "Generic LLM Wrappers", "Point Solutions"];

const features: { feature: string; values: CellValue[] }[] = [
  { feature: "Dual-pathway extraction (OCR+LLM & VLM)", values: ["yes", "no", "no", "partial", "no"] },
  { feature: "Anti-hallucination architecture", values: ["yes", "no", "no", "no", "no"] },
  { feature: "Human-in-the-loop review", values: ["yes", "yes", "no", "no", "partial"] },
  { feature: "Source evidence tracing", values: ["yes", "no", "no", "no", "no"] },
  { feature: "Native LMS export (QTI, SCORM, xAPI)", values: ["yes", "no", "no", "no", "partial"] },
  { feature: "Provider orchestration", values: ["yes", "no", "no", "no", "no"] },
  { feature: "Cost intelligence & optimization", values: ["yes", "no", "no", "no", "no"] },
  { feature: "Full audit trail", values: ["yes", "no", "no", "no", "partial"] },
  { feature: "Enterprise RBAC & security", values: ["yes", "no", "no", "no", "partial"] },
  { feature: "Resumable batch jobs", values: ["yes", "no", "no", "no", "no"] },
  { feature: "Real-time analytics", values: ["yes", "no", "no", "partial", "partial"] },
  { feature: "Custom workflow templates", values: ["yes", "no", "no", "no", "no"] },
];

const CellIcon = ({ value }: { value: CellValue }) => {
  if (value === "yes") return <Check className="w-5 h-5 text-[hsl(var(--success))]" />;
  if (value === "no") return <X className="w-5 h-5 text-destructive/60" />;
  return <Minus className="w-5 h-5 text-muted-foreground/40" />;
};

const differentiators = [
  { title: "Evidence Over Confidence", desc: "Other tools give you a confidence score. ExtractIQ gives you the source evidence — the exact page, region, and text that produced each extraction." },
  { title: "Dual Intelligence, Not Single Point of Failure", desc: "Most tools use one extraction method. ExtractIQ runs two independent AI pathways and cross-validates results." },
  { title: "Operations-Grade, Not Demo-Grade", desc: "Resumable jobs, provider fallbacks, cost guardrails, and audit trails — ExtractIQ is built for production at scale." },
];

const Compare = () => {
  const heroRef = useScrollReveal();
  const tableRef = useScrollReveal();
  const diffRef = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Compare — ExtractIQ vs Alternatives" description="See how ExtractIQ compares to manual processes, basic OCR tools, generic LLM wrappers, and point solutions." />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div ref={heroRef} className="scroll-reveal max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
            Why Teams Choose{" "}
            <span className="text-primary">ExtractIQ</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how ExtractIQ compares to manual processes, basic OCR tools, generic LLM wrappers, and point solutions.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={tableRef} className="scroll-reveal max-w-6xl mx-auto overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 pr-4 text-sm font-semibold text-foreground w-[240px]">Feature</th>
                {competitors.map((c, i) => (
                  <th key={c} className={`py-4 px-3 text-center text-sm font-semibold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((row) => (
                <tr key={row.feature} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                  <td className="py-3.5 pr-4 text-sm text-foreground">{row.feature}</td>
                  {row.values.map((val, i) => (
                    <td key={i} className={`py-3.5 px-3 text-center ${i === 0 ? "bg-primary/5" : ""}`}>
                      <div className="flex justify-center"><CellIcon value={val} /></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Differentiators */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div ref={diffRef} className="scroll-reveal max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-12">The ExtractIQ Difference</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {differentiators.map((d) => (
              <div key={d.title} className="p-8 rounded-2xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-3">{d.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
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

export default Compare;
