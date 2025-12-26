import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const HF_MODEL =
  "https://router.huggingface.co/hf-inference/models/ali-vilab/text-to-video-ms-1.7b";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let videoRowId: string | null = null;

  try {
    /* ---------- INPUT ---------- */
    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* ---------- AUTH ---------- */
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");

    /* ---------- SUPABASE (SERVICE ROLE) ---------- */
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(jwt);

    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized user" }),
        { status: 401, headers: corsHeaders }
      );
    }

    /* ---------- DB INSERT (processing) ---------- */
    const { data: videoRow, error: insertErr } = await supabase
      .from("generated_videos")
      .insert({
        user_id: user.id,
        prompt,
        status: "processing",
        video_url: "",
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    videoRowId = videoRow.id;

    /* ---------- HUGGING FACE ---------- */
    const HF_API_KEY = Deno.env.get("HF_API_KEY");
    if (!HF_API_KEY) throw new Error("HF_API_KEY missing");

    const hfRes = await fetch(HF_MODEL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "video/mp4",
        "x-use-cache": "false", // important for router
      },
      body: JSON.stringify({
        inputs: prompt,
      }),
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      await supabase
        .from("generated_videos")
        .update({ status: "failed" })
        .eq("id", videoRowId);

      throw new Error(errText);
    }

    /* ---------- VIDEO UPLOAD ---------- */
    const videoBuffer = await hfRes.arrayBuffer();
    const fileName = `${crypto.randomUUID()}.mp4`;

    await supabase.storage.from("videos").upload(fileName, videoBuffer, {
      contentType: "video/mp4",
      upsert: false,
    });

    const { data: publicUrl } = supabase.storage
      .from("videos")
      .getPublicUrl(fileName);

    /* ---------- DB UPDATE (completed) ---------- */
    await supabase
      .from("generated_videos")
      .update({
        status: "completed",
        video_url: publicUrl.publicUrl,
      })
      .eq("id", videoRowId);

    /* ---------- RESPONSE ---------- */
    return new Response(
      JSON.stringify({
        videoId: videoRowId,
        status: "completed",
        video_url: publicUrl.publicUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("VIDEO ERROR:", err);

    if (videoRowId) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        await supabase
          .from("generated_videos")
          .update({ status: "failed" })
          .eq("id", videoRowId);
      } catch {}
    }

    return new Response(
      JSON.stringify({ error: "Video generation failed" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
