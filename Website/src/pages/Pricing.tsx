import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageMeta from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Check, Shield, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const tiers = [
  {
    name: "Starter",
    monthly: 299,
    pages: 5000,
    desc: "For small teams getting started with document intelligence.",
    features: [
      "Up to 5,000 pages/month",
      "2 team members",
      "OCR + LLM pipeline",
      "Basic validation",
      "JSON / CSV export",
      "Email support",
      "Community access",
    ],
    cta: "Start Free Trial",
    href: "#",
    highlighted: false,
    social: null,
  },
  {
    name: "Professional",
    monthly: 899,
    pages: 50000,
    desc: "For growing teams that need full extraction power.",
    features: [
      "Up to 50,000 pages/month",
      "10 team members",
      "Dual-pathway extraction",
      "Full validation engine",
      "All LMS export formats",
      "Human review queue",
      "Provider orchestration",
      "Cost analytics",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "#",
    highlighted: true,
    social: "Chosen by 340+ teams",
  },
  {
    name: "Enterprise",
    monthly: 0,
    pages: 0,
    desc: "For organizations that need maximum control and scale.",
    features: [
      "Unlimited pages",
      "Unlimited team members",
      "Private deployment option",
      "Custom SLA",
      "SSO / SAML",
      "Dedicated support",
      "Custom integrations",
      "Audit & compliance pack",
      "Onboarding & training",
    ],
    cta: "Talk to Sales",
    href: "/demo",
    highlighted: false,
    social: null,
  },
];

const Pricing = () => {
  const [annual, setAnnual] = useState(false);

  const getPrice = (monthly: number) => {
    if (monthly === 0) return null;
    return annual ? Math.round(monthly * 0.8) : monthly;
  };

  const getCostPerPage = (monthly: number, pages: number) => {
    if (monthly === 0 || pages === 0) return null;
    const price = annual ? Math.round(monthly * 0.8) : monthly;
    return (price / pages).toFixed(2);
  };

  const getAnnualSavings = (monthly: number) => {
    if (monthly === 0) return 0;
    return Math.round(monthly * 12 * 0.2);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Pricing — ExtractIQ Plans & Packages" description="Simple, transparent pricing for document intelligence. From Starter to Enterprise with volume discounts and custom plans." />
      <Navbar />

      <section className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">PRICING</p>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Start free. Scale as you grow. Enterprise-ready when you need it.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full px-5 py-2.5">
              <span className={`text-sm font-medium transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
              <Switch checked={annual} onCheckedChange={setAnnual} />
              <span className={`text-sm font-medium transition-colors ${annual ? "text-foreground" : "text-muted-foreground"}`}>
                Annual
                <span className="ml-1.5 text-xs font-semibold text-accent">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {tiers.map((tier) => {
              const price = getPrice(tier.monthly);
              const perPage = getCostPerPage(tier.monthly, tier.pages);
              const savings = getAnnualSavings(tier.monthly);

              return (
                <div
                  key={tier.name}
                  className={`p-8 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg duration-300 ${
                    tier.highlighted
                      ? "border-primary/50 bg-gradient-to-b from-primary/8 to-primary/3 shadow-[0_0_50px_hsl(var(--primary)/0.12)] scale-[1.02]"
                      : "border-border bg-card hover:shadow-primary/5"
                  }`}
                >
                  {tier.highlighted && (
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">Most Popular</span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-foreground mb-2">{tier.name}</h3>
                  <div className="mb-1">
                    {price !== null ? (
                      <>
                        <span className="text-4xl font-extrabold text-foreground">${price}</span>
                        <span className="text-muted-foreground">/{annual ? "year" : "month"}</span>
                      </>
                    ) : (
                      <div>
                        <span className="text-2xl font-extrabold text-foreground">Let's talk</span>
                        <p className="text-xs text-muted-foreground mt-1">Typically $2,000–$5,000/mo</p>
                      </div>
                    )}
                  </div>

                  {/* Cost per page */}
                  {perPage && (
                    <p className="text-xs text-accent font-medium mb-1">${perPage}/page</p>
                  )}

                  {/* Annual savings */}
                  {annual && savings > 0 && (
                    <p className="text-xs text-success font-semibold mb-3">Save ${savings.toLocaleString()}/year</p>
                  )}

                  <p className="text-sm text-muted-foreground mb-6">{tier.desc}</p>

                  {/* Social proof */}
                  {tier.social && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 w-fit">
                      <Zap className="h-3 w-3 text-accent" />
                      <span className="text-[11px] font-semibold text-accent">{tier.social}</span>
                    </div>
                  )}

                  <Link to={tier.href}>
                    <Button
                      className={`w-full mb-4 hover:-translate-y-0.5 transition-all ${
                        tier.highlighted
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
                          : ""
                      }`}
                      variant={tier.highlighted ? "default" : "outline"}
                    >
                      {tier.cta}
                    </Button>
                  </Link>

                  {/* Guarantee badge */}
                  <div className="flex items-center gap-1.5 mb-6 justify-center">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">14-day free trial · No credit card</span>
                  </div>

                  <ul className="space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial between pricing and FAQ */}
      <PricingTestimonial />
      <PricingFAQ />
      <Footer />
    </div>
  );
};

const PricingTestimonial = () => {
  const ref = useScrollReveal();
  return (
    <section ref={ref} className="scroll-reveal py-16 px-4">
      <div className="max-w-3xl mx-auto text-center p-8 sm:p-12 rounded-2xl bg-card border border-border">
        <div className="flex justify-center gap-0.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-accent text-accent" />
          ))}
        </div>
        <blockquote className="text-lg md:text-xl text-foreground font-medium leading-relaxed mb-6">
          "We switched from a $2,400/month legacy tool to ExtractIQ Professional. <span className="text-accent font-bold">63% cost reduction</span> with better accuracy and native QTI export."
        </blockquote>
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            DL
          </div>
          <div className="text-left">
            <div className="font-semibold text-foreground text-sm">David Lin</div>
            <div className="text-xs text-muted-foreground">Head of Digital Content, LearnPlatform</div>
          </div>
        </div>
      </div>
    </section>
  );
};

const faqs = [
  { q: "Is there a free trial?", a: "Yes — all plans include a 14-day free trial with full access to features. No credit card required to start." },
  { q: "What counts as a 'page'?", a: "A page is a single side of a document. A 10-page PDF counts as 10 pages. Scanned images count as 1 page each." },
  { q: "Can I change plans later?", a: "Absolutely. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle." },
  { q: "What happens if I exceed my page limit?", a: "We'll notify you when you reach 80% of your limit. Overages are billed at a per-page rate, or you can upgrade to a higher plan." },
  { q: "Do you offer annual billing?", a: "Yes — annual billing saves 20% compared to monthly. Toggle the switch above to see annual pricing." },
  { q: "What's included in Enterprise?", a: "Enterprise includes unlimited pages, private deployment options, custom SLAs, SSO/SAML, dedicated support, and a full compliance pack." },
  { q: "How does the human review queue work?", a: "When extraction confidence is below your threshold, items are routed to a review queue where team members can verify and correct fields before export." },
  { q: "Can I use my own AI providers?", a: "Yes — Professional and Enterprise plans support provider orchestration, letting you bring your own OCR, LLM, or VLM providers." },
];

const PricingFAQ = () => {
  const ref = useScrollReveal();
  return (
    <section ref={ref} className="scroll-reveal py-24 px-4 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">Frequently Asked Questions</h2>
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
  );
};

export default Pricing;
