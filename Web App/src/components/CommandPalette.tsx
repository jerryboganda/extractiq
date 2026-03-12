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

  const matchedDocuments = results.filter((r: any) => r.type === 'document').slice(0, 3);
  const matchedJobs = results.filter((r: any) => r.type === 'job').slice(0, 3);
  const matchedProjects = results.filter((r: any) => r.type === 'project').slice(0, 3);
  const matchedMcqs = results.filter((r: any) => r.type === 'mcq').slice(0, 3);
  const matchedReview = results.filter((r: any) => r.type === 'review').slice(0, 3);
  const matchedUsers = results.filter((r: any) => r.type === 'user').slice(0, 3);

  const hasEntityResults = results.length > 0;

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
                {matchedDocuments.map((doc: any) => (
                  <CommandItem key={doc.id} onSelect={() => handleSelect("/documents")}>
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{doc.name || doc.filename}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{doc.status}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchedProjects.length > 0 && (
              <CommandGroup heading="Projects">
                {matchedProjects.map((p: any) => (
                  <CommandItem key={p.id} onSelect={() => handleSelect("/projects")}>
                    <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{p.status}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchedJobs.length > 0 && (
              <CommandGroup heading="Jobs">
                {matchedJobs.map((j: any) => (
                  <CommandItem key={j.id} onSelect={() => handleSelect("/jobs")}>
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{j.name || j.documentName}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{j.status}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchedMcqs.length > 0 && (
              <CommandGroup heading="MCQs">
                {matchedMcqs.map((m: any) => (
                  <CommandItem key={m.id} onSelect={() => handleSelect("/mcq-records")}>
                    <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate text-xs">{m.name || m.question}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{m.confidence}%</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchedReview.length > 0 && (
              <CommandGroup heading="Review Queue">
                {matchedReview.map((r: any) => (
                  <CommandItem key={r.id} onSelect={() => handleSelect(`/review/${r.id}`)}>
                    <ClipboardCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate text-xs">{r.name || r.question}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{r.status}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchedUsers.length > 0 && (
              <CommandGroup heading="Users">
                {matchedUsers.map((u: any) => (
                  <CommandItem key={u.id} onSelect={() => handleSelect("/users")}>
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{u.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{u.role}</span>
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
