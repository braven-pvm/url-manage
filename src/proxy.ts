import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  ADMIN_DASHBOARD_PATH,
  cleanAdminPath,
  internalAdminPath,
  isCleanAdminPath,
} from "@/lib/admin-routes";

export const isLegacyAdminRoute = createRouteMatcher(["/admin", "/admin/(.*)"]);

function isAdminHost(req: Request) {
  const host = req.headers.get("host")?.split(":")[0]?.toLowerCase();
  const configuredHost = process.env.ADMIN_HOST?.toLowerCase();

  return (
    !host ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === configuredHost
  );
}

function isLocalDevelopmentHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function getExternalAdminHostRedirectUrl(
  nextUrl: URL,
  adminHost: string | undefined,
): URL | null {
  const hostname = nextUrl.hostname.toLowerCase();

  if (!adminHost || hostname === adminHost || isLocalDevelopmentHost(hostname)) {
    return null;
  }

  if (
    !isLegacyAdminRoute(
      { nextUrl } as Parameters<typeof isLegacyAdminRoute>[0],
    ) &&
    !isCleanAdminPath(nextUrl.pathname)
  ) {
    return null;
  }

  const redirectUrl = new URL(nextUrl);
  redirectUrl.hostname = adminHost;
  redirectUrl.pathname = cleanAdminPath(nextUrl.pathname);

  return redirectUrl;
}

export default clerkMiddleware(async (auth, req) => {
  if (
    process.env.NODE_ENV !== "production" &&
    req.nextUrl.pathname.startsWith("/visual-qa/")
  ) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pvm-visual-qa", "1");

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const adminHost = isAdminHost(req);
  const externalAdminRedirectUrl = getExternalAdminHostRedirectUrl(
    req.nextUrl,
    process.env.ADMIN_HOST?.toLowerCase(),
  );

  if (externalAdminRedirectUrl) {
    return NextResponse.redirect(externalAdminRedirectUrl);
  }

  if (adminHost && req.nextUrl.pathname === "/") {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = ADMIN_DASHBOARD_PATH;
    return NextResponse.redirect(dashboardUrl);
  }

  if (adminHost && isLegacyAdminRoute(req)) {
    const cleanUrl = req.nextUrl.clone();
    cleanUrl.pathname = cleanAdminPath(req.nextUrl.pathname);
    return NextResponse.redirect(cleanUrl);
  }

  if (isLegacyAdminRoute(req) || (adminHost && isCleanAdminPath(req.nextUrl.pathname))) {
    const { isAuthenticated } = await auth();

    if (!isAuthenticated) {
      const redirectUrl = `${req.nextUrl.pathname}${req.nextUrl.search}`;
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", redirectUrl);

      return NextResponse.redirect(signInUrl);
    }
  }

  if (adminHost && isCleanAdminPath(req.nextUrl.pathname)) {
    const internalUrl = req.nextUrl.clone();
    internalUrl.pathname = internalAdminPath(req.nextUrl.pathname);
    return NextResponse.rewrite(internalUrl);
  }
});

export const config = {
  matcher: [
    "/__clerk/(.*)",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
