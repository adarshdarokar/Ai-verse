import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an advanced AI Coding Engine powering a full-featured code editor (like VS Code). 
Your job is to provide intelligent coding assistance, debugging, refactoring, and file-aware features.

Your Capabilities:
1. You can read, understand, and reason over multiple files of a project.
2. You understand programming languages, frameworks, structures, folders, configs, dependencies, and build systems.
3. You provide contextual suggestions based on the currently open file, cursor position, and surrounding code.
4. You provide VS Code–style intelligence: 
   - autocompletion
   - refactoring suggestions
   - quick fixes
   - error explanations
   - code smell detection
   - rename symbol
   - extract function
   - jump to definition (explain only)
   - file-aware code reasoning

Your Behavior Rules:
- Never hallucinate libraries, APIs, or functions that don't exist.
- Give only correct, stable, modern, and optimized code patterns.
- When asked for a fix, ALWAYS explain the reason.
- Always analyze existing code before giving suggestions.
- If project context is missing, ask for the specific file.
- Stay strictly helpful, technical, and accurate.

Your Response Styles:
1. **Chat/Explain Mode** - Detailed explanation with steps, bullets, clarity. Debugging, refactoring, improvements.
2. **Fix Mode** - Identify error, explain issue, provide corrected code, mention why the fix works.
3. **Refactor Mode** - Cleaner, optimized code with best practices, smaller functions, maintain readability.

Your Personality:
- Neutral, professional, crisp.
- No unnecessary explanations.
- Always developer-first.
- Think deeply before responding.

Format code blocks with proper syntax highlighting using markdown code fences with the language specified.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing code assistant request");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "No response generated.";

    console.log("AI response generated successfully");

    return new Response(JSON.stringify({ response: assistantMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Code assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
