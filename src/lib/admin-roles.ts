export type AdminRoleName = "ADMINISTRATOR" | "EDITOR" | "VIEWER";

const roleRank: Record<AdminRoleName, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMINISTRATOR: 2,
};

export const ADMIN_ROLE_LABELS: Record<AdminRoleName, string> = {
  ADMINISTRATOR: "Administrator",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export const ADMIN_ROLES: AdminRoleName[] = [
  "ADMINISTRATOR",
  "EDITOR",
  "VIEWER",
];

export const ADMIN_ROLE_VALUES: Record<AdminRoleName, string[]> = {
  ADMINISTRATOR: [
    "Create, edit, and delete redirects",
    "Manage tags and categories",
    "Change system settings",
    "Manage user access",
    "View all analytics",
  ],
  EDITOR: [
    "Create and edit redirects",
    "Manage tags and categories",
    "View all analytics",
  ],
  VIEWER: ["View all redirects", "View all analytics"],
};

export const ADMIN_ROLE_LIMITS: Record<AdminRoleName, string[]> = {
  ADMINISTRATOR: [],
  EDITOR: ["Cannot manage users", "Cannot change system settings"],
  VIEWER: [
    "Cannot create or edit redirects",
    "Cannot manage users",
    "Cannot change settings",
  ],
};

export function hasAdminRole(role: AdminRoleName, requiredRole: AdminRoleName) {
  return roleRank[role] >= roleRank[requiredRole];
}

export function parseAdminRole(value: string): AdminRoleName | null {
  return ADMIN_ROLES.includes(value as AdminRoleName)
    ? (value as AdminRoleName)
    : null;
}
