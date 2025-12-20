import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import { toast } from "sonner";
import { Loader2, Image as ImageIcon, Download } from "lucide-react";

interface GeneratedImage {
  id: string;
  prompt: string;
  image_base64: string;
  created_at: string;
}

const ImageGeneration = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  useEffect(() => {
    loadImages();
  }, []);

  // ✅ RLS SAFE
  const loadImages = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) setImages(data);
  };

  const generateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setCurrentImage(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-image",
        { body: { prompt } }
      );

      if (error) throw error;

      if (data?.imageBase64) {
        setCurrentImage(data.imageBase64);
        toast.success("Image generated!");
        loadImages();
        setPrompt("");
      }
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex bg-[#F1E7DD]">

      {/* MAIN */}
      <div className="flex-1 flex flex-col mx-6 my-6 rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #F7EEE5, #EDE1D6)",
        }}
      >
        {/* HEADER */}
        <div className="px-10 py-8 border-b border-black/10">
          <h1 className="text-3xl font-semibold text-[#4A382C]">
            Image Generation
          </h1>
          <p className="text-[#7A6A5C]">
            Create premium AI-powered images
          </p>
        </div>

        {/* INPUT */}
        <form onSubmit={generateImage} className="px-10 pt-8">
          <div className="flex gap-4">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want..."
              className="
                flex-1 bg-white/80 rounded-2xl px-6 py-4
                shadow-xl text-[#3A2A1F]
                caret-[#3A2A1F]
              "
            />
            <Button
              disabled={!prompt.trim() || isGenerating}
              className="px-10 py-4 rounded-2xl bg-[#6A4A3C] text-white"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : "Generate"}
            </Button>
          </div>
        </form>

        {/* IMAGE PREVIEW */}
        <div className="flex-1 flex items-center justify-center p-10">
          {!isGenerating && currentImage && (
            <div className="relative w-full max-w-4xl bg-[#EFE6DC] rounded-3xl p-6 shadow-2xl">
              <div className="h-[60vh] flex items-center justify-center overflow-hidden rounded-2xl bg-[#E6DDD3]">
                <img
                  src={currentImage}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <Button
                onClick={() => window.open(currentImage, "_blank")}
                className="
                  absolute top-6 right-6
                  px-4 py-2 rounded-xl
                  bg-[#6A4A3C]/90 text-white
                  text-sm
                "
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="w-80 my-6 mr-6 rounded-3xl shadow-xl bg-[#F7EEE5]">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-[#4A382C]">
            Recent Generations
          </h3>
        </div>

        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {images.map((img) => (
              <Card
                key={img.id}
                onClick={() => setCurrentImage(img.image_base64)}
                className="p-3 bg-white/70 rounded-2xl cursor-pointer"
              >
                <img
                  src={img.image_base64}
                  className="w-full aspect-square object-cover rounded-xl"
                />
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ImageGeneration;
