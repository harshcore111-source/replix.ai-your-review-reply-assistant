import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sparkles, MessageSquare, Globe, Zap, ShieldCheck, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Replix.ai — AI Review Replies in Seconds" },
      { name: "description", content: "Built for businesses that care about reputation. Reply to Google, Zomato, and Swiggy reviews with personalized AI in English & Hinglish." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <Demo />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="bg-hero-gradient">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI-powered review replies
        </div>
        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-[1.05]">
          Built for businesses that care about <span className="text-gradient-brand">reputation</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Respond quickly, stay consistent, and maintain a strong brand voice across every review — in English or Hinglish.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="h-12 px-7 text-base shadow-glow">
            <Link to="/signup">Start free — 30 replies</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
            <a href="#pricing">See pricing</a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">No credit card required</p>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <div className="border-y border-border/60 bg-card/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> Used by cafés, salons, clinics & D2C brands</span>
      </div>
    </div>
  );
}

function Demo() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">From review to reply in 3 seconds</h2>
          <p className="mt-3 text-muted-foreground">Paste a review. Pick a tone. Done.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5 bg-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Customer review · ★★☆☆☆</p>
            <p className="text-sm leading-relaxed text-foreground">"Food was cold when it arrived and the delivery took over an hour. Really disappointed since we had ordered for a birthday."</p>
          </Card>
          <Card className="p-5 bg-primary/5 border-primary/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Replix.ai reply</p>
            <p className="text-sm leading-relaxed text-foreground">"We're truly sorry the food arrived cold and late, especially on a birthday — that's not the experience we want to give. Please DM us your order number so we can make this right for you and the celebration."</p>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: MessageSquare, title: "Smart negative handling", desc: "Apologetic, accountable replies for low ratings — never defensive." },
    { icon: Globe, title: "English & Hinglish", desc: "Reply the way your customers actually talk." },
    { icon: Zap, title: "Tone & length control", desc: "Professional, friendly, casual — your voice, every time." },
    { icon: ShieldCheck, title: "Stay on-brand", desc: "Save custom instructions so every reply sounds like you." },
  ];
  return (
    <section className="py-20 sm:py-24 bg-card/40 border-y border-border/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-center">Everything you need to manage reviews</h2>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((it) => (
            <Card key={it.title} className="p-6 bg-card hover:shadow-soft transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base">{it.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{it.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Free", price: "₹0", per: "/month", desc: "Try it out", cta: "Start free", highlight: false, features: ["30 replies / month", "English + Hinglish", "All tones & length", "Smart negative handling", "Edit & copy"] },
    { name: "Starter", price: "₹199", per: "/month", desc: "Most popular · ₹6.6/day", cta: "Upgrade — soon", highlight: true, features: ["400 replies / month", "Save custom instructions", "Faster AI", "Dashboard filters", "Basic analytics"] },
    { name: "Growth", price: "₹399", per: "/month", desc: "For high-volume teams", cta: "Upgrade — soon", highlight: false, features: ["1,000 replies / month", "Custom instruction presets", "Priority AI speed", "Full analytics", "Priority support"] },
  ];
  return (
    <section id="pricing" className="py-20 sm:py-24 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Simple pricing</h2>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when you grow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <Card key={p.name} className={`p-7 flex flex-col ${p.highlight ? "border-primary border-2 shadow-glow relative" : ""}`}>
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most Popular</div>
              )}
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{p.name}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.per}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button asChild={!p.highlight && p.cta === "Start free"} disabled={p.cta !== "Start free"} variant={p.highlight ? "default" : "outline"} className="mt-6 w-full">
                {p.cta === "Start free" ? <Link to="/signup">{p.cta}</Link> : <span>{p.cta}</span>}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 sm:py-24 bg-card/40 border-t border-border/60">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">Stop staring at the reply box</h2>
        <p className="mt-3 text-muted-foreground">Generate your first reply in under a minute.</p>
        <Button asChild size="lg" className="mt-8 h-12 px-7 text-base shadow-glow">
          <Link to="/signup">Get started free</Link>
        </Button>
      </div>
    </section>
  );
}
