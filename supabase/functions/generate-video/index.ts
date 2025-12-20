import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { prompt, action, predictionId, videoId } = body;
    console.log("Received video request:", { action, prompt, predictionId });

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      console.error("REPLICATE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Video service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get auth header and extract JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify user by passing the JWT token directly
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create authenticated client for database operations
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    // Handle status check
    if (action === "status" && predictionId) {
      console.log("Checking status for prediction:", predictionId);
      const prediction = await replicate.predictions.get(predictionId);
      console.log("Status:", prediction.status);

      // Update database if completed or failed
      if (videoId && (prediction.status === "succeeded" || prediction.status === "failed")) {
        const updateData: any = {
          status: prediction.status === "succeeded" ? "completed" : "failed",
        };
        
        if (prediction.status === "succeeded" && prediction.output) {
          updateData.video_url = prediction.output;
        }

        await supabaseAuth
          .from("generated_videos")
          .update(updateData)
          .eq("id", videoId);
      }

      return new Response(JSON.stringify({
        status: prediction.status,
        output: prediction.output,
        error: prediction.error,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle video generation
    if (!prompt || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Starting video generation for user:", user.id);

    // Create a video record first
    const { data: videoRecord, error: insertError } = await supabaseAuth
      .from("generated_videos")
      .insert({
        user_id: user.id,
        prompt: prompt,
        video_url: "",
        status: "processing",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating video record:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create video record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Start video generation with Replicate (using minimax video-01-live)
    const prediction = await replicate.predictions.create({
      model: "minimax/video-01-live",
      input: {
        prompt: prompt,
        prompt_optimizer: true,
      },
    });

    console.log("Prediction created:", prediction.id);

    // Update the video record with prediction ID
    await supabaseAuth
      .from("generated_videos")
      .update({ prediction_id: prediction.id })
      .eq("id", videoRecord.id);

    return new Response(JSON.stringify({
      videoId: videoRecord.id,
      predictionId: prediction.id,
      status: prediction.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Video generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
