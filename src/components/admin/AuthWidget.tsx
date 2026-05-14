"use client";

import {
  ClerkDegraded,
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  SignIn,
  SignUp,
  useAuth,
} from "@clerk/nextjs";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const authAppearance = {
  elements: {
    cardBox: "shadow-lg",
    formButtonPrimary:
      "bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-950",
  },
};

type AuthWidgetProps = {
  fallbackRedirectUrl?: string;
};

export function SignInWidget({
  fallbackRedirectUrl = "/admin/dashboard",
}: AuthWidgetProps) {
  return (
    <AuthWidgetFrame fallbackRedirectUrl={fallbackRedirectUrl}>
      <ClerkLoaded>
        <SignIn
          appearance={authAppearance}
          fallbackRedirectUrl={fallbackRedirectUrl}
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
        />
      </ClerkLoaded>
    </AuthWidgetFrame>
  );
}

export function SignUpWidget({
  fallbackRedirectUrl = "/admin/dashboard",
}: AuthWidgetProps) {
  return (
    <AuthWidgetFrame fallbackRedirectUrl={fallbackRedirectUrl}>
      <ClerkLoaded>
        <SignUp
          appearance={authAppearance}
          fallbackRedirectUrl={fallbackRedirectUrl}
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
        />
      </ClerkLoaded>
    </AuthWidgetFrame>
  );
}

function AuthWidgetFrame({
  children,
  fallbackRedirectUrl,
}: {
  children: ReactNode;
  fallbackRedirectUrl: string;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(fallbackRedirectUrl);
    }
  }, [fallbackRedirectUrl, isLoaded, isSignedIn, router]);

  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-[28rem] w-full max-w-[25rem]">
        <AuthStatusCard
          detail="Your session is active. Opening the admin console."
          title="Opening admin console"
        />
      </div>
    );
  }

  return (
    <div className="min-h-[28rem] w-full max-w-[25rem]">
      <ClerkLoading>
        <AuthStatusCard
          detail="The secure sign-in form is loading."
          title="Loading sign-in"
        />
      </ClerkLoading>
      <ClerkFailed>
        <AuthStatusCard
          detail="Refresh the page, disable browser extensions for this site, or use a private window. If it still fails, check Clerk domain configuration."
          title="Sign-in could not load"
        />
      </ClerkFailed>
      <ClerkDegraded>
        <AuthStatusCard
          detail="Clerk is reachable but degraded. You can retry shortly."
          title="Sign-in is degraded"
        />
      </ClerkDegraded>
      {children}
    </div>
  );
}

function AuthStatusCard({
  detail,
  title,
}: {
  detail: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}
