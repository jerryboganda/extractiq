import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useProjects, useExports, useCreateExport, useDownloadExport } from "@/hooks/use-api";
import type { ExportJobItem, ProjectListItem } from "@/lib/api-types";

const formats = [
  { value: "json", label: "JSON", icon: FileJson, description: "Full metadata export" },
  { value: "csv", label: "CSV", icon: FileSpreadsheet, description: "Spreadsheet-friendly export" },
  { value: "qti_2_1", label: "QTI", icon: FileText, description: "Assessment package" },
] as const;

export default function ExportCenter() {
  const [selectedFormat, setSelectedFormat] = useState<string>("json");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minConfidence, setMinConfidence] = useState("75");

  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: exportsData } = useExports({ page: 1, limit: 50 });
  const createExport = useCreateExport();
  const downloadExport = useDownloadExport();

  const projects = projectsData?.items ?? [];
  const exportHistory = exportsData?.items ?? [];

  const selectedFormatMeta = useMemo(
    () => formats.find((format) => format.value === selectedFormat),
    [selectedFormat],
  );

  const handleCreateExport = async () => {
    if (!selectedProjectId) return;

    await createExport.mutateAsync({
      format: selectedFormat,
      projectId: selectedProjectId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minConfidence: Number(minConfidence),
      status: "approved",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate exports from approved MCQs and download completed artifacts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {formats.map((format) => (
          <Card
            key={format.value}
            className={`cursor-pointer transition-colors ${selectedFormat === format.value ? "border-primary ring-1 ring-primary/30" : "border-border"}`}
            onClick={() => setSelectedFormat(format.value)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <format.icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{format.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{format.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass border-border">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</label>
              <select
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select a project</option>
                {projects.map((project: ProjectListItem) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Minimum Confidence</label>
              <Input value={minConfidence} onChange={(event) => setMinConfidence(event.target.value)} type="number" min="0" max="100" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date From</label>
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date To</label>
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <div className="text-sm text-muted-foreground">
              {selectedFormatMeta ? `Preparing ${selectedFormatMeta.label} export for approved records.` : "Choose a format to continue."}
            </div>
            <Button onClick={handleCreateExport} disabled={!selectedProjectId || createExport.isPending} className="gap-2">
              {createExport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Generate Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">Export History</h3>
          {exportHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exports have been created yet.</p>
          ) : (
            <div className="space-y-3">
              {exportHistory.map((exportJob: ExportJobItem) => (
                <div key={exportJob.id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{exportJob.format}</span>
                      <Badge variant="secondary">{exportJob.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {exportJob.totalRecords ?? 0} records • {exportJob.createdAt ? new Date(exportJob.createdAt).toLocaleString() : "Pending"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={exportJob.status !== "completed" || downloadExport.isPending}
                    onClick={() => downloadExport.mutate(exportJob.id)}
                  >
                    {downloadExport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
