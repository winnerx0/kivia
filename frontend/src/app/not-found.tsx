import Link from "@/components/Link";
import { Home, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-2.5 px-6 h-16 shrink-0 border-b">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground glow-blue-sm">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-base font-display font-bold tracking-tight">Kivia</span>
        </Link>
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 dot-grid">
        <div className="relative mb-8">
          <p className="text-[10rem] leading-none font-display font-black tracking-tighter text-primary/10 select-none">
            404
          </p>
          <p className="absolute inset-0 flex items-center justify-center text-6xl font-display font-bold tracking-tighter text-primary">
            404
          </p>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-base text-muted-foreground max-w-md text-center leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist, has been moved,
          or you may not have permission to access it.
        </p>

        <Separator className="my-8 max-w-xs" />

        <div className="flex gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/dashboard" />}>
            Dashboard
          </Button>
          <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/" />}>
            <Home className="h-4 w-4 mr-1.5" />
            Home
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-center h-14 text-xs text-muted-foreground border-t">
        Kivia &mdash; API Observability
      </footer>
    </div>
  );
}
