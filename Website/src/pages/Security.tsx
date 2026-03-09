import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageMeta from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Lock, Eye, Server, Database, Activity, Check } from "lucide-react";

const securityAreas = [
  {
    icon: Lock,
    title: "Data Encryption",
    items: ["TLS 1.3 for all data in transit", "AES-256 encryption at rest", "Encrypted secret storage for API keys", "Signed URLs for document access"],
  },
  {
    icon: Shield,
    title: "Access Control",
    items: ["Role-based access control (RBAC)", "Multi-workspace isolation", "Granular permission management", "SSO / SAML integration (roadmap)"],
  },
  {
    icon: Eye,
    title: "Auditability",
    items: ["Complete audit trail for all actions", "Extraction provenance tracking", "Review decision logging", "Export and access logs"],
  },
  {
    icon: Server,
    title: "Infrastructure",
    items: ["SOC 2 aligned controls", "Redundant infrastructure", "Automated backups", "DDoS protection"],
  },
  {
    icon: Database,
    title: "Data Handling",
    items: ["Data residency options", "Data retention policies", "Right to deletion", "No training on customer data"],
  },
  {
    icon: Activity,
    title: "Monitoring",
    items: ["Real-time system monitoring", "Anomaly detection", "Incident response procedures", "Status page transparency"],
  },
];

const Security = () => (
  <div className="min-h-screen bg-background">
    <PageMeta title="Security — ExtractIQ Trust & Compliance" description="End-to-end encryption, SOC 2 readiness, RBAC, audit logs, and data residency options. Security built in from day one." />
    <Navbar />

    <section className="pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">Security & Trust</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your documents contain sensitive data. We built ExtractIQ with security as a foundation, not an afterthought.
        </p>
      </div>
    </section>

    <section className="pb-24 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {securityAreas.map((area) => (
          <div key={area.title} className="p-8 rounded-xl bg-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <area.icon className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-4">{area.title}</h2>
            <ul className="space-y-2.5">
              {area.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>

    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto text-center p-6 sm:p-12 rounded-2xl border border-primary/30 bg-primary/5">
        <h2 className="text-3xl font-bold text-foreground mb-4">Questions About Security?</h2>
        <p className="text-muted-foreground mb-8">
          Our team can walk you through our security posture and compliance documentation.
        </p>
        <Link to="/demo">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary">
            Schedule Security Review
          </Button>
        </Link>
      </div>
    </section>

    <Footer />
  </div>
);

export default Security;
