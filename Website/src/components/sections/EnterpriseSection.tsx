import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Shield, Lock, Users, Eye, Server, Key, Award, FileText } from "lucide-react";

const securityFeatures = [
  { icon: Shield, label: "SOC 2 Ready" },
  { icon: Lock, label: "End-to-End Encryption" },
  { icon: Users, label: "RBAC & Teams" },
  { icon: Eye, label: "Full Audit Logs" },
  { icon: Server, label: "Private Deployment" },
  { icon: Key, label: "SSO (Roadmap)" },
  { icon: Award, label: "99.9% SLA" },
  { icon: FileText, label: "Data Residency" },
];

const EnterpriseSection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="scroll-reveal py-24 px-4 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] text-center mb-3">ENTERPRISE</p>
        <h2 className="text-3xl md:text-5xl font-bold text-center text-foreground mb-4">
          Enterprise Grade. From Day One.
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          Security, compliance, and operational controls built in — not bolted on.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {securityFeatures.map((f, i) => (
            <div
              key={f.label}
              className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-accent/30 hover:scale-[1.02] transition-all duration-300"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <f.icon className="h-5 w-5 text-accent shrink-0" />
              <span className="text-sm font-medium text-foreground">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="max-w-3xl mx-auto text-center p-10 md:p-12 rounded-2xl bg-card border border-border">
          <blockquote className="text-xl md:text-2xl text-foreground font-medium leading-relaxed mb-8">
            "ExtractIQ reduced our question bank creation time by 80%. The review queue and
            anti-hallucination controls give us confidence we never had with other tools."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              JD
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">Dr. Jane Doe</div>
              <div className="text-sm text-muted-foreground">VP of Content, Leading EdTech Company</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnterpriseSection;
