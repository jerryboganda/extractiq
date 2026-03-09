import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const footerLinks = {
  Product: [
    { label: "Overview", href: "/product" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Integrations", href: "/integrations" },
    { label: "Compare", href: "/compare" },
  ],
  Solutions: [
    { label: "PDF to Question Bank", href: "/solutions/pdf-to-question-bank" },
    { label: "LMS Export", href: "/solutions/lms-export" },
    { label: "Document Operations", href: "/solutions/document-operations" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Enterprise", href: "/enterprise" },
    { label: "Security", href: "/security" },
    { label: "Contact", href: "/demo" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Status", href: "#" },
  ],
};

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Thanks for subscribing! We'll be in touch.");
    setEmail("");
  };

  return (
    <footer role="contentinfo" aria-label="Site footer" className="border-t border-border bg-card py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-xl font-bold text-foreground tracking-tight">
              Extract<span className="text-primary">IQ</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Enterprise document intelligence.
              <br />
              Production grade.
            </p>
            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="mt-6 flex flex-col sm:flex-row gap-2">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <Input
                id="footer-email"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs bg-background border-border"
                required
              />
              <Button type="submit" size="sm" className="h-9 text-xs shrink-0">
                Subscribe
              </Button>
            </form>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ExtractIQ. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              SLA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
