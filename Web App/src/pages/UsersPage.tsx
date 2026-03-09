import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Search, UserPlus, MoreVertical, Shield, Eye, UserX } from "lucide-react";
import { toast } from "sonner";

const mockUsers = [
  { id: "u1", name: "Dr. Sarah Chen", email: "sarah.chen@university.edu", role: "Admin", status: "active", lastActive: "2 min ago", initials: "SC" },
  { id: "u2", name: "Prof. Amir Malik", email: "a.malik@university.edu", role: "Reviewer", status: "active", lastActive: "15 min ago", initials: "AM" },
  { id: "u3", name: "Dr. Ji-Yeon Kim", email: "jy.kim@university.edu", role: "Reviewer", status: "active", lastActive: "1 hr ago", initials: "JK" },
  { id: "u4", name: "Dr. Carlos Rivera", email: "c.rivera@university.edu", role: "Viewer", status: "inactive", lastActive: "5 days ago", initials: "CR" },
];

export const mockUsersExport = mockUsers;

const roleColors: Record<string, string> = {
  Admin: "bg-violet/10 text-violet border-violet/20",
  Reviewer: "bg-info/10 text-info border-info/20",
  Viewer: "bg-muted text-muted-foreground",
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, type: "spring" as const, stiffness: 300, damping: 24 },
  }),
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Reviewer");

  const filtered = mockUsers.filter((u) => {
    const matchesSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) { toast.error("Email is required"); return; }
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail(""); setInviteRole("Reviewer"); setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage workspace members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><UserPlus className="h-3.5 w-3.5" /> Invite User</Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Address</label>
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@university.edu" className="h-9 text-sm" type="email" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Reviewer">Reviewer</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
              <Button size="sm" onClick={handleInvite}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={roleFilter} onValueChange={setRoleFilter}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="Admin" className="text-xs">Admin</TabsTrigger>
            <TabsTrigger value="Reviewer" className="text-xs">Reviewer</TabsTrigger>
            <TabsTrigger value="Viewer" className="text-xs">Viewer</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="glass border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Last Active</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <motion.tr
                  key={user.id}
                  className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={rowVariants}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">{user.initials}</AvatarFallback></Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><Badge className={`text-[10px] px-1.5 py-0 ${roleColors[user.role]}`}>{user.role}</Badge></td>
                  <td className="p-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${user.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                      <span className="text-xs">{user.status}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">{user.lastActive}</td>
                  <td className="p-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="gap-2"><Shield className="h-3.5 w-3.5" /> Change Role</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {["Admin", "Reviewer", "Viewer"].map((r) => (
                              <DropdownMenuItem key={r} onClick={() => toast.success(`${user.name} role changed to ${r}`)}>{r}</DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem className="gap-2" onClick={() => toast.success(`${user.name} ${user.status === "active" ? "deactivated" : "activated"}`)}>
                          <Eye className="h-3.5 w-3.5" /> {user.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => toast.success(`${user.name} removed from workspace`)}>
                          <UserX className="h-3.5 w-3.5" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No users match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
