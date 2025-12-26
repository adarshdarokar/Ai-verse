import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Video, Download, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GeneratedVideo {
  id: string;
  prompt: string;
  video_url: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
}

const VideoGeneration = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    const { data, error } = await supabase
      .from("generated_videos")
      .select("id,prompt,video_url,status,created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVideos(data);
      if (!currentVideo && data.length > 0) {
        setCurrentVideo(data[0]);
      }
    }
  };

  const generateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("generate-video", {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;

      toast.success("Video generation started");
      setPrompt("");
      await loadVideos();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate video");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVideo = (videoUrl: string) => {
    window.open(videoUrl, "_blank");
  };

  return (
    <div className="h-full w-full bg-[#F1E7DD]">
      <div className="h-full flex flex-col lg:flex-row gap-4 p-4 max-w-[1440px] mx-auto">

        {/* ================= MAIN PANEL ================= */}
        <div
          className="flex-1 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #F7EEE5, #EDE1D6)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {/* HEADER */}
          <div className="px-6 md:px-10 py-6 border-b border-black/10">
            <h1 className="text-2xl md:text-3xl font-semibold text-[#4A382C]">
              Video Generation
            </h1>
            <p className="text-sm md:text-base text-[#7A6A5C] mt-1">
              Create high-quality AI-powered videos
            </p>
          </div>

          {/* INPUT BAR */}
          <form onSubmit={generateVideo} className="px-6 md:px-10 pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to generate..."
                className="
                  flex-1 bg-white/70 rounded-xl px-6 py-4 border-none shadow-xl
                  placeholder:text-[#8D7D6D] text-[#3A2A1F] focus-visible:ring-0
                "
              />

              <Button
                disabled={!prompt.trim() || isGenerating}
                className="
                  px-8 py-4 rounded-xl shadow-xl text-white
                  bg-gradient-to-br from-[#6A4A3C] to-[#543A2D]
                  hover:opacity-90 transition
                "
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating…
                  </div>
                ) : (
                  "Generate"
                )}
              </Button>
            </div>

            <p className="text-xs text-[#7A6A5C] mt-2">
              Video generation may take up to 1–2 minutes.
            </p>
          </form>

          {/* MAIN PREVIEW */}
          <div className="flex-1 flex items-center justify-center p-6 md:p-10">
            {currentVideo?.status === "processing" && (
              <Card className="p-8 md:p-12 rounded-2xl bg-white/50 shadow-xl text-center">
                <Loader2 className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 animate-spin text-[#6A4A3C]" />
                <h3 className="text-lg md:text-xl font-semibold text-[#4A382C]">
                  Generating your video…
                </h3>
              </Card>
            )}

            {currentVideo?.status === "completed" && currentVideo.video_url && (
              <div className="relative w-full max-w-4xl aspect-video">
                <video
                  src={currentVideo.video_url}
                  controls
                  className="w-full h-full object-contain rounded-2xl shadow-2xl bg-black/5"
                />
                <Button
                  onClick={() => downloadVideo(currentVideo.video_url)}
                  className="absolute top-4 right-4 bg-[#6A4A3C] text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            )}

            {!currentVideo && (
              <Card className="p-8 md:p-12 rounded-2xl bg-white/50 text-center">
                <Video className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 text-[#B89A82]" />
                <h3 className="text-lg md:text-xl font-semibold text-[#4A382C]">
                  Generate your first video
                </h3>
              </Card>
            )}
          </div>
        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="w-full lg:w-80 rounded-2xl shadow-xl bg-[#F7EEE5] flex flex-col">
          <div className="p-4 border-b flex justify-between">
            <h3 className="font-semibold text-[#4A382C]">
              Recent Videos
            </h3>
            <Button onClick={loadVideos} variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4 space-y-4">
            {videos.map((video) => (
              <Card
                key={video.id}
                onClick={() => setCurrentVideo(video)}
                className="p-3 cursor-pointer hover:bg-black/5 transition"
              >
                <p className="text-sm truncate">
                  {video.prompt}
                </p>
                <span className="text-xs text-[#7A6A5C]">
                  {video.status}
                </span>
              </Card>
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration;
