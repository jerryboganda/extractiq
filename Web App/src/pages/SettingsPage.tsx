import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, Key, Webhook, CreditCard, Copy, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace, useUpdateWorkspace, useWorkspaceUsage } from "@/hooks/use-api";

const settingsSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional().or(z.literal("")),
  maxFileSizeMb: z.coerce.number().int().min(1, "Minimum 1 MB").max(500, "Maximum 500 MB"),
  autoApproveEnabled: z.boolean(),
  emailNotifications: z.boolean(),
  webhookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const { data: usage } = useWorkspaceUsage();
  const updateWorkspace = useUpdateWorkspace();
  const [showApiKey, setShowApiKey] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      description: "",
      maxFileSizeMb: 50,
      autoApproveEnabled: false,
      emailNotifications: true,
      webhookUrl: "",
    },
  });

  useEffect(() => {
    if (workspace) {
      const settings = (workspace.settings ?? {}) as Record<string, unknown>;
      reset({
        name: workspace.name ?? "",
        description: workspace.description ?? "",
        maxFileSizeMb: workspace.maxFileSizeMb ?? 50,
        autoApproveEnabled: workspace.autoApproveThreshold !== null && workspace.autoApproveThreshold !== undefined,
        emailNotifications: settings.emailNotifications !== false,
        webhookUrl: (settings.webhookUrl as string) ?? "",
      });
    }
  }, [workspace, reset]);

  const onSubmit = (data: SettingsFormValues) => {
    const trimmedDescription = data.description?.trim() ?? "";
    const trimmedWebhookUrl = data.webhookUrl?.trim() ?? "";

    updateWorkspace.mutate({
      name: data.name.trim(),
      description: trimmedDescription,
      maxFileSizeMb: data.maxFileSizeMb,
      autoApproveThreshold: data.autoApproveEnabled ? (workspace?.autoApproveThreshold ?? 90) : null,
      emailNotifications: data.emailNotifications,
      webhookUrl: trimmedWebhookUrl.length > 0 ? trimmedWebhookUrl : null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Workspace configuration</p>
      </div>

      <Card className="glass border-border">
        <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="name" className="text-xs font-medium text-muted-foreground mb-1.5 block">Workspace Name</label>
            <Input id="name" {...register("name")} aria-invalid={!!errors.name} className="h-9 text-sm max-w-md" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="description" className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea id="description" {...register("description")} className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardHeader><CardTitle className="text-base">Limits & Defaults</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between max-w-md">
            <div>
              <p className="text-sm font-medium">Max File Size</p>
              <p className="text-xs text-muted-foreground">Maximum upload file size (MB)</p>
            </div>
            <div>
              <Input {...register("maxFileSizeMb")} aria-invalid={!!errors.maxFileSizeMb} className="h-9 text-sm w-20 text-right" />
              {errors.maxFileSizeMb && <p className="text-xs text-destructive mt-1">{errors.maxFileSizeMb.message}</p>}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between max-w-md">
            <div>
              <p className="text-sm font-medium">Auto-approve high confidence</p>
              <p className="text-xs text-muted-foreground">Automatically approve MCQs above the workspace threshold</p>
            </div>
            <Controller name="autoApproveEnabled" control={control} render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )} />
          </div>
          <Separator />
          <div className="flex items-center justify-between max-w-md">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">Receive email for job completions and failures</p>
            </div>
            <Controller name="emailNotifications" control={control} render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" /> API & Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">API Key</label>
            <div className="flex items-center gap-2 max-w-md">
              <Input
                value={showApiKey ? (workspace?.apiKey || "No API key generated") : (workspace?.apiKey ? "••••••••••••••••••••••••" : "No API key generated")}
                readOnly
                className="h-9 text-sm font-mono flex-1"
              />
              <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowApiKey(!showApiKey)} disabled={!workspace?.apiKey}>
                {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => { if (workspace?.apiKey) { navigator.clipboard.writeText(workspace.apiKey); toast.success("API key copied"); } }}
                disabled={!workspace?.apiKey}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Separator />
          <div>
            <label htmlFor="webhookUrl" className="text-xs font-medium text-muted-foreground mb-1.5 block">Webhook URL</label>
            <div className="flex items-center gap-2 max-w-md">
              <Input
                id="webhookUrl"
                {...register("webhookUrl")}
                aria-invalid={!!errors.webhookUrl}
                placeholder="https://your-server.com/webhook"
                className="h-9 text-sm flex-1"
              />
              <div className="text-xs text-muted-foreground whitespace-nowrap">Saved on update</div>
            </div>
            {errors.webhookUrl && <p className="text-xs text-destructive mt-1">{errors.webhookUrl.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Billing & Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between max-w-md">
            <div>
              <p className="text-sm font-medium">Current Plan</p>
              <p className="text-xs text-muted-foreground">Usage is tracked against your active workspace plan</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/30">{workspace?.plan ?? "free"}</Badge>
          </div>
          <Separator />
          <div className="max-w-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Documents this month</p>
              <span className="text-xs font-mono text-muted-foreground">{usage ? `${usage.documentsUsed.toLocaleString()} / ${usage.documentsLimit === -1 ? "∞" : usage.documentsLimit.toLocaleString()}` : "—"}</span>
            </div>
            <Progress value={usage && usage.documentsLimit > 0 ? Math.round((usage.documentsUsed / usage.documentsLimit) * 100) : 0} className="h-2" />
          </div>
          <div className="max-w-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">API calls this month</p>
              <span className="text-xs font-mono text-muted-foreground">{usage ? `${usage.apiCallsUsed.toLocaleString()} / ${usage.apiCallsLimit === -1 ? "∞" : usage.apiCallsLimit.toLocaleString()}` : "—"}</span>
            </div>
            <Progress value={usage && usage.apiCallsLimit > 0 ? Math.round((usage.apiCallsUsed / usage.apiCallsLimit) * 100) : 0} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-warning/30 glass">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Self-serve workspace deletion is not available in the UI yet. Use an operator runbook or admin support path for destructive changes.</p>
          <Button type="button" variant="destructive" size="sm" className="mt-3" disabled>
            Delete Workspace
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="gap-2" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
