import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    /* ---------- BODY ---------- */
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { message, roomId, context } = body;
    if (!message || !roomId) {
      return new Response(
        JSON.stringify({ error: "message and roomId are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* ---------- ENV ---------- */
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY not set");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    /* ---------- CHAT CONTEXT ---------- */
    const { data: recentMessages } = await supabase
      .from("collaboration_messages")
      .select("username, content, is_ai")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(10);

    const chatContext =
      recentMessages
        ?.reverse()
        .map(
          (m) =>
            `${m.is_ai ? "AI Assistant" : m.username}: ${m.content}`
        )
        .join("\n") || "";

    /* ---------- OPENROUTER (FREE MODEL) ---------- */
    const aiRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai-verse.app",
          "X-Title": "AI-Verse Collaboration",
        },
        body: JSON.stringify({
          // ✅ FREE MODEL (NO 402 ERROR)
          model: "arcee-ai/trinity-mini:free",
          temperature: 0.6,
          max_tokens: 500,
          messages: [
            {
              role: "system",
              content: `You are an AI coding assistant inside a real-time collaboration app.
Be concise, helpful, friendly and technical when needed.
Use emojis lightly for clarity 😊

Recent chat:
${chatContext}

Extra context:
${context || "None"}`,
            },
            { role: "user", content: message },
          ],
        }),
      }
    );

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error("OpenRouter error:", aiRes.status, err);

      return new Response(
        JSON.stringify({
          error: "AI provider error",
          detail: err,
        }),
        { status: aiRes.status, headers: corsHeaders }
      );
    }

    const aiData = await aiRes.json();
    const aiResponse =
      aiData?.choices?.[0]?.message?.content ||
      "AI could not generate a response.";

    /* ---------- SAVE MESSAGE ---------- */
    await supabase.from("collaboration_messages").insert({
      room_id: roomId,
      user_id: null,
      username: "AI Assistant",
      content: aiResponse,
      is_ai: true,
    });

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Collaboration AI fatal error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
