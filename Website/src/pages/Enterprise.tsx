import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageMeta from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Lock, Users, Server, Eye, Key, Award, Globe, Clock, FileText } from "lucide-react";

const capabilities = [
  {
    category: "Security & Compliance",
    items: [
      { icon: Lock, title: "End-to-End Encryption", desc: "All data encrypted in transit (TLS 1.3) and at rest (AES-256)." },
      { icon: Shield, title: "SOC 2 Compliance", desc: "Security controls aligned with SOC 2 Type II requirements." },
      { icon: Key, title: "SSO & SAML", desc: "Enterprise single sign-on with SAML 2.0 support (roadmap)." },
      { icon: FileText, title: "Data Residency", desc: "Choose where your data is stored and processed." },
    ],
  },
  {
    category: "Operations & Control",
    items: [
      { icon: Users, title: "RBAC & Teams", desc: "Role-based access for admins, operators, reviewers, and analysts." },
      { icon: Eye, title: "Audit Logs", desc: "Complete activity logs for every extraction, review, and export." },
      { icon: Server, title: "Private Deployment", desc: "Deploy on your infrastructure or dedicated cloud tenancy." },
      { icon: Globe, title: "API Access", desc: "Full REST API for integration with your existing systems." },
    ],
  },
  {
    category: "Reliability & Support",
    items: [
      { icon: Award, title: "99.9% SLA", desc: "Enterprise-grade uptime commitment with dedicated monitoring." },
      { icon: Clock, title: "Priority Support", desc: "Dedicated support team with guaranteed response times." },
      { icon: Users, title: "Onboarding", desc: "White-glove onboarding with training and workflow design." },
      { icon: FileText, title: "Custom SLA", desc: "Tailored service agreements for enterprise requirements." },
    ],
  },
];

const Enterprise = () => (
  <div className="min-h-screen bg-background">
    <PageMeta title="Enterprise — ExtractIQ for Large Teams" description="Enterprise-grade document intelligence with SOC 2 readiness, private deployment, RBAC, SSO, and dedicated support." />
    <Navbar />

    <section className="pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Built for Enterprise
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Security, compliance, and operational controls that meet the most demanding enterprise requirements.
        </p>
        <Link to="/demo">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary">
            Talk to Enterprise Sales
          </Button>
        </Link>
      </div>
    </section>

    {capabilities.map((cat, i) => (
      <section key={cat.category} className={`py-20 px-4 ${i % 2 === 1 ? "bg-card/30" : ""}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">{cat.category}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {cat.items.map((item) => (
              <div key={item.title} className="flex gap-4 p-6 rounded-xl bg-card border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    ))}

    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto text-center p-6 sm:p-12 rounded-2xl border border-primary/30 bg-primary/5">
        <h2 className="text-3xl font-bold text-foreground mb-4">Ready for Enterprise Scale?</h2>
        <p className="text-muted-foreground mb-8">
          Let's discuss your security requirements, deployment needs, and integration goals.
        </p>
        <Link to="/demo">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary">
            Contact Enterprise Sales
          </Button>
        </Link>
      </div>
    </section>

    <Footer />
  </div>
);

export default Enterprise;
