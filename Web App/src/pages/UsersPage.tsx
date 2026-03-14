import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Search, UserPlus, MoreVertical, Shield, Eye, UserX } from "lucide-react";
import { toast } from "sonner";
import { useUsers, useInviteUser, useUpdateUser, useDeleteUser } from "@/hooks/use-api";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UserItem } from "@/lib/api-types";

const inviteFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  role: z.enum(["workspace_admin", "reviewer", "analyst", "operator"], { required_error: "Select a role" }),
});
type InviteFormValues = z.infer<typeof inviteFormSchema>;

const roleColors: Record<string, string> = {
  workspace_admin: "bg-violet/10 text-violet border-violet/20",
  reviewer: "bg-info/10 text-info border-info/20",
  analyst: "bg-muted text-muted-foreground",
  operator: "bg-primary/10 text-primary border-primary/20",
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, type: "spring" as const, stiffness: 300, damping: 24 },
  }),
};

const assignableRoles = [
  { value: "workspace_admin", label: "Admin" },
  { value: "reviewer", label: "Reviewer" },
  { value: "analyst", label: "Analyst" },
  { value: "operator", label: "Operator" },
] as const;

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { email: "", role: "reviewer" },
  });

  const { data: usersData } = useUsers();
  const inviteUser = useInviteUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const allUsers = usersData ?? [];

  const filtered = allUsers.filter((u: UserItem) => {
    const matchesSearch = !search || (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const onInviteSubmit = (data: InviteFormValues) => {
    inviteUser.mutate({ email: data.email, role: data.role });
    reset();
    setDialogOpen(false);
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
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>Send a workspace invitation with role-based access and a password setup link.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4 py-2" noValidate>
              <div>
                <label htmlFor="invite-email" className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Address</label>
                <Input id="invite-email" {...register("email")} placeholder="user@university.edu" className="h-9 text-sm" type="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "invite-email-error" : undefined} />
                {errors.email && <p id="invite-email-error" className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="invite-role" className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
                <Controller name="role" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 text-sm" aria-invalid={!!errors.role}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.role && <p className="text-xs text-destructive mt-1">{errors.role.message}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" size="sm" type="button">Cancel</Button></DialogClose>
                <Button size="sm" type="submit">Send Invitation</Button>
              </DialogFooter>
            </form>
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
            <TabsTrigger value="workspace_admin" className="text-xs">Admin</TabsTrigger>
            <TabsTrigger value="reviewer" className="text-xs">Reviewer</TabsTrigger>
            <TabsTrigger value="analyst" className="text-xs">Analyst</TabsTrigger>
            <TabsTrigger value="operator" className="text-xs">Operator</TabsTrigger>
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
                  <td className="p-3"><Badge className={`text-[10px] px-1.5 py-0 ${roleColors[user.role]}`}>{user.roleLabel ?? user.role}</Badge></td>
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
                            {assignableRoles.map((r) => (
                            <DropdownMenuItem key={r.value} onClick={() => updateUser.mutate({ id: user.id, role: r.value })}>{r.label}</DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem className="gap-2" onClick={() => updateUser.mutate({ id: user.id, status: user.status === 'active' ? 'inactive' : 'active' })}>
                          <Eye className="h-3.5 w-3.5" /> {user.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => deleteUser.mutate(user.id)}>
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
