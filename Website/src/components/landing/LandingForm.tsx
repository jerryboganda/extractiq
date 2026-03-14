import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { postPublic } from "@/lib/api";

const LandingForm = () => {
  const ref = useScrollReveal();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (submitted) {
    return (
      <section ref={ref} className="scroll-reveal py-24 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-4xl mb-4">OK</div>
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
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setIsSubmitting(true);

            const formData = new FormData(event.currentTarget);

            try {
              await postPublic("/public/contact-request", {
                fullName: String(formData.get("fullName") || ""),
                email: String(formData.get("email") || ""),
                company: String(formData.get("company") || ""),
                useCase: String(formData.get("useCase") || ""),
              });
              setSubmitted(true);
            } catch (requestError) {
              setError(requestError instanceof Error ? requestError.message : "Request failed");
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="lf-name" className="sr-only">Full Name</label>
            <Input id="lf-name" name="fullName" placeholder="Full Name" required maxLength={100} className="bg-card border-border" />
          </div>
          <div>
            <label htmlFor="lf-email" className="sr-only">Work Email</label>
            <Input id="lf-email" name="email" type="email" placeholder="Work Email" required maxLength={255} className="bg-card border-border" />
          </div>
          <div>
            <label htmlFor="lf-company" className="sr-only">Company</label>
            <Input id="lf-company" name="company" placeholder="Company" required maxLength={100} className="bg-card border-border" />
          </div>
          <div>
            <label htmlFor="lf-usecase" className="sr-only">Use case</label>
            <Textarea id="lf-usecase" name="useCase" placeholder="Tell us about your use case" maxLength={1000} className="bg-card border-border" rows={3} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {isSubmitting ? "Submitting..." : "Book a Demo"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default LandingForm;
