import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Replix.ai" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) { setError("Enter a valid email"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      <div className="px-4 sm:px-6 py-6"><Logo /></div>
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
            {sent ? (
              <div className="text-center py-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <MailCheck className="h-6 w-6" />
                </div>
                <h1 className="mt-4 text-xl font-bold">Check your inbox</h1>
                <p className="mt-2 text-sm text-muted-foreground">We sent a password reset link to <strong>{email}</strong>.</p>
                <Button asChild variant="outline" className="mt-6 w-full"><Link to="/login">Back to login</Link></Button>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold">Forgot password?</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" />
                    {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                  </Button>
                </form>
                <p className="mt-5 text-center text-sm text-muted-foreground">
                  Remembered? <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
