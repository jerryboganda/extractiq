import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useCommandPaletteOpen } from "@/components/CommandPalette";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/documents": "Documents",
  "/upload": "Upload Center",
  "/jobs": "Jobs",
  "/review": "Review Queue",
  "/mcq-records": "MCQ Records",
  "/analytics": "Analytics",
  "/export": "Export Center",
  "/providers": "Providers",
  "/users": "Users",
  "/settings": "Settings",
  "/audit-logs": "Audit Logs",
};

export function AppHeader() {
  const location = useLocation();
  const currentLabel = routeLabels[location.pathname] || "Page";
  const openCommandPalette = useCommandPaletteOpen();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 sm:gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-3 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5 hidden sm:block" />

      <Breadcrumb className="flex-1 min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:inline-flex">
            <BreadcrumbLink href="/" className="text-xs text-muted-foreground">
              MCQ Platform
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:inline-flex" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-xs font-medium truncate">{currentLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile search icon */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8"
        onClick={openCommandPalette}
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* Desktop command palette trigger */}
      <Button
        variant="outline"
        className="hidden md:flex items-center gap-2 text-xs text-muted-foreground h-8 px-3 w-64 justify-start"
        onClick={openCommandPalette}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search everything...</span>
        <kbd className="ml-auto pointer-events-none flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      {/* Notification bell */}
      <NotificationDropdown />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[11px] bg-primary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Preferences</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
