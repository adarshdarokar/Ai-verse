-- Create generated_videos table
CREATE TABLE public.generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  video_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  prediction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated videos"
  ON public.generated_videos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generated videos"
  ON public.generated_videos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated videos"
  ON public.generated_videos
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated videos"
  ON public.generated_videos
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_generated_videos_updated_at
  BEFORE UPDATE ON public.generated_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();