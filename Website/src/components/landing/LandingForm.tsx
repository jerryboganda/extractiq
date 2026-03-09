import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const LandingForm = () => {
  const ref = useScrollReveal();
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <section ref={ref} className="scroll-reveal py-24 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-4xl mb-4">✓</div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Thank you!</h3>
          <p className="text-muted-foreground">We'll be in touch within 24 hours.</p>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="demo-form" className="scroll-reveal py-24 px-4">
      <div className="max-w-lg mx-auto">
        <h2 className="text-3xl font-bold text-foreground text-center mb-2">Request a Demo</h2>
        <p className="text-muted-foreground text-center mb-8">See ExtractIQ in action with your documents.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="lf-name" className="sr-only">Full Name</label>
            <Input id="lf-name" placeholder="Full Name" required maxLength={100} className="bg-card border-border" />
          </div>
          <div>
            <label htmlFor="lf-email" className="sr-only">Work Email</label>
            <Input id="lf-email" type="email" placeholder="Work Email" required maxLength={255} className="bg-card border-border" />
          </div>
          <div>
            <label htmlFor="lf-company" className="sr-only">Company</label>
            <Input id="lf-company" placeholder="Company" required maxLength={100} className="bg-card border-border" />
          </div>
          <div>
            <label htmlFor="lf-usecase" className="sr-only">Use case</label>
            <Textarea id="lf-usecase" placeholder="Tell us about your use case" maxLength={1000} className="bg-card border-border" rows={3} />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Book a Demo
          </Button>
        </form>
      </div>
    </section>
  );
};

export default LandingForm;
