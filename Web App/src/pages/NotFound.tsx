import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Floating decorations */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-destructive/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 text-center glass border border-border/50 rounded-2xl p-12 max-w-md mx-4">
        <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-br from-primary via-accent to-destructive bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-lg font-semibold mb-2">Page not found</h2>
        <p className="text-sm text-muted-foreground mb-8">
          The page at <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{location.pathname}</code> doesn't exist or has been moved.
        </p>
        <Button asChild className="gap-2">
          <a href="/">
            <Home className="h-4 w-4" /> Go to Dashboard
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
