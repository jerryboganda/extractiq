import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
        <p className="text-sm text-muted-foreground mb-3">
          We use cookies to improve your experience. By continuing to use this site, you agree to our use of cookies.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={accept} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={accept} className="text-muted-foreground">
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
