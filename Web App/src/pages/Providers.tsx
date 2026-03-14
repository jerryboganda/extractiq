import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Zap, Server, Loader2, Trash2, Plus, Pencil } from "lucide-react";
import { useProviders, useTestProvider, useDeleteProvider, useCreateProvider, useUpdateProvider } from "@/hooks/use-api";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import type { ProviderItem } from "@/lib/api-types";
import { EmptyState } from "@/components/EmptyState";

const statusDotColors: Record<string, string> = {
  healthy: "bg-success",
  degraded: "bg-warning",
  offline: "bg-destructive",
};

const categories = ["ocr", "llm", "vlm", "embedding", "parser"] as const;
const providerTypes = ["openai", "anthropic", "google", "mistral", "qwen_vl", "glm_ocr", "deepseek", "tesseract"] as const;

type ProviderFormState = {
  displayName: string;
  category: string;
  providerType: string;
  apiKey: string;
  models: string;
  isEnabled: boolean;
};

const defaultFormState: ProviderFormState = {
  displayName: "",
  category: "llm",
  providerType: "openai",
  apiKey: "",
  models: "",
  isEnabled: true,
};

export default function Providers() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderItem | null>(null);
  const [form, setForm] = useState<ProviderFormState>(defaultFormState);

  const { data: providersData } = useProviders();
  const testProvider = useTestProvider();
  const deleteProvider = useDeleteProvider();
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const allProviders = providersData ?? [];

  const filtered = allProviders.filter((provider: ProviderItem) => statusFilter === "all" || provider.status === statusFilter);

  const dialogTitle = dialogMode === "create" ? "Add Provider" : "Edit Provider";
  const dialogDescription = dialogMode === "create"
    ? "Configure a new provider for extraction, OCR, or validation workflows."
    : "Update provider display settings, model configuration, or enablement.";

  const availableModels = useMemo(() => form.models.split(",").map((value) => value.trim()).filter(Boolean), [form.models]);

  const handleTest = (provider: ProviderItem) => {
    setTestingId(provider.id);
    testProvider.mutate(provider.id, {
      onSettled: () => setTestingId(null),
    });
  };

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingProvider(null);
    setForm(defaultFormState);
    setDialogOpen(true);
  };

  const openEditDialog = (provider: ProviderItem) => {
    setDialogMode("edit");
    setEditingProvider(provider);
    setForm({
      displayName: provider.name,
      category: provider.category ?? "llm",
      providerType: provider.provider,
      apiKey: "",
      models: provider.model !== "n/a" ? provider.model : "",
      isEnabled: provider.isEnabled ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const models = availableModels;
    if (!form.displayName.trim() || models.length === 0 || (dialogMode === "create" && !form.apiKey.trim())) {
      return;
    }

    if (dialogMode === "create") {
      await createProvider.mutateAsync({
        displayName: form.displayName.trim(),
        category: form.category,
        providerType: form.providerType,
        apiKey: form.apiKey.trim(),
        models,
        config: {},
      });
    } else if (editingProvider) {
      await updateProvider.mutateAsync({
        id: editingProvider.id,
        displayName: form.displayName.trim(),
        models,
        isEnabled: form.isEnabled,
        ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
      });
    }

    setDialogOpen(false);
  };

  const savePending = createProvider.isPending || updateProvider.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage AI extraction providers</p>
        </div>
        <Button size="sm" className="gap-2" onClick={openCreateDialog}>
          <Plus className="h-3.5 w-3.5" /> Add Provider
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="h-9">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="healthy" className="text-xs">Healthy</TabsTrigger>
          <TabsTrigger value="degraded" className="text-xs">Degraded</TabsTrigger>
          <TabsTrigger value="offline" className="text-xs">Offline</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No providers configured"
          description="Create your first provider to enable OCR, VLM, or LLM processing workflows."
          actionLabel="Add Provider"
          onAction={openCreateDialog}
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((provider) => (
            <StaggerItem key={provider.id}>
              <motion.div
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="glass border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10"><Server className="h-5 w-5 text-primary" /></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold">{provider.name}</h3>
                            <span className={`h-2 w-2 rounded-full ${statusDotColors[provider.status]}`} />
                          </div>
                          <p className="text-[11px] text-muted-foreground">{provider.provider} · {provider.model}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Settings className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(provider)}>
                            <Pencil className="h-3.5 w-3.5" /> Edit Provider
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleTest(provider)}>
                            <Zap className="h-3.5 w-3.5" /> Test Connectivity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => deleteProvider.mutate(provider.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Accuracy</p>
                        <p className="text-sm font-bold mt-0.5">{provider.accuracy}%</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Latency</p>
                        <p className="text-sm font-bold mt-0.5">{provider.avgLatency}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cost/Record</p>
                        <p className="text-sm font-bold mt-0.5">${provider.costPerRecord}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Error Rate</p>
                        <p className="text-sm font-bold mt-0.5">{provider.errorRate}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">Total cost: <span className="font-semibold text-foreground">${provider.totalCost.toLocaleString()}</span></span>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={testingId === provider.id} onClick={() => handleTest(provider)}>
                        {testingId === provider.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                        {testingId === provider.id ? "Testing..." : "Test"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="provider-display-name">Display name</Label>
              <Input id="provider-display-name" value={form.displayName} onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider-category">Category</Label>
                <select
                  id="provider-category"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  disabled={dialogMode === "edit"}
                >
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-type">Provider type</Label>
                <select
                  id="provider-type"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.providerType}
                  onChange={(event) => setForm((prev) => ({ ...prev, providerType: event.target.value }))}
                  disabled={dialogMode === "edit"}
                >
                  {providerTypes.map((providerType) => <option key={providerType} value={providerType}>{providerType}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-models">Models</Label>
              <Input id="provider-models" value={form.models} onChange={(event) => setForm((prev) => ({ ...prev, models: event.target.value }))} placeholder="Comma-separated model list" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-api-key">{dialogMode === "create" ? "API key" : "API key (leave blank to keep current)"}</Label>
              <Input id="provider-api-key" type="password" value={form.apiKey} onChange={(event) => setForm((prev) => ({ ...prev, apiKey: event.target.value }))} />
            </div>

            {dialogMode === "edit" ? (
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Provider enabled</p>
                  <p className="text-xs text-muted-foreground">Disable the provider without deleting configuration.</p>
                </div>
                <Switch checked={form.isEnabled} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isEnabled: checked }))} />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={savePending || !form.displayName.trim() || availableModels.length === 0 || (dialogMode === "create" && !form.apiKey.trim())}>
              {savePending ? <Loader2 className="h-4 w-4 animate-spin" /> : dialogMode === "create" ? "Create Provider" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
