import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Save, AlertTriangle, Key, Webhook, CreditCard, Link2, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const integrations = [
  { name: "Slack", connected: true },
  { name: "Microsoft Teams", connected: false },
  { name: "Zapier", connected: false },
  { name: "Google Drive", connected: true },
];

export default function SettingsPage() {
  const [name, setName] = useState("Medical Sciences");
  const [desc, setDesc] = useState("Medical board exam preparation and MCQ extraction workspace");
  const [maxFileSize, setMaxFileSize] = useState("50");
  const [autoApprove, setAutoApprove] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const apiKey = "sk_live_mcq_7f3a9b2c4d5e6f1a8b9c0d";

  const handleSave = () => toast.success("Settings saved successfully");
  const handleDelete = () => toast.error("Workspace deleted (demo only)");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Workspace configuration</p>
      </div>

      <Card className="glass border-border">
        <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Workspace Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm max-w-md" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" />
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
            <Input value={maxFileSize} onChange={(e) => setMaxFileSize(e.target.value)} className="h-9 text-sm w-20 text-right" />
          </div>
          <Separator />
          <div className="flex items-center justify-between max-w-md">
            <div>
              <p className="text-sm font-medium">Auto-approve high confidence</p>
              <p className="text-xs text-muted-foreground">Automatically approve MCQs above 95% confidence</p>
            </div>
            <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
          </div>
          <Separator />
          <div className="flex items-center justify-between max-w-md">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">Receive email for job completions and failures</p>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
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
                value={showApiKey ? apiKey : "sk_live_mcq_••••••••••••"}
                readOnly
                className="h-9 text-sm font-mono flex-1"
              />
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => { navigator.clipboard.writeText(apiKey); toast.success("API key copied"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Separator />
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Webhook URL</label>
            <div className="flex items-center gap-2 max-w-md">
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                className="h-9 text-sm flex-1"
              />
              <Button variant="outline" size="sm" className="h-9 gap-1.5 shrink-0" onClick={() => toast.success("Webhook test sent (demo)")}>
                <Webhook className="h-3.5 w-3.5" /> Test
              </Button>
            </div>
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
            <Badge className="bg-primary/10 text-primary border-primary/30">Enterprise</Badge>
          </div>
          <Separator />
          <div className="max-w-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Documents this month</p>
              <span className="text-xs font-mono text-muted-foreground">2,847 / 5,000</span>
            </div>
            <Progress value={57} className="h-2" />
          </div>
          <div className="max-w-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">API calls this month</p>
              <span className="text-xs font-mono text-muted-foreground">12,480 / 50,000</span>
            </div>
            <Progress value={25} className="h-2" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Manage plan opened (demo)")}>
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
        <Button className="gap-2" onClick={handleSave}><Save className="h-3.5 w-3.5" /> Save Changes</Button>
      </div>
    </div>
  );
}
