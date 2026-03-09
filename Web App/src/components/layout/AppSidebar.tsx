import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Upload,
  Cog,
  Activity,
  ListChecks,
  BookOpen,
  BarChart3,
  Download,
  Server,
  Users,
  Settings,
  ScrollText,
  Sparkles,
  ChevronUp,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { mockUser, mockWorkspace } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navGroups = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Documents",
    items: [
      { title: "Projects", url: "/projects", icon: FolderKanban },
      { title: "Documents", url: "/documents", icon: FileText },
      { title: "Upload", url: "/upload", icon: Upload },
    ],
  },
  {
    label: "Processing",
    items: [
      { title: "Jobs", url: "/jobs", icon: Activity },
      { title: "Review Queue", url: "/review", icon: ListChecks },
      { title: "MCQ Records", url: "/mcq-records", icon: BookOpen },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      { title: "Export", url: "/export", icon: Download },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Providers", url: "/providers", icon: Server },
      { title: "Users", url: "/users", icon: Users },
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Audit Logs", url: "/audit-logs", icon: ScrollText },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{mockWorkspace.name}</span>
              <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 h-4 mt-0.5">
                {mockWorkspace.plan}
              </Badge>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="scrollbar-thin">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/80">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title} className="relative">
                    {isActive(item.url) && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-md bg-sidebar-accent"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="gap-3 relative z-10"
                        activeClassName="text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarSeparator className="mb-2" />
        <div className="flex items-center justify-between">
          {!collapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-sidebar-accent transition-colors w-full text-left">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[11px] bg-primary text-primary-foreground font-semibold">
                      {mockUser.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-medium truncate">{mockUser.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{mockUser.email}</span>
                  </div>
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
