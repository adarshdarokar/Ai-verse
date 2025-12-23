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

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    /* ================= AUTH ================= */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!user || error) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    /* ================= MEMORY ================= */
    let memorySummary = "";

    if (sessionId) {
      const { data } = await supabase
        .from("chat_sessions")
        .select("memory_summary")
        .eq("id", sessionId)
        .single();

      memorySummary = data?.memory_summary || "";
    }

    /* ================= OPENROUTER ================= */
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    /* ================= FORMAT MESSAGES ================= */
    const formattedMessages: any[] = [];

    if (memorySummary) {
      formattedMessages.push({
        role: "system",
        content: `Conversation memory:\n${memorySummary}`,
      });
    }

    for (const m of messages) {
      if (m.image_url) {
        formattedMessages.push({
          role: m.role,
          content: [
            { type: "text", text: m.content },
            {
              type: "image_url",
              image_url: { url: m.image_url },
            },
          ],
        });
      } else {
        formattedMessages.push({
          role: m.role,
          content: m.content,
        });
      }
    }

    /* ================= AI CALL ================= */
    const aiRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "arcee-ai/trinity-mini:free",
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("OpenRouter Error:", errText);
      return new Response(JSON.stringify({ error: "AI Error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const aiData = await aiRes.json();
    const assistantReply =
      aiData?.choices?.[0]?.message?.content || "No response";

    /* ================= SAVE TO DB ================= */
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    if (sessionId) {
      const lastUserMessage = messages[messages.length - 1];

      await supabaseAuth.from("chat_messages").insert([
        {
          session_id: sessionId,
          role: "user",
          content: lastUserMessage.content,
          image_url: lastUserMessage.image_url || null,
        },
        {
          session_id: sessionId,
          role: "assistant",
          content: assistantReply,
        },
      ]);

      /* 🔥 AUTO CHAT TITLE (ONLY FIRST MESSAGE) */
      if (messages.length === 1) {
        const title = assistantReply
          .replace(/\n/g, " ")
          .slice(0, 40);

        await supabaseAuth
          .from("chat_sessions")
          .update({ title })
          .eq("id", sessionId);
      }

      await supabaseAuth
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    return new Response(
      JSON.stringify({ message: assistantReply }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("SERVER ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Server error" }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
