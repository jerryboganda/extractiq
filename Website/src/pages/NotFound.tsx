import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, FileText, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageMeta from "@/components/layout/PageMeta";

const suggestions = [
  { icon: Home, label: "Homepage", href: "/" },
  { icon: FileText, label: "Product", href: "/product" },
  { icon: HelpCircle, label: "How It Works", href: "/how-it-works" },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <PageMeta title="Page Not Found — ExtractIQ" description="The page you're looking for doesn't exist." />
      <div className="text-center max-w-lg">
        <div className="text-8xl md:text-9xl font-black text-primary/20 mb-4 select-none">404</div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          The page <span className="font-mono text-sm text-primary/70 bg-primary/10 px-2 py-0.5 rounded break-all">{location.pathname}</span> doesn't exist or has been moved.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {suggestions.map((s) => (
            <Link key={s.href} to={s.href}>
              <Button variant="outline" className="gap-2 border-border hover:border-primary/40">
                <s.icon className="h-4 w-4" />
                {s.label}
              </Button>
            </Link>
          ))}
        </div>

        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
