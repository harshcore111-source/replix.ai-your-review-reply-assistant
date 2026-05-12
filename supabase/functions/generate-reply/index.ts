// Generate AI review reply via Lovable AI Gateway. Enforces per-user usage limits.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_LIMITS: Record<string, number> = {
  free: 30,
  starter: 400,
  growth: 1000,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const {
      review_text,
      rating,
      tone = "Professional",
      language = "English",
      length = "Medium",
      custom_instruction = "",
      business_name = "",
      business_type = "",
    } = body ?? {};

    if (!review_text || !rating) return json({ error: "review_text and rating required" }, 400);

    // Usage gating
    const { data: usage } = await supabase
      .from("usage")
      .select("replies_used, plan_type, billing_cycle_start")
      .eq("user_id", user.id)
      .maybeSingle();

    const plan = usage?.plan_type ?? "free";
    const limit = PLAN_LIMITS[plan] ?? 30;
    const used = usage?.replies_used ?? 0;

    // Reset cycle if older than 30 days
    const cycleStart = usage?.billing_cycle_start ? new Date(usage.billing_cycle_start) : new Date();
    const cycleAge = (Date.now() - cycleStart.getTime()) / (1000 * 60 * 60 * 24);
    let effectiveUsed = used;
    if (cycleAge >= 30) {
      await supabase.from("usage").update({
        replies_used: 0,
        billing_cycle_start: new Date().toISOString(),
      }).eq("user_id", user.id);
      effectiveUsed = 0;
    }

    if (effectiveUsed >= limit) {
      return json({ error: "limit_reached", limit, used: effectiveUsed, plan }, 429);
    }

    const lengthGuidance: Record<string, string> = {
      Short: "1-2 sentences, under 40 words.",
      Medium: "3-4 sentences, 50-90 words.",
      Long: "5-7 sentences, 100-160 words.",
    };

    const isNegative = Number(rating) <= 2;
    const stance = isNegative
      ? "The customer is unhappy. Open with a sincere, specific apology that names what went wrong, take responsibility without excuses, and end by inviting them to contact the business privately to make it right (e.g. 'Please reach out to us directly so we can resolve this')."
      : "The customer is happy. Open with warm, specific appreciation referencing what they liked, and end with a brief invitation to return.";

    const langRule = language.toLowerCase().includes("hinglish")
      ? "Reply in natural Hinglish (Hindi written in Roman script mixed with English, the way Indian shop owners actually write online). Keep it warm, simple, no shayari."
      : `Reply in ${language}. Use simple, conversational words.`;

    const system = `You write personalized replies to customer reviews for "${business_name || "the business"}"${business_type ? ` (a ${business_type})` : ""}.

Rules:
- ${stance}
- ${langRule}
- Tone: ${tone}.
- Length: ${lengthGuidance[length] ?? lengthGuidance.Medium}
- Reference at least one specific detail from the review. Never use generic filler like "Thank you for your valuable feedback".
- Do not invent facts about the business. Do not include hashtags, emojis, or markdown.
- Output ONLY the reply text. No preface, no quotes, no signature.
${custom_instruction ? `- Additional instruction: ${custom_instruction}` : ""}`;

    const userPrompt = `Customer rating: ${rating}/5
Customer review: "${review_text}"

Write the reply now.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (aiRes.status === 429) return json({ error: "ai_rate_limited" }, 429);
    if (aiRes.status === 402) return json({ error: "ai_credits_exhausted" }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error:", t);
      return json({ error: "ai_failed" }, 500);
    }

    const aiData = await aiRes.json();
    const reply = aiData?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) return json({ error: "empty_reply" }, 500);

    // Increment usage
    await supabase.from("usage").update({ replies_used: effectiveUsed + 1 }).eq("user_id", user.id);

    return json({ reply, used: effectiveUsed + 1, limit, plan });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
