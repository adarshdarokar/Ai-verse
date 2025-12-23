import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Loader2,
  Download,
  RotateCcw,
  Sparkles,
  History,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function ImageGeneration() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [style, setStyle] = useState("Anime");

  const [isGenerating, setIsGenerating] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const [historyImages, setHistoryImages] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setImage(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-image",
        {
          body: {
            prompt: `${prompt}, style: ${style}, aspect ratio: ${ratio}`,
          },
        }
      );

      if (error) throw error;

      if (data?.imageBase64) {
        setImage(data.imageBase64);
        setHistoryImages((p) => [data.imageBase64, ...p]);
        toast.success("Image generated");
      }
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = "ai-image.png";
    a.click();
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#F6EEE5] via-[#EFE5DA] to-[#E7DACD] px-10 py-8 flex flex-col">

      {/* HEADER */}
      <div className="mb-6 flex items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#3E2F25]">
            AI Image Generator
          </h1>
          <p className="text-[#7A6A5C] text-sm mt-1">
            Premium AI-crafted visuals
          </p>
        </div>

        <div className="flex-1" />

        {/* HISTORY BUTTON */}
        <button
          onClick={() => setShowHistory(true)}
          className="
            flex items-center gap-2
            px-4 py-2
            rounded-xl
            bg-white/80
            backdrop-blur
            text-[#3E2F25]
            shadow-sm
            text-sm
          "
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      {/* PROMPT */}
      <div className="mb-4">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate…"
          className="
            bg-white
            text-[#3A2A1F]
            placeholder:text-[#9A7F67]
            rounded-2xl
            px-6 py-4
            text-base
            border border-[#dcc7b2]
            focus-visible:ring-0
            shadow-sm
          "
        />
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {["1:1", "3:4", "4:3", "16:9"].map((r) => (
          <button
            key={r}
            onClick={() => setRatio(r)}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              ratio === r
                ? "bg-[#5A3F32] text-white shadow"
                : "bg-white text-[#4A382C]"
            }`}
          >
            {r}
          </button>
        ))}

        <div className="w-px h-6 bg-[#d6c4b3]" />

        {["Photorealistic", "Cinematic", "Anime", "3D Render"].map((s) => (
          <button
            key={s}
            onClick={() => setStyle(s)}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              style === s
                ? "bg-[#5A3F32] text-white shadow"
                : "bg-white text-[#4A382C]"
            }`}
          >
            {s}
          </button>
        ))}

        <div className="flex-1" />

        <Button
          onClick={generateImage}
          disabled={isGenerating}
          className="
            bg-[#5A3F32]
            text-white
            px-8 py-3
            rounded-2xl
            hover:bg-[#5A3F32]
            shadow-md
          "
        >
          {isGenerating ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </>
          )}
        </Button>
      </div>

      {/* IMAGE AREA */}
      <div className="flex-1 rounded-[30px] bg-[#EDE1D6] p-6 shadow-2xl flex items-center justify-center">
        <div className="relative w-full max-w-[1100px] h-[65vh] rounded-2xl bg-gradient-to-br from-[#efe4d9] to-[#e1d3c5] flex items-center justify-center overflow-hidden">
          {!image && !isGenerating && (
            <span className="text-[#7A6A5C] text-sm">
              Generated image will appear here
            </span>
          )}

          {isGenerating && (
            <Loader2 className="animate-spin text-[#5A3F32]" />
          )}

          {image && (
            <>
              <img
                src={image}
                className="max-w-full max-h-full object-contain drop-shadow-2xl"
              />

              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={downloadImage}
                  className="px-4 py-2 rounded-xl bg-[#5A3F32] text-white text-xs flex items-center shadow"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>

                <button
                  onClick={generateImage}
                  className="px-4 py-2 rounded-xl bg-white text-[#4A382C] text-xs flex items-center shadow"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* HISTORY OVERLAY */}
      {showHistory && (
        <div className="absolute inset-0 bg-black/40 flex items-end">
          <div className="w-full bg-[#F6EEE5] p-6 rounded-t-3xl shadow-2xl">
            <div className="flex items-center mb-4">
              <h3 className="text-base font-semibold text-[#3E2F25]">
                Generation History
              </h3>

              <div className="flex-1" />

              {/* ✅ SMALL BLACK CUT BUTTON */}
              <button
                onClick={() => setShowHistory(false)}
                className="
                  w-7 h-7
                  rounded-full
                  bg-black
                  flex items-center justify-center
                "
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {historyImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  onClick={() => {
                    setImage(img);
                    setShowHistory(false);
                  }}
                  className="
                    h-28
                    aspect-square
                    rounded-xl
                    object-cover
                    cursor-pointer
                    shadow-md
                    hover:scale-105
                    transition
                  "
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
