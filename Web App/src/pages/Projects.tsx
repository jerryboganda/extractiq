import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { FolderKanban, Plus, Search, MoreVertical, Users } from "lucide-react";
import { useProjects, useCreateProject } from "@/hooks/use-api";
import { toast } from "sonner";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ProjectListItem } from "@/lib/api-types";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional().or(z.literal("")),
});
type CreateProjectValues = z.infer<typeof createProjectSchema>;

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  paused: "bg-warning/10 text-warning border-warning/20",
  archived: "bg-muted text-muted-foreground",
};

export default function Projects() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" },
  });

  const { data: projectsData } = useProjects({ search: search || undefined });
  const createProject = useCreateProject();
  const projects = projectsData?.items ?? [];

  const filtered = projects.filter((p: ProjectListItem) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onCreateSubmit = (data: CreateProjectValues) => {
    createProject.mutate({ name: data.name, description: data.description || undefined });
    reset();
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your extraction projects</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> New Project</Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Projects group document uploads, extraction jobs, review items, and exports.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4 py-2">
              <div>
                <label htmlFor="project-name" className="text-xs font-medium text-muted-foreground mb-1.5 block">Project Name</label>
                <Input id="project-name" {...register("name")} placeholder="e.g. Medical Board Prep" className="h-9 text-sm" aria-invalid={!!errors.name} aria-describedby={errors.name ? "project-name-error" : undefined} />
                {errors.name && <p id="project-name-error" className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="project-desc" className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                <textarea id="project-desc" {...register("description")} placeholder="Brief description..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" aria-invalid={!!errors.description} aria-describedby={errors.description ? "project-desc-error" : undefined} />
                {errors.description && <p id="project-desc-error" className="text-xs text-destructive mt-1">{errors.description.message}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" size="sm" type="button">Cancel</Button></DialogClose>
                <Button size="sm" type="submit">Create Project</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="h-9 flex-wrap">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
            <TabsTrigger value="paused" className="text-xs">Paused</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((project) => (
          <StaggerItem key={project.id}>
            <motion.div
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="glass border-border cursor-pointer group">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0"><FolderKanban className="h-4 w-4 text-primary" /></div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{project.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{project.lastActivity}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><MoreVertical className="h-3.5 w-3.5" /></Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{project.documentsCount} docs</span>
                      <span className="text-muted-foreground">{project.mcqCount.toLocaleString()} MCQs</span>
                    </div>
                    <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[project.status]}`}>{project.status}</Badge>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{project.members} members</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground text-sm">No projects match your filters.</div>
        )}

        <StaggerItem>
          <Card className="border-dashed border-2 border-border hover:border-primary/30 hover:bg-muted/20 transition-all cursor-pointer flex items-center justify-center min-h-[220px]" onClick={() => setDialogOpen(true)}>
            <div className="text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2"><Plus className="h-5 w-5 text-muted-foreground" /></div>
              <p className="text-sm font-medium text-muted-foreground">Create Project</p>
            </div>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
