import Link from "next/link";
import { Show } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-24 font-sans">
      <main className="w-full max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          PVM URL Redirection System
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          Manage stable printed and QR redirect URLs for PVM.
        </p>
        <div className="mt-8">
          <Show
            fallback={
              <Link
                className="inline-flex rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                href="/sign-in?redirect_url=/admin"
              >
                Sign in to admin
              </Link>
            }
            when="signed-in"
          >
            <Link
              className="inline-flex rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              href="/admin"
            >
              Open admin console
            </Link>
          </Show>
        </div>
      </main>
    </div>
  );
}
