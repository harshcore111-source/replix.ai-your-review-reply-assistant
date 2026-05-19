import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, Copy, Check, RefreshCcw, Star, Filter, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const TONES = ["Professional", "Friendly", "Casual", "Apologetic", "Warm"];
const LANGUAGES = ["English", "Hinglish"];
const LENGTHS = ["Short", "Medium", "Long"];
const PLAN_LIMITS: Record<string, number> = { free: 30, starter: 400, growth: 1000 };

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Replix.ai" }] }),
  component: Dashboard,
});

type Profile = { business_name: string | null; business_type: string | null; default_language: string; default_tone: string; default_length: string; custom_instruction: string | null; onboarded: boolean };
type Review = { id: string; customer_name: string | null; rating: number; review_text: string; status: string; created_at: string };
type Reply = { id: string; review_id: string; reply_text: string };
type Usage = { replies_used: number; plan_type: string };

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("business_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data as Profile | null;
    },
  });

  useEffect(() => {
    if (profile && !profile.onboarded) navigate({ to: "/onboarding" });
  }, [profile, navigate]);

  const { data: usage } = useQuery({
    queryKey: ["usage", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("usage").select("replies_used, plan_type").eq("user_id", user!.id).maybeSingle();
      return data as Usage | null;
    },
  });

  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return (data ?? []) as Review[];
    },
  });

  const { data: replies = [] } = useQuery({
    queryKey: ["replies", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("replies").select("*").eq("user_id", user!.id);
      return (data ?? []) as Reply[];
    },
  });

  const replyByReviewId = new Map(replies.map((r) => [r.review_id, r]));

  const filtered = reviews.filter((r) => {
    if (filterRating !== "all" && r.rating !== Number(filterRating)) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: reviews.length,
    replied: reviews.filter((r) => r.status === "replied").length,
    pending: reviews.filter((r) => r.status === "pending").length,
  };
  const responseRate = stats.total ? Math.round((stats.replied / stats.total) * 100) : 0;

  const limit = PLAN_LIMITS[usage?.plan_type ?? "free"] ?? 30;
  const used = usage?.replies_used ?? 0;
  const usagePct = (used / limit) * 100;

  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["reviews"] });
    qc.invalidateQueries({ queryKey: ["replies"] });
    qc.invalidateQueries({ queryKey: ["usage"] });
  }, [qc]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Hi{profile?.business_name ? `, ${profile.business_name}` : ""} 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">Generate consistent, on-brand replies in seconds.</p>
          </div>
          <Button size="lg" onClick={() => setPasteOpen(true)} className="shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> Add review
          </Button>
        </div>

        {/* Usage + Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total reviews" value={stats.total} />
          <StatCard label="Replied" value={stats.replied} />
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Response rate" value={`${responseRate}%`} />
        </div>

        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold">Monthly usage</p>
              <p className="text-xs text-muted-foreground">{used} / {limit} replies on <span className="capitalize">{usage?.plan_type ?? "free"}</span> plan</p>
            </div>
            {usagePct >= 80 && <Badge variant="destructive">Almost full</Badge>}
          </div>
          <Progress value={usagePct} />
          {usagePct >= 80 && (
            <Button variant="link" className="px-0 mt-1 h-auto text-xs" onClick={() => setUpgradeOpen(true)}>
              Upgrade for more →
            </Button>
          )}
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} stars</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews */}
        {reviewsLoading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary mb-3" />
            <p className="font-semibold">No reviews yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first review to generate a reply.</p>
            <Button onClick={() => setPasteOpen(true)} className="mt-4">Add review</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <ReviewRow
                key={r.id}
                review={r}
                reply={replyByReviewId.get(r.id)}
                onGenerate={() => { setActiveReview(r); setGeneratorOpen(true); }}
                onRefresh={refresh}
              />
            ))}
          </div>
        )}
      </main>

      <PasteReviewDialog open={pasteOpen} onOpenChange={setPasteOpen} userId={user.id} onSaved={(rev) => { refresh(); setPasteOpen(false); setActiveReview(rev); setGeneratorOpen(true); }} />
      {activeReview && (
        <GeneratorDialog
          open={generatorOpen}
          onOpenChange={setGeneratorOpen}
          review={activeReview}
          existingReply={replyByReviewId.get(activeReview.id)}
          profile={profile}
          onLimitReached={() => { setGeneratorOpen(false); setUpgradeOpen(true); }}
          onSaved={refresh}
        />
      )}
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}

function ReviewRow({ review, reply, onGenerate, onRefresh }: { review: Review; reply: Reply | undefined; onGenerate: () => void; onRefresh: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!reply) return;
    await navigator.clipboard.writeText(reply.reply_text);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 1500);
  };

  const markReplied = async () => {
    await supabase.from("reviews").update({ status: "replied" }).eq("id", review.id);
    toast.success("Marked as replied");
    onRefresh();
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{review.customer_name || "Anonymous"}</p>
            <RatingStars rating={review.rating} />
          </div>
          <p className="mt-2 text-sm text-foreground leading-relaxed">{review.review_text}</p>
        </div>
        <Badge variant={review.status === "replied" ? "default" : "secondary"} className={review.status === "replied" ? "bg-success text-success-foreground" : ""}>
          {review.status}
        </Badge>
      </div>
      {reply && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">Your reply</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.reply_text}</p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={onGenerate}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> {reply ? "Regenerate" : "Generate reply"}
        </Button>
        {reply && <Button size="sm" variant="outline" onClick={copy}>{copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}Copy</Button>}
        {reply && review.status !== "replied" && <Button size="sm" variant="outline" onClick={markReplied}><Check className="mr-1.5 h-3.5 w-3.5" />Mark replied</Button>}
      </div>
    </Card>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= rating ? "fill-[#FFFF00] text-[#FFFF00]" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function PasteReviewDialog({ open, onOpenChange, userId, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; userId: string; onSaved: (rev: Review) => void }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!text.trim()) { toast.error("Review text required"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("reviews").insert({
      user_id: userId,
      customer_name: name.trim() || null,
      rating,
      review_text: text.trim(),
    }).select().single();
    setSaving(false);
    if (error || !data) { toast.error(error?.message ?? "Failed"); return; }
    setName(""); setRating(5); setText("");
    onSaved(data as Review);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a review</DialogTitle>
          <DialogDescription>Paste from Google, Zomato, Swiggy — or type it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Customer name (optional)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" maxLength={80} />
          </div>
          <div>
            <Label>Rating</Label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                  <Star className={`h-6 w-6 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Review text</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="mt-1.5" maxLength={2000} placeholder="Paste the customer's review here..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & generate"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GeneratorDialog({ open, onOpenChange, review, existingReply, profile, onLimitReached, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; review: Review; existingReply: Reply | undefined; profile: Profile | null | undefined;
  onLimitReached: () => void; onSaved: () => void;
}) {
  const [tone, setTone] = useState(profile?.default_tone ?? "Professional");
  const [language, setLanguage] = useState(profile?.default_language ?? "English");
  const [length, setLength] = useState(profile?.default_length ?? "Medium");
  const [instruction, setInstruction] = useState("");
  const [reply, setReply] = useState(existingReply?.reply_text ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setReply(existingReply?.reply_text ?? "");
      setTone(profile?.default_tone ?? "Professional");
      setLanguage(profile?.default_language ?? "English");
      setLength(profile?.default_length ?? "Medium");
      setInstruction("");
    }
  }, [open, existingReply, profile]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          review_text: review.review_text,
          rating: review.rating,
          tone, language, length,
          custom_instruction: instruction,
          business_name: profile?.business_name ?? "",
          business_type: profile?.business_type ?? "",
        }),
      });
      const data = await res.json();
      if (res.status === 429 && data.error === "limit_reached") { onLimitReached(); return; }
      if (res.status === 429) { toast.error("AI is busy — try again in a moment"); return; }
      if (res.status === 402) { toast.error("AI credits exhausted — please contact support"); return; }
      if (!res.ok) { toast.error(data.error ?? "Generation failed"); return; }
      setReply(data.reply);
    } catch (e) {
      toast.error("Network error");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!reply.trim()) { toast.error("Reply is empty"); return; }
    setSaving(true);
    if (existingReply) {
      await supabase.from("replies").update({ reply_text: reply }).eq("id", existingReply.id);
    } else {
      const { data: { user: u } } = await supabase.auth.getUser();
      await supabase.from("replies").insert({ review_id: review.id, user_id: u!.id, reply_text: reply });
    }
    await supabase.from("reviews").update({ status: "replied" }).eq("id", review.id);
    setSaving(false);
    toast.success("Reply saved");
    onSaved();
    onOpenChange(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(reply);
    toast.success("Copied!");
  };

  // Auto-generate on first open if no reply
  useEffect(() => {
    if (open && !existingReply && !reply && !generating) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate reply</DialogTitle>
          <DialogDescription>Adjust tone, language, length — or add a quick instruction.</DialogDescription>
        </DialogHeader>

        <Card className="p-3 bg-muted/40">
          <div className="flex items-center gap-2 mb-1">
            <RatingStars rating={review.rating} />
            <span className="text-xs text-muted-foreground">{review.customer_name || "Anonymous"}</span>
          </div>
          <p className="text-sm">{review.review_text}</p>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Length</Label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{LENGTHS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs">Custom instruction (optional)</Label>
          <Input value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. mention our weekend brunch" className="mt-1 h-9" maxLength={200} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs">Reply</Label>
            <Button variant="ghost" size="sm" onClick={generate} disabled={generating} className="h-7 text-xs">
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
              <span className="ml-1.5">Regenerate</span>
            </Button>
          </div>
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={6} placeholder={generating ? "Generating..." : "Reply will appear here"} disabled={generating} maxLength={1500} />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={copy} disabled={!reply}><Copy className="mr-1.5 h-4 w-4" />Copy</Button>
          <Button onClick={save} disabled={saving || !reply.trim()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & mark replied"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpgradeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle>You're nearly out of replies</DialogTitle>
          <DialogDescription>Paid plans unlock 400-1,000 replies / month, faster AI, and saved instructions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p><strong>Starter</strong> — ₹199/mo · 400 replies</p>
          <p><strong>Growth</strong> — ₹399/mo · 1,000 replies</p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Maybe later</Button>
          <Button disabled>Coming soon</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
