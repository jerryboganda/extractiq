import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  Layers, Lock, Users, Activity, Clock, Eye,
  BarChart3, Key, Server, Bell, Wrench, Shield,
} from "lucide-react";

const features = [
  { icon: Layers, title: "Resumable Jobs", desc: "Pick up where you left off. No lost progress on large batches." },
  { icon: Lock, title: "Audit Logs", desc: "Complete traceability for every action, extraction, and review." },
  { icon: Users, title: "RBAC", desc: "Role-based access for admins, operators, reviewers, and analysts." },
  { icon: Key, title: "Encrypted Secrets", desc: "Provider API keys stored securely with enterprise encryption." },
  { icon: BarChart3, title: "Analytics", desc: "Extraction quality, throughput, and cost analytics in real time." },
  { icon: Wrench, title: "Workflow Templates", desc: "Standardize extraction workflows across teams and projects." },
  { icon: Activity, title: "Observability", desc: "Monitor job health, error rates, and system performance." },
  { icon: Shield, title: "Validation Engine", desc: "Automated format, schema, and cross-field validation rules." },
  { icon: Server, title: "Private Deploy", desc: "Deploy on your infrastructure for maximum data control." },
  { icon: Clock, title: "Async Processing", desc: "Queue heavy workloads without blocking your workflow." },
  { icon: Eye, title: "Evidence Linking", desc: "Every extracted field links back to its source excerpt." },
  { icon: Bell, title: "Notifications", desc: "Get alerted when jobs complete, fail, or need review." },
];

const FeatureGrid = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="scroll-reveal py-24 px-4 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] text-center mb-3">FEATURES</p>
        <h2 className="text-3xl md:text-5xl font-bold text-center text-foreground mb-4">
          Built for Production
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          Enterprise-grade features that make document intelligence reliable, scalable, and auditable.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(var(--primary)/0.08)] transition-all duration-300 group"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <f.icon className="h-5 w-5 text-primary mb-3 group-hover:text-accent transition-colors" />
              <h3 className="font-semibold text-foreground text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
