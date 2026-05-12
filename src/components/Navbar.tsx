import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, X, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const links = [
    { to: "/", label: "Home" },
    { to: "/#pricing", label: "Pricing" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.to} href={l.to} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">Dashboard</Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Login</Link>
              <Button asChild size="sm"><Link to="/signup">Get started</Link></Button>
            </>
          )}
        </nav>
        <button className="md:hidden -mr-2 p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <a key={l.to} href={l.to} onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium">{l.label}</a>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium">Dashboard</Link>
                <button onClick={handleSignOut} className="py-2.5 text-left text-sm font-medium text-destructive">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium">Login</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="mt-1 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
