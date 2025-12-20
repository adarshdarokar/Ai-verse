import { useState, useEffect, useRef } from "react";
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
  status: string;
  prediction_id: string | null;
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
    const { data } = await supabase
      .from("generated_videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setVideos(data);
  };

  const generateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;

      toast.success("Video generation started!");
      setPrompt("");
      loadVideos();
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
    <div className="h-full flex bg-[#F1E7DD]">

      {/* MAIN PANEL */}
      <div className="
          flex-1 flex flex-col mx-6 my-6 rounded-2xl shadow-2xl overflow-hidden
        "
        style={{
          background: "linear-gradient(180deg, #F7EEE5, #EDE1D6)",
          border: "1px solid rgba(0,0,0,0.06)"
        }}
      >

        {/* HEADER */}
        <div className="px-10 py-8 border-b border-black/10">
          <h1 className="text-3xl font-semibold text-[#4A382C]">Video Generation</h1>
          <p className="text-[#7A6A5C] mt-1">
            Create high-quality AI-powered videos
          </p>
        </div>

        {/* INPUT BAR */}
        <form onSubmit={generateVideo} className="px-10 pt-8">
          <div className="flex gap-4">
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
                  Starting…
                </div>
              ) : "Generate"}
            </Button>
          </div>

          <p className="text-xs text-[#7A6A5C] mt-2">
            Video generation takes 2–5 minutes depending on complexity.
          </p>
        </form>

        {/* MAIN PREVIEW AREA */}
        <div className="flex-1 flex items-center justify-center p-10">

          {/* LOADING STATE */}
          {currentVideo?.status === "processing" && (
            <Card className="
                p-12 rounded-2xl bg-white/50 border border-white/40
                shadow-2xl backdrop-blur-xl text-center
              ">
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-[#6A4A3C]" />
              <h3 className="text-xl font-semibold text-[#4A382C]">
                Generating your video…
              </h3>
              <p className="text-[#7A6A5C] mt-2">Please wait</p>

              <Button
                onClick={loadVideos}
                variant="secondary"
                className="mt-6 bg-[#6A4A3C] text-white rounded-xl px-4 py-2 shadow"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </Card>
          )}

          {/* SUCCESS STATE */}
          {currentVideo?.status === "completed" && currentVideo.video_url && (
            <div className="relative max-w-4xl w-full group">
              <video
                src={currentVideo.video_url}
                controls
                className="w-full rounded-2xl shadow-2xl"
              />

              <Button
                onClick={() => downloadVideo(currentVideo.video_url)}
                className="
                  absolute top-4 right-4 px-4 py-2 rounded-xl bg-[#6A4A3C]
                  text-white shadow-lg opacity-0 group-hover:opacity-100 transition
                "
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}

          {/* EMPTY STATE */}
          {!currentVideo && (
            <Card className="
                p-12 rounded-2xl bg-white/50 border border-white/40
                shadow-xl backdrop-blur-xl text-center max-w-lg
              ">
              <Video className="w-16 h-16 mx-auto mb-4 text-[#B89A82]" />
              <h3 className="text-xl font-semibold text-[#4A382C]">
                Generate your first video
              </h3>
              <p className="text-[#7A6A5C] mt-2">
                Describe a scene and let AI animate it.
              </p>
            </Card>
          )}

          {/* FAILED STATE */}
          {currentVideo?.status === "failed" && (
            <Card className="
                p-12 rounded-2xl bg-white/50 border border-white/40
                shadow-xl backdrop-blur-xl text-center max-w-lg
              ">
              <Video className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold text-[#4A382C]">
                Video failed to generate
              </h3>
              <p className="text-[#7A6A5C] mt-2">
                Try again with a different prompt.
              </p>
            </Card>
          )}

        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="
          w-80 rounded-2xl my-6 mr-6 shadow-xl overflow-hidden
          bg-gradient-to-b from-[#F7EEE5] to-[#EDE1D6] border border-black/10
        ">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h3 className="font-semibold text-[#4A382C] text-lg">Recent Videos</h3>
          <Button onClick={loadVideos} variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4 text-[#4A382C]" />
          </Button>
        </div>

        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {videos.map((video) => (
              <Card
                key={video.id}
                onClick={() => setCurrentVideo(video)}
                className="
                  p-3 bg-white/60 shadow rounded-xl border border-white/40
                  hover:border-[#C7A583] cursor-pointer transition
                "
              >
                <div className="aspect-video bg-[#E8DCCF] rounded-xl mb-2 flex items-center justify-center shadow-inner">
                  {video.status === "processing" ? (
                    <Loader2 className="w-8 h-8 animate-spin text-[#6A4A3C]" />
                  ) : video.video_url ? (
                    <video
                      src={video.video_url}
                      muted
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Video className="w-8 h-8 text-[#7A6A5C]" />
                  )}
                </div>

                <p className="text-sm text-[#7A6A5C] truncate">{video.prompt}</p>

                <span className={`
                  text-xs px-2 py-1 rounded mt-1 inline-block
                  ${video.status === "completed" ? "bg-green-500/20 text-green-600" :
                    video.status === "processing" ? "bg-yellow-500/20 text-yellow-600" :
                    "bg-red-500/20 text-red-600"}
                `}>
                  {video.status}
                </span>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

    </div>
  );
};

export default VideoGeneration;
