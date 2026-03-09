/**
 * RBAC permission matrix — 6 roles, fine-grained permissions.
 *
 * Roles (in order of privilege):
 *   super_admin > workspace_admin > operator > reviewer > analyst > api_user
 *
 * Permissions are additive — each role gets its own set.
 * Middleware checks: hasPermission(role, permission)
 */

export type Permission =
  // Workspace
  | 'workspace:read'
  | 'workspace:update'
  | 'workspace:delete'
  | 'workspace:manage_billing'
  // Users
  | 'users:list'
  | 'users:invite'
  | 'users:update_role'
  | 'users:deactivate'
  // Projects
  | 'projects:create'
  | 'projects:read'
  | 'projects:update'
  | 'projects:delete'
  | 'projects:archive'
  // Documents
  | 'documents:upload'
  | 'documents:read'
  | 'documents:delete'
  // Jobs
  | 'jobs:create'
  | 'jobs:read'
  | 'jobs:cancel'
  | 'jobs:retry'
  // MCQ Records
  | 'mcq:read'
  | 'mcq:update'
  | 'mcq:delete'
  // Review
  | 'review:read'
  | 'review:approve'
  | 'review:reject'
  | 'review:flag'
  | 'review:edit'
  | 'review:reassign'
  // Providers
  | 'providers:read'
  | 'providers:create'
  | 'providers:update'
  | 'providers:delete'
  | 'providers:test'
  // Export
  | 'export:create'
  | 'export:read'
  | 'export:download'
  // Analytics
  | 'analytics:read'
  | 'analytics:export'
  // Audit
  | 'audit:read'
  // Settings
  | 'settings:read'
  | 'settings:update'
  // API Keys
  | 'api_keys:create'
  | 'api_keys:read'
  | 'api_keys:revoke'
  // Notifications
  | 'notifications:read'
  | 'notifications:update';

const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  super_admin: [
    // Super admin has ALL permissions
    'workspace:read',
    'workspace:update',
    'workspace:delete',
    'workspace:manage_billing',
    'users:list',
    'users:invite',
    'users:update_role',
    'users:deactivate',
    'projects:create',
    'projects:read',
    'projects:update',
    'projects:delete',
    'projects:archive',
    'documents:upload',
    'documents:read',
    'documents:delete',
    'jobs:create',
    'jobs:read',
    'jobs:cancel',
    'jobs:retry',
    'mcq:read',
    'mcq:update',
    'mcq:delete',
    'review:read',
    'review:approve',
    'review:reject',
    'review:flag',
    'review:edit',
    'review:reassign',
    'providers:read',
    'providers:create',
    'providers:update',
    'providers:delete',
    'providers:test',
    'export:create',
    'export:read',
    'export:download',
    'analytics:read',
    'analytics:export',
    'audit:read',
    'settings:read',
    'settings:update',
    'api_keys:create',
    'api_keys:read',
    'api_keys:revoke',
    'notifications:read',
    'notifications:update',
  ],

  workspace_admin: [
    'workspace:read',
    'workspace:update',
    'workspace:manage_billing',
    'users:list',
    'users:invite',
    'users:update_role',
    'users:deactivate',
    'projects:create',
    'projects:read',
    'projects:update',
    'projects:delete',
    'projects:archive',
    'documents:upload',
    'documents:read',
    'documents:delete',
    'jobs:create',
    'jobs:read',
    'jobs:cancel',
    'jobs:retry',
    'mcq:read',
    'mcq:update',
    'mcq:delete',
    'review:read',
    'review:approve',
    'review:reject',
    'review:flag',
    'review:edit',
    'review:reassign',
    'providers:read',
    'providers:create',
    'providers:update',
    'providers:delete',
    'providers:test',
    'export:create',
    'export:read',
    'export:download',
    'analytics:read',
    'analytics:export',
    'audit:read',
    'settings:read',
    'settings:update',
    'api_keys:create',
    'api_keys:read',
    'api_keys:revoke',
    'notifications:read',
    'notifications:update',
  ],

  operator: [
    'workspace:read',
    'projects:create',
    'projects:read',
    'projects:update',
    'documents:upload',
    'documents:read',
    'documents:delete',
    'jobs:create',
    'jobs:read',
    'jobs:cancel',
    'jobs:retry',
    'mcq:read',
    'mcq:update',
    'review:read',
    'review:approve',
    'review:reject',
    'review:flag',
    'review:edit',
    'providers:read',
    'providers:test',
    'export:create',
    'export:read',
    'export:download',
    'analytics:read',
    'settings:read',
    'notifications:read',
    'notifications:update',
  ],

  reviewer: [
    'workspace:read',
    'projects:read',
    'documents:read',
    'jobs:read',
    'mcq:read',
    'review:read',
    'review:approve',
    'review:reject',
    'review:flag',
    'review:edit',
    'analytics:read',
    'notifications:read',
    'notifications:update',
  ],

  analyst: [
    'workspace:read',
    'projects:read',
    'documents:read',
    'jobs:read',
    'mcq:read',
    'review:read',
    'providers:read',
    'export:create',
    'export:read',
    'export:download',
    'analytics:read',
    'analytics:export',
    'notifications:read',
    'notifications:update',
  ],

  api_user: [
    'workspace:read',
    'projects:read',
    'documents:upload',
    'documents:read',
    'jobs:create',
    'jobs:read',
    'mcq:read',
    'export:create',
    'export:read',
    'export:download',
    'notifications:read',
    'notifications:update',
  ],
} as const;

// Pre-computed Sets for O(1) lookups
const ROLE_PERMISSION_SETS = new Map<string, Set<Permission>>();
for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
  ROLE_PERMISSION_SETS.set(role, new Set(perms));
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const permSet = ROLE_PERMISSION_SETS.get(role);
  if (!permSet) return false;
  return permSet.has(permission);
}

/**
 * Check if a role has ALL specified permissions.
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  const permSet = ROLE_PERMISSION_SETS.get(role);
  if (!permSet) return false;
  return permissions.every((p) => permSet.has(p));
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  const permSet = ROLE_PERMISSION_SETS.get(role);
  if (!permSet) return false;
  return permissions.some((p) => permSet.has(p));
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role: string): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if roleA can manage roleB (i.e., roleA has higher privilege).
 */
const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  workspace_admin: 80,
  operator: 60,
  reviewer: 40,
  analyst: 30,
  api_user: 20,
};

export function canManageRole(actorRole: string, targetRole: string): boolean {
  const actorLevel = ROLE_HIERARCHY[actorRole] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
  return actorLevel > targetLevel;
}
