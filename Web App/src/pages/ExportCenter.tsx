import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Download, FileJson, FileSpreadsheet, FileText, Package, Layers, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { UpgradeBanner } from "@/components/UpgradeBanner";

const formats = [
  { name: "JSON", description: "Standard JSON format with full metadata", icon: FileJson, popular: true, sizePerRecord: 0.8 },
  { name: "CSV", description: "Spreadsheet-compatible flat format", icon: FileSpreadsheet, popular: true, sizePerRecord: 0.3 },
  { name: "QTI", description: "IMS Question & Test Interoperability", icon: FileText, popular: false, sizePerRecord: 1.2 },
  { name: "SCORM", description: "Sharable Content Object Reference Model", icon: Package, popular: false, sizePerRecord: 2.5 },
  { name: "xAPI", description: "Experience API (Tin Can) format", icon: Layers, popular: false, sizePerRecord: 1.0 },
];

interface ExportHistoryItem {
  id: string;
  format: string;
  records: number;
  date: string;
  status: "completed" | "processing";
  size: string;
}

const initialExports: ExportHistoryItem[] = [
  { id: "exp_01", format: "JSON", records: 245, date: "2025-03-08", status: "completed", size: "196 KB" },
  { id: "exp_02", format: "CSV", records: 132, date: "2025-03-07", status: "completed", size: "40 KB" },
  { id: "exp_03", format: "QTI", records: 410, date: "2025-03-06", status: "completed", size: "492 KB" },
];

export default function ExportCenter() {
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState([75]);
  const [dateFrom, setDateFrom] = useState("2025-03-01");
  const [dateTo, setDateTo] = useState("2025-03-08");
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>(initialExports);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const estimatedRecords = Math.round(48291 * ((100 - confidenceThreshold[0]) / 100) * 0.8);
  const selectedFmt = formats.find((f) => f.name === selectedFormat);
  const estimatedSize = selectedFmt ? `${((estimatedRecords * selectedFmt.sizePerRecord) / 1024).toFixed(1)} MB` : null;

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleExport = () => {
    if (!selectedFormat) {
      toast.error("Please choose an export format first.");
      return;
    }
    if (exportProgress !== null) return;

    setExportProgress(0);
    const newId = `exp_${Date.now()}`;

    intervalRef.current = setInterval(() => {
      setExportProgress((prev) => {
        if (prev === null) return null;
        const next = prev + Math.random() * 15 + 5;
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setTimeout(() => {
            setExportProgress(null);
            const newExport: ExportHistoryItem = {
              id: newId,
              format: selectedFormat!,
              records: estimatedRecords,
              date: new Date().toISOString().split("T")[0],
              status: "completed",
              size: estimatedSize || "—",
            };
            setExportHistory((prev) => [newExport, ...prev]);
            toast.success(`${selectedFormat} export completed — ${estimatedRecords.toLocaleString()} records`);
          }, 300);
          return 100;
        }
        return next;
      });
    }, 400);
  };

  const deleteHistoryItem = (id: string) => {
    setExportHistory((prev) => prev.filter((e) => e.id !== id));
    toast.success("Export removed from history");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Export MCQ records in various formats</p>
      </div>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {formats.map((fmt) => (
          <StaggerItem key={fmt.name}>
            <motion.div
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
              whileTap={{ scale: 0.97 }}
            >
              <Card
                className={`glass border-border cursor-pointer group transition-all ${
                  selectedFormat === fmt.name ? "ring-2 ring-primary border-primary/50" : ""
                }`}
                onClick={() => setSelectedFormat(fmt.name)}
              >
                <CardContent className="p-4 text-center relative">
                  {selectedFormat === fmt.name && (
                    <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                  )}
                  <div className={`p-3 rounded-xl w-fit mx-auto mb-3 transition-colors ${
                    selectedFormat === fmt.name ? "bg-primary/20" : "bg-primary/10 group-hover:bg-primary/20"
                  }`}>
                    <fmt.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">{fmt.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1">{fmt.description}</p>
                  {fmt.popular && <Badge variant="secondary" className="text-[9px] mt-2">Popular</Badge>}
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Configuration Panel */}
      <Card className="glass border-border">
        <CardContent className="p-4 sm:p-5 space-y-5">
          <h3 className="text-sm font-semibold">Export Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project</label>
              <Input placeholder="All projects" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Minimum Confidence</label>
              <span className="text-xs font-mono text-primary">{confidenceThreshold[0]}%</span>
            </div>
            <Slider value={confidenceThreshold} onValueChange={setConfidenceThreshold} max={100} min={0} step={5} className="w-full" />
          </div>

          {exportProgress !== null && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Generating export...
                </span>
                <span className="font-mono">{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-border gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Estimated: </span>
              <span className="font-semibold font-mono">{estimatedRecords.toLocaleString()} records</span>
              {selectedFormat && <Badge variant="secondary" className="ml-2 text-[10px]">{selectedFormat}</Badge>}
              {estimatedSize && <span className="text-xs text-muted-foreground ml-2">≈ {estimatedSize}</span>}
            </div>
            <Button className="gap-2 w-full sm:w-auto" onClick={handleExport} disabled={exportProgress !== null}>
              {exportProgress !== null ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Generate Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardContent className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-4">Export History</h3>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {exportHistory.map((exp) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  layout
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                      <Badge variant="secondary" className="text-[10px] shrink-0">{exp.format}</Badge>
                      <span className="text-sm">{exp.records} records</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{exp.date}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">({exp.size})</span>
                      <Badge className={`text-[9px] px-1.5 py-0 ${exp.status === "completed" ? "bg-success/10 text-success border-success/20" : "bg-info/10 text-info border-info/20"}`}>
                        {exp.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={() => toast.success(`Downloading ${exp.format} export`)}>
                        <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Download</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteHistoryItem(exp.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {exportHistory.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">No exports yet. Generate your first export above.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {exportHistory.length >= 3 && (
        <UpgradeBanner
          title="Export Limit Approaching"
          description="Free plan: 5 exports/month. Upgrade for unlimited exports and additional formats."
        />
      )}
    </div>
  );
}
