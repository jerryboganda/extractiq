import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileUp, X, FileText, Image, FileSpreadsheet, Check, Loader2, Clock, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

interface QueueFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: "complete" | "uploading" | "queued";
  type: "pdf" | "docx" | "image";
}

let fileIdCounter = 100;

function detectFileType(name: string): "pdf" | "docx" | "image" {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "docx";
  return "image";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const initialQueue: QueueFile[] = [
  { id: "f1", name: "Cardiology_Final_2025.pdf", size: "8.2 MB", progress: 100, status: "complete", type: "pdf" },
  { id: "f2", name: "Dermatology_MCQs.pdf", size: "3.1 MB", progress: 42, status: "uploading", type: "pdf" },
  { id: "f3", name: "Radiology_Images.png", size: "2.4 MB", progress: 0, status: "queued", type: "image" },
  { id: "f4", name: "Endocrinology_Ch4.docx", size: "5.7 MB", progress: 0, status: "queued", type: "docx" },
];

const fileIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: FileSpreadsheet,
  image: Image,
};

const statusIcons: Record<string, React.ElementType> = {
  complete: Check,
  uploading: Loader2,
  queued: Clock,
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

export default function UploadCenter() {
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<QueueFile[]>(initialQueue);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles: QueueFile[] = Array.from(files).map((f) => ({
      id: `f_${++fileIdCounter}`,
      name: f.name,
      size: formatSize(f.size),
      progress: 0,
      status: "queued" as const,
      type: detectFileType(f.name),
    }));
    setQueue((prev) => {
      const hasUploading = prev.some((f) => f.status === "uploading");
      if (!hasUploading && newFiles.length > 0) {
        newFiles[0].status = "uploading";
        newFiles[0].progress = 1;
      }
      return [...prev, ...newFiles];
    });
    toast({ title: `${files.length} file(s) added`, description: "Files added to upload queue." });
  };

  const removeFile = (id: string) => {
    setQueue((prev) => prev.filter((f) => f.id !== id));
  };

  const clearCompleted = () => {
    setQueue((prev) => prev.filter((f) => f.status !== "complete"));
    toast({ title: "Cleared", description: "Completed files removed from queue." });
  };

  // Animated progress simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue((prev) => {
        const next = [...prev];
        const uploading = next.find((f) => f.status === "uploading");
        if (uploading) {
          uploading.progress = Math.min(uploading.progress + Math.floor(Math.random() * 8 + 2), 100);
          if (uploading.progress >= 100) {
            uploading.status = "complete";
            const nextQueued = next.find((f) => f.status === "queued");
            if (nextQueued) {
              nextQueued.status = "uploading";
              nextQueued.progress = 1;
            }
          }
        }
        return next;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const completedCount = queue.filter((f) => f.status === "complete").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload documents for MCQ extraction</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />

      {/* Drop zone */}
      <Card
        className={`border-2 border-dashed transition-all duration-300 cursor-pointer ${
          dragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/30 hover:bg-muted/20"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className={`p-4 rounded-2xl bg-primary/10 mb-4 transition-transform ${dragActive ? "scale-110" : ""}`}>
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Drop files here or click to browse</h3>
          <p className="text-sm text-muted-foreground mb-4">PDF, DOCX, images — up to 50MB per file</p>
          <Button variant="outline" className="gap-2" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            <FileUp className="h-4 w-4" /> Browse Files
          </Button>
        </CardContent>
      </Card>

      {/* File queue */}
      <Card className="glass border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Upload Queue</h3>
            {completedCount > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={clearCompleted}>
                <Trash2 className="h-3 w-3" /> Clear Completed ({completedCount})
              </Button>
            )}
          </div>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {queue.map((file) => {
                const FileIcon = fileIcons[file.type] || FileText;
                const StatusIcon = statusIcons[file.status];
                return (
                  <motion.div
                    key={file.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{file.name}</span>
                        <span className="text-[11px] text-muted-foreground">{file.size}</span>
                      </div>
                      <Progress value={file.progress} className="h-1" />
                    </div>
                    <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${
                      file.status === "complete" ? "text-success" : file.status === "uploading" ? "text-primary animate-spin" : "text-muted-foreground"
                    }`} />
                    <span className="text-[11px] font-mono text-muted-foreground w-10 text-right">
                      {file.progress}%
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {queue.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">No files in queue. Drop or browse to add files.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload metadata */}
      <Card className="glass border-border">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">Upload Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project</label>
              <Input placeholder="Select project..." className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tags</label>
              <Input placeholder="Add tags..." className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
            <textarea
              placeholder="Optional notes about this upload batch..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
            />
          </div>
          <div className="flex justify-end">
            <Button className="gap-2">
              <Upload className="h-3.5 w-3.5" /> Start Extraction
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
