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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Save, AlertTriangle, Key, Webhook, CreditCard, Link2, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace, useUpdateWorkspace, useWorkspaceUsage } from "@/hooks/use-api";

const settingsSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional().or(z.literal("")),
  maxFileSizeMb: z.coerce.number().int().min(1, "Minimum 1 MB").max(500, "Maximum 500 MB"),
  autoApproveThreshold: z.boolean(),
  emailNotifications: z.boolean(),
  webhookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const integrations = [
  { name: "Slack", connected: true },
  { name: "Microsoft Teams", connected: false },
  { name: "Zapier", connected: false },
  { name: "Google Drive", connected: true },
];

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
      autoApproveThreshold: false,
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
        autoApproveThreshold: !!workspace.autoApproveThreshold,
        emailNotifications: settings.emailNotifications !== false,
        webhookUrl: (settings.webhookUrl as string) ?? "",
      });
    }
  }, [workspace, reset]);

  const onSubmit = (data: SettingsFormValues) => {
    updateWorkspace.mutate({
      name: data.name,
      maxFileSizeMb: data.maxFileSizeMb,
      autoApproveThreshold: data.autoApproveThreshold,
      emailNotifications: data.emailNotifications,
      webhookUrl: data.webhookUrl || undefined,
    });
  };

  const handleDelete = () => toast.error("Contact support to delete a workspace");

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
              <p className="text-xs text-muted-foreground">Automatically approve MCQs above 95% confidence</p>
            </div>
            <Controller name="autoApproveThreshold" control={control} render={({ field }) => (
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

      {/* API & Webhooks */}
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
                value={showApiKey ? (workspace?.apiKey ?? "No API key") : "sk_live_mcq_••••••••••••"}
                readOnly
                className="h-9 text-sm font-mono flex-1"
              />
              <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => { navigator.clipboard.writeText(workspace?.apiKey ?? ""); toast.success("API key copied"); }}>
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
              <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 shrink-0" onClick={() => toast.success("Webhook test sent")}>
                <Webhook className="h-3.5 w-3.5" /> Test
              </Button>
            </div>
            {errors.webhookUrl && <p className="text-xs text-destructive mt-1">{errors.webhookUrl.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Billing & Usage */}
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
              <p className="text-xs text-muted-foreground">Billed annually</p>
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
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Manage plan opened")}>
            <CreditCard className="h-3.5 w-3.5" /> Manage Plan
          </Button>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {integrations.map((intg) => (
              <div key={intg.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Link2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{intg.name}</span>
                </div>
                <Switch
                  checked={intg.connected}
                  onCheckedChange={(checked) =>
                    toast.success(`${intg.name} ${checked ? "connected" : "disconnected"} (demo)`)
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 glass">
        <CardHeader><CardTitle className="text-base text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Permanently delete this workspace and all associated data.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">Delete Workspace</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete the workspace and all associated documents, MCQs, and configurations.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
