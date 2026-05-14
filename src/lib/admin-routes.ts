const cleanAdminPrefixes = [
  "/dashboard",
  "/redirects",
  "/tags",
  "/access",
  "/settings",
];

export const ADMIN_DASHBOARD_PATH = "/dashboard";
export const ADMIN_REDIRECTS_PATH = "/redirects";

export function cleanAdminPath(pathname: string): string {
  if (pathname === "/admin") {
    return ADMIN_REDIRECTS_PATH;
  }

  if (pathname.startsWith("/admin/")) {
    return pathname.slice("/admin".length) || ADMIN_REDIRECTS_PATH;
  }

  return pathname;
}

export function internalAdminPath(pathname: string): string {
  if (pathname === ADMIN_REDIRECTS_PATH) {
    return "/admin";
  }

  if (pathname.startsWith(`${ADMIN_REDIRECTS_PATH}/`)) {
    return `/admin${pathname}`;
  }

  if (isCleanAdminPath(pathname)) {
    return `/admin${pathname}`;
  }

  return pathname;
}

export function isCleanAdminPath(pathname: string): boolean {
  return cleanAdminPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isSafeAdminRedirect(
  value: string | undefined,
  options: { allowAccess?: boolean } = {},
): value is string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  const cleanPath = cleanAdminPath(value);

  if (!options.allowAccess && cleanPath.startsWith("/access")) {
    return false;
  }

  return isCleanAdminPath(cleanPath);
}
