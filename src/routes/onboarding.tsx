import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BUSINESS_TYPES = ["Restaurant / Café", "Salon / Spa", "Clinic / Hospital", "Retail Store", "Hotel / Stay", "D2C Brand", "Service Provider", "Other"];
const LANGUAGES = ["English", "Hinglish"];
const TONES = ["Professional", "Friendly", "Casual", "Apologetic", "Warm"];

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Replix.ai" }] }),
  component: Onboarding,
});

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState(BUSINESS_TYPES[0]);
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Business name required"); return; }
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("business_profiles").update({
      business_name: name.trim(),
      business_type: type,
      default_language: lang,
      default_tone: tone,
      onboarded: true,
    }).eq("user_id", user.id);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome to Replix.ai!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      <div className="px-4 sm:px-6 py-6"><Logo /></div>
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Tell us about your business</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">We'll personalize every reply.</p>
          </div>
          <form onSubmit={onSubmit} className="rounded-2xl bg-card border border-border p-6 shadow-soft space-y-5">
            <div>
              <Label htmlFor="bn">Business name</Label>
              <Input id="bn" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bombay Brew Co." className="mt-1.5 h-11" maxLength={100} />
            </div>
            <div>
              <Label>Business type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Default language</Label>
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Default tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to dashboard"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
