import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Upload,
  Briefcase,
  ClipboardCheck,
  BookOpen,
  BarChart3,
  Download,
  Server,
  Users,
  Settings,
  Shield,
  Plus,
  FileUp,
  Keyboard,
} from "lucide-react";
import { useSearch } from "@/hooks/use-api";
import type { SearchResultItem } from "@/lib/api-types";

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Documents", icon: FileText, path: "/documents" },
  { label: "Upload Center", icon: Upload, path: "/upload" },
  { label: "Jobs", icon: Briefcase, path: "/jobs" },
  { label: "Review Queue", icon: ClipboardCheck, path: "/review" },
  { label: "MCQ Records", icon: BookOpen, path: "/mcq-records" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Export Center", icon: Download, path: "/export" },
  { label: "Providers", icon: Server, path: "/providers" },
  { label: "Users", icon: Users, path: "/users" },
  { label: "Settings", icon: Settings, path: "/settings" },
  { label: "Audit Logs", icon: Shield, path: "/audit-logs" },
];

const quickActions = [
  { label: "Upload Document", icon: FileUp, path: "/upload" },
  { label: "New Project", icon: Plus, path: "/projects" },
  { label: "Generate Export", icon: Download, path: "/export" },
];

interface CommandPaletteProps {
  onOpenShortcuts?: () => void;
}

export function CommandPalette({ onOpenShortcuts }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    setSearch("");
    navigate(path);
  };

  const query = search.toLowerCase().trim();

  const { data: searchResults } = useSearch(query);
  const results = searchResults ?? [];

  const matchedDocuments = results.filter((result) => result.type === "document").slice(0, 3);
  const matchedJobs = results.filter((result) => result.type === "job").slice(0, 3);
  const matchedProjects = results.filter((result) => result.type === "project").slice(0, 3);
  const matchedMcqs = results.filter((result) => result.type === "mcq").slice(0, 3);
  const matchedReview = results.filter((result) => result.type === "review").slice(0, 3);
  const matchedUsers = results.filter((result) => result.type === "user").slice(0, 3);

  const hasEntityResults = results.length > 0;

  const renderResultLabel = (item: SearchResultItem) => item.name;

  return (
    <CommandDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
      <CommandInput placeholder="Search pages, documents, MCQs, users..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions — always visible */}
        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => (
            <CommandItem key={item.label} onSelect={() => handleSelect(item.path)}>
              <item.icon className="mr-2 h-4 w-4 text-primary" />
              {item.label}
            </CommandItem>
          ))}
          <CommandItem onSelect={() => { setOpen(false); setSearch(""); onOpenShortcuts?.(); }}>
            <Keyboard className="mr-2 h-4 w-4 text-primary" />
            Keyboard Shortcuts
          </CommandItem>
        </CommandGroup>

        {/* Entity search results — only when searching */}
        {query && hasEntityResults && (
          <>
            <CommandSeparator />
            {matchedDocuments.length > 0 && (
              <CommandGroup heading="Documents">
                {matchedDocuments.map((doc) => (
                  <CommandItem key={doc.id} onSelect={() => handleSelect("/documents")}>
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{renderResultLabel(doc)}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{doc.status}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchedProjects.length > 0 && (
              <CommandGroup heading="Projects">
                {matchedProjects.map((project) => (
                  <CommandItem key={project.id} onSelect={() => handleSelect("/projects")}>
                    <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{renderResultLabel(project)}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{project.status}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchedJobs.length > 0 && (
              <CommandGroup heading="Jobs">
                {matchedJobs.map((job) => (
                  <CommandItem key={job.id} onSelect={() => handleSelect("/jobs")}>
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{renderResultLabel(job)}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{job.status}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchedMcqs.length > 0 && (
              <CommandGroup heading="MCQs">
                {matchedMcqs.map((mcq) => (
                  <CommandItem key={mcq.id} onSelect={() => handleSelect("/mcq-records")}>
                    <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate text-xs">{renderResultLabel(mcq)}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{mcq.status}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchedReview.length > 0 && (
              <CommandGroup heading="Review Queue">
                {matchedReview.map((review) => (
                  <CommandItem key={review.id} onSelect={() => handleSelect(`/review/${review.id}`)}>
                    <ClipboardCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate text-xs">{renderResultLabel(review)}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{review.status}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchedUsers.length > 0 && (
              <CommandGroup heading="Users">
                {matchedUsers.map((user) => (
                  <CommandItem key={user.id} onSelect={() => handleSelect("/users")}>
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{renderResultLabel(user)}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{user.status}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem key={item.path} onSelect={() => handleSelect(item.path)}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPaletteOpen() {
  return () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };
}
