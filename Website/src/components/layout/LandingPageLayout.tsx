import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const LandingPageLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground">
    {/* Minimal header */}
    <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="text-xl font-bold text-foreground">
          Extract<span className="text-primary">IQ</span>
        </Link>
        <Link to="/demo">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Book a Demo
          </Button>
        </Link>
      </div>
    </header>

    <main className="pt-16">{children}</main>

    {/* Trust footer */}
    <footer className="border-t border-border/40 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>Extract<span className="text-primary font-semibold">IQ</span> — AI-powered document intelligence</span>
        <div className="flex gap-4">
          <Link to="/security" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/security" className="hover:text-foreground transition-colors">Security</Link>
        </div>
        <span>© {new Date().getFullYear()} ExtractIQ. All rights reserved.</span>
      </div>
    </footer>
  </div>
);

export default LandingPageLayout;
