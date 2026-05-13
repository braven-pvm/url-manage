import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const isAdminRoute = createRouteMatcher(["/admin", "/admin/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { isAuthenticated } = await auth();

    if (!isAuthenticated) {
      const redirectUrl = `${req.nextUrl.pathname}${req.nextUrl.search}`;
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", redirectUrl);

      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    "/__clerk/(.*)",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
