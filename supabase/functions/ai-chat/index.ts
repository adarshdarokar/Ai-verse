import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const { messages, sessionId } = await req.json();

    // -----------------------------
    // OPENROUTER KEY (FREE MODEL)
    // -----------------------------
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Authorization check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: { user }, error: authError } =
      await supabase.auth.getUser(token);

    if (!user || authError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // -----------------------------
    // CALL OPENROUTER FREE MODEL
    // -----------------------------
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "arcee-ai/trinity-mini:free",
        messages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("OpenRouter error:", text);
      return new Response(JSON.stringify({ error: "AI Error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const aiData = await aiRes.json();
    const assistantReply =
      aiData?.choices?.[0]?.message?.content || "No response";

    // -----------------------------
    // SAVE TO DATABASE
    // -----------------------------
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    if (sessionId) {
      await supabaseAuth.from("chat_messages").insert({
        session_id: sessionId,
        role: "user",
        content: messages[messages.length - 1].content,
      });

      await supabaseAuth.from("chat_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: assistantReply,
      });

      await supabaseAuth
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    return new Response(JSON.stringify({ message: assistantReply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
