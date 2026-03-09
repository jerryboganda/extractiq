import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "ExtractIQ replaced our entire manual QA pipeline. We went from **3 days** of review per batch to under **4 hours** — with higher accuracy.",
    name: "Sarah Chen",
    initials: "SC",
    title: "VP of Content Operations",
    company: "EduScale",
    metric: "18x faster review",
    rating: 5,
  },
  {
    quote: "The dual-pathway extraction caught errors our previous OCR tool missed entirely. The anti-hallucination controls give us confidence to automate at scale.",
    name: "Marcus Rodriguez",
    initials: "MR",
    title: "Director of Assessment Engineering",
    company: "CertifyPro",
    metric: "99.4% accuracy",
    rating: 5,
  },
  {
    quote: "We evaluated five platforms. ExtractIQ was the only one that provided source evidence tracing and native LMS export. It's **not even close**.",
    name: "Dr. Priya Kapoor",
    initials: "PK",
    title: "Chief Learning Officer",
    company: "GlobalLearn Systems",
    metric: "5 platforms evaluated",
    rating: 5,
  },
];

const renderQuote = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="text-accent font-bold">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const Testimonials = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="scroll-reveal py-24 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] text-center mb-3">SOCIAL PROOF</p>
        <h2 className="text-3xl md:text-5xl font-bold text-foreground text-center mb-4">
          Trusted by Document Teams
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
          Hear from teams that transformed their document operations with ExtractIQ.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 flex flex-col group"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Rating */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-accent text-accent" />
                ))}
              </div>

              <Quote className="h-7 w-7 text-primary/30 mb-3 shrink-0 group-hover:text-primary/50 transition-colors" />
              <blockquote className="text-foreground leading-relaxed mb-4 flex-1 text-sm">
                "{renderQuote(t.quote)}"
              </blockquote>

              {/* Metric badge */}
              <div className="mb-5">
                <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  {t.metric}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.title}, {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
