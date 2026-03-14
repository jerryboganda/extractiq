import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageMeta from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Zap, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { postPublic } from "@/lib/api";

const valueProps = [
  {
    icon: Zap,
    title: "Live Platform Walkthrough",
    desc: "See dual-pathway extraction and the review queue in action with your own documents.",
  },
  {
    icon: Shield,
    title: "Security & Compliance Review",
    desc: "Understand our enterprise security posture, deployment options, and data handling.",
  },
  {
    icon: BarChart3,
    title: "ROI Analysis",
    desc: "Get a custom cost and efficiency analysis tailored to your specific use case.",
  },
];

const Demo = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const first = (data.get("first") as string)?.trim();
    const last = (data.get("last") as string)?.trim();
    const email = (data.get("email") as string)?.trim();
    const company = (data.get("company") as string)?.trim();

    if (!first || !last || !email || !company) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid work email address.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await postPublic("/public/demo-request", {
        firstName: first,
        lastName: last,
        email,
        company,
        role: (data.get("role") as string)?.trim(),
        monthlyVolume: (data.get("volume") as string)?.trim(),
        useCase: "Requested from public demo page",
      });
      toast({ title: "Demo requested!", description: "We'll be in touch within 24 hours." });
      form.reset();
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Book a Demo — See ExtractIQ in Action" description="Schedule a personalized demo to see how ExtractIQ transforms your document workflows with AI extraction and human review." />
      <Navbar />

      <section className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="pt-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              See ExtractIQ in Action
            </h1>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Get a personalized demo tailored to your document workflows and learn how ExtractIQ
              can transform your operations.
            </p>
            <div className="space-y-8">
              {valueProps.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">Request a Demo</h2>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first" className="text-muted-foreground">First Name *</Label>
                  <Input id="first" name="first" placeholder="Jane" className="mt-1.5 bg-background" required />
                </div>
                <div>
                  <Label htmlFor="last" className="text-muted-foreground">Last Name *</Label>
                  <Input id="last" name="last" placeholder="Doe" className="mt-1.5 bg-background" required />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-muted-foreground">Work Email *</Label>
                <Input id="email" name="email" type="email" placeholder="jane@company.com" className="mt-1.5 bg-background" required />
              </div>
              <div>
                <Label htmlFor="company" className="text-muted-foreground">Company *</Label>
                <Input id="company" name="company" placeholder="Company name" className="mt-1.5 bg-background" required />
              </div>
              <div>
                <Label htmlFor="role" className="text-muted-foreground">Role</Label>
                <Input id="role" name="role" placeholder="Your role" className="mt-1.5 bg-background" />
              </div>
              <div>
                <Label htmlFor="volume" className="text-muted-foreground">Monthly Document Volume</Label>
                <Input id="volume" name="volume" placeholder="e.g. 10,000 pages" className="mt-1.5 bg-background" />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary glow-primary-hover transition-all"
                size="lg"
              >
                {submitting ? "Submitting…" : "Request Demo"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                We'll respond within 24 hours. No spam, ever.
              </p>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Demo;
