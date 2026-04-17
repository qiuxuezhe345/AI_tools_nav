export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-background p-8 shadow-sm">
        {children}
      </div>
    </main>
  );
}
