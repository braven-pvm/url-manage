export default function NotAuthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-950">Not authorized</h1>
      <p className="mt-3 text-sm text-slate-600">
        Your account is signed in but does not have the required PVM URL Admin role.
      </p>
    </main>
  );
}
