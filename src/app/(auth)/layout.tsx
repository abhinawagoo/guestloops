import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/80 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-semibold text-foreground tracking-tight hover:text-primary transition-colors"
          >
            Google Review Growth
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Home
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
