import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface UpgradeBannerProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onAction?: () => void;
}

export function UpgradeBanner({ icon: Icon = Sparkles, title, description, ctaLabel, onAction }: UpgradeBannerProps) {
  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {ctaLabel && onAction && (
          <Button
            size="sm"
            className="gap-1.5 h-8 shrink-0"
            onClick={onAction}
          >
            <Sparkles className="h-3 w-3" />
            {ctaLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
