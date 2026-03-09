import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Product", href: "/product" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Enterprise", href: "/enterprise" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
];

const solutionLinks = [
  { label: "PDF to Question Bank", href: "/solutions/pdf-to-question-bank" },
  { label: "LMS Export", href: "/solutions/lms-export" },
  { label: "Document Operations", href: "/solutions/document-operations" },
];

const moreLinks = [
  { label: "Integrations", href: "/integrations" },
  { label: "Compare", href: "/compare" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setPastHero(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => location.pathname === href;
  const isGroupActive = (links: typeof navLinks) => links.some((l) => location.pathname === l.href);

  return (
    <>
      <header
        role="banner"
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-foreground tracking-tight">
            Extract<span className="text-primary">IQ</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6">
            {navLinks.slice(0, 2).map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300",
                  isActive(link.href) ? "text-primary font-medium after:w-full" : "text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Solutions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "text-sm transition-colors flex items-center gap-1 outline-none",
                  isGroupActive(solutionLinks) ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Solutions <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-card border-border">
                {solutionLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link to={link.href} className={cn("cursor-pointer", isActive(link.href) && "text-primary")}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {navLinks.slice(2).map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300",
                  isActive(link.href) ? "text-primary font-medium after:w-full" : "text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* More Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "text-sm transition-colors flex items-center gap-1 outline-none",
                  isGroupActive(moreLinks) ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                )}
              >
                More <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-card border-border">
                {moreLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link to={link.href} className={cn("cursor-pointer", isActive(link.href) && "text-primary")}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/demo">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary glow-primary-hover transition-all hover:-translate-y-0.5">
                Start Free Trial
              </Button>
            </Link>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border w-72">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "text-lg transition-colors py-2",
                      isActive(link.href) ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mt-4">Solutions</p>
                {solutionLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "text-lg transition-colors py-2 pl-2",
                      isActive(link.href) ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mt-4">More</p>
                {moreLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "text-lg transition-colors py-2 pl-2",
                      isActive(link.href) ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link to="/demo" onClick={() => setOpen(false)}>
                  <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                    Start Free Trial
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Sticky conversion bar — shows after scrolling past hero on homepage */}
      {isHome && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 md:hidden",
            pastHero ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          )}
        >
          <div className="bg-background/95 backdrop-blur-xl border-t border-border px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Extract<span className="text-primary">IQ</span></span>
            <Link to="/demo">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary text-xs">
                Start Free Trial <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
