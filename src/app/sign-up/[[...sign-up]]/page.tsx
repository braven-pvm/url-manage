import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUpWidget } from "@/components/admin/AuthWidget";

type AuthPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignUpPage({ searchParams }: AuthPageProps = {}) {
  const { isAuthenticated } = await auth();
  const redirectTarget = await getRedirectTarget(searchParams);

  if (isAuthenticated) {
    redirect(redirectTarget);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
      <section className="grid w-full max-w-5xl gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            PVM URL Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Create your admin account
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Use the email address that was invited to the PVM URL admin console.
          </p>
        </div>
        <SignUpWidget fallbackRedirectUrl={redirectTarget} />
      </section>
    </main>
  );
}

async function getRedirectTarget(
  searchParams: AuthPageProps["searchParams"],
): Promise<string> {
  const params = searchParams ? await searchParams : {};
  const rawRedirectUrl = params.redirect_url;
  const redirectUrl = Array.isArray(rawRedirectUrl)
    ? rawRedirectUrl[0]
    : rawRedirectUrl;

  if (
    redirectUrl &&
    redirectUrl.startsWith("/admin") &&
    !redirectUrl.startsWith("//")
  ) {
    return redirectUrl;
  }

  return "/admin/dashboard";
}
