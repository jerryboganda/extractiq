import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useProjects, usePresignUpload, useCompleteUpload, useCreateJob } from "@/hooks/use-api";
import type { ProjectListItem } from "@/lib/api-types";

type UploadState = "queued" | "uploading" | "uploaded" | "failed";

interface QueuedFile {
  id: string;
  file: File;
  status: UploadState;
  progress: number;
  documentId?: string;
  error?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadCenter() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: projectsData } = useProjects({ limit: 100 });
  const presignUpload = usePresignUpload();
  const completeUpload = useCompleteUpload();
  const createJob = useCreateJob();

  const projects = projectsData?.items ?? [];
  const uploadedDocumentIds = useMemo(
    () => queuedFiles.filter((file) => file.status === "uploaded" && file.documentId).map((file) => file.documentId as string),
    [queuedFiles],
  );

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;

    setQueuedFiles((previous) => [
      ...previous,
      ...Array.from(files).map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        status: "queued" as const,
        progress: 0,
      })),
    ]);
  };

  const updateQueuedFile = (id: string, patch: Partial<QueuedFile>) => {
    setQueuedFiles((previous) => previous.map((file) => file.id === id ? { ...file, ...patch } : file));
  };

  const handleUpload = async () => {
    if (!selectedProjectId) {
      toast.error("Select a project before uploading.");
      return;
    }

    if (queuedFiles.length === 0) {
      toast.error("Add at least one document to continue.");
      return;
    }

    setIsSubmitting(true);

    for (const queuedFile of queuedFiles) {
      if (queuedFile.status === "uploaded") continue;

      try {
        updateQueuedFile(queuedFile.id, { status: "uploading", progress: 10, error: undefined });

        const presigned = await presignUpload.mutateAsync({
          filename: queuedFile.file.name,
          contentType: queuedFile.file.type || "application/pdf",
          fileSize: queuedFile.file.size,
          projectId: selectedProjectId,
        });

        updateQueuedFile(queuedFile.id, { progress: 40 });

        const uploadResponse = await fetch(presigned.data.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": queuedFile.file.type || "application/pdf",
          },
          body: queuedFile.file,
        });

        if (!uploadResponse.ok) {
          throw new Error("File upload failed");
        }

        updateQueuedFile(queuedFile.id, { progress: 85 });

        await completeUpload.mutateAsync({
          uploadId: presigned.data.documentId,
          s3Key: presigned.data.s3Key,
        });

        updateQueuedFile(queuedFile.id, {
          progress: 100,
          status: "uploaded",
          documentId: presigned.data.documentId,
        });
      } catch (error) {
        updateQueuedFile(queuedFile.id, {
          status: "failed",
          progress: 0,
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    setIsSubmitting(false);
  };

  const handleStartExtraction = async () => {
    if (!selectedProjectId) {
      toast.error("Select a project before starting extraction.");
      return;
    }

    if (uploadedDocumentIds.length === 0) {
      toast.error("Upload at least one document successfully first.");
      return;
    }

    await createJob.mutateAsync({
      projectId: selectedProjectId,
      documentIds: uploadedDocumentIds,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload real documents and push them into the extraction pipeline.</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.tiff"
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <Card className="border-2 border-dashed border-border hover:border-primary/40 transition-colors">
        <CardContent className="py-16 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Choose documents to upload</h2>
            <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, PNG, JPG, TIFF, or WEBP up to 50 MB each.</p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />
            Browse Files
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardContent className="p-5 space-y-4">
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

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleUpload} disabled={isSubmitting || queuedFiles.length === 0} className="gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Files
            </Button>
            <Button variant="outline" onClick={handleStartExtraction} disabled={createJob.isPending || uploadedDocumentIds.length === 0} className="gap-2">
              {createJob.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Start Extraction
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">Upload Queue</h3>
          {queuedFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files selected yet.</p>
          ) : (
            <div className="space-y-3">
              {queuedFiles.map((queuedFile) => (
                <div key={queuedFile.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{queuedFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(queuedFile.file.size)}</p>
                    </div>
                    <div className="shrink-0">
                      {queuedFile.status === "uploaded" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : queuedFile.status === "failed" ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : queuedFile.status === "uploading" ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : null}
                    </div>
                  </div>
                  <Progress value={queuedFile.progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{queuedFile.status}</span>
                    <span>{queuedFile.progress}%</span>
                  </div>
                  {queuedFile.error ? <p className="text-xs text-destructive">{queuedFile.error}</p> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
