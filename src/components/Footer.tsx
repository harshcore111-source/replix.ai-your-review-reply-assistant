import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Logo />
          <p className="mt-2 text-xs text-muted-foreground">AI-powered review replies for businesses that care.</p>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Replix.ai</p>
      </div>
    </footer>
  );
}
