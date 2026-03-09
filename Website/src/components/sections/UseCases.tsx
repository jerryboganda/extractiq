import { useScrollReveal } from "@/hooks/useScrollReveal";
import { GraduationCap, FileText, Building2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const useCases = [
  {
    icon: GraduationCap,
    title: "Assessment Digitization",
    desc: "Convert exam PDFs into validated, structured question banks ready for digital assessment platforms.",
    link: "/product",
  },
  {
    icon: FileText,
    title: "Training Content Extraction",
    desc: "Transform training materials into LMS-compatible content packages for enterprise learning systems.",
    link: "/product",
  },
  {
    icon: Building2,
    title: "Enterprise Document Operations",
    desc: "Scale document extraction across teams with full auditability, cost control, and provider orchestration.",
    link: "/enterprise",
  },
];

const UseCases = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="scroll-reveal py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] text-center mb-3">USE CASES</p>
        <h2 className="text-3xl md:text-5xl font-bold text-center text-foreground mb-4">
          Built for Your Workflow
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          Purpose-built solutions for teams that need reliable, scalable document intelligence.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((uc, i) => (
            <Link
              key={uc.title}
              to={uc.link}
              className="group p-8 rounded-xl bg-card border border-border hover:border-primary/50 hover:scale-[1.02] hover:shadow-[0_0_40px_hsl(var(--primary)/0.1)] transition-all duration-300"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <uc.icon className="h-10 w-10 text-primary mb-6" />
              <h3 className="text-xl font-bold text-foreground mb-3">{uc.title}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">{uc.desc}</p>
              <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
