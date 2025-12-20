import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { InferenceClient } from "npm:@huggingface/inference";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 🔥 SAFE BASE64 CONVERTER (NO STACK OVERFLOW)
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + chunkSize)
    );
  }

  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ----------------------
    // AUTH CHECK
    // ----------------------
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
    } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // -------------------------------
    // ⭐ HUGGING FACE IMAGE GENERATION ⭐
    // -------------------------------
    const HF_API_KEY = Deno.env.get("HF_API_KEY");
    if (!HF_API_KEY) throw new Error("HF_API_KEY missing");

    const hf = new InferenceClient(HF_API_KEY);

    const imageBlob = await hf.textToImage({
      provider: "nscale",
      model: "stabilityai/stable-diffusion-xl-base-1.0",
      inputs: prompt,
      parameters: {
        num_inference_steps: 5,
      },
    });

    // ----------------------
    // BLOB → BASE64 (SAFE)
    // ----------------------
    const buffer = await imageBlob.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    const imageBase64 = `data:image/png;base64,${base64}`;

    // ----------------------
    // SAVE TO DB
    // ----------------------
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    await supabaseAuth.from("generated_images").insert({
      user_id: user.id,
      prompt,
      image_base64: imageBase64,
    });

    return new Response(
      JSON.stringify({ imageBase64 }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message || "Server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
