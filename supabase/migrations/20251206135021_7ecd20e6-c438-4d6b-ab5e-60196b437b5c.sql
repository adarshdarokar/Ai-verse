
-- Create collaboration rooms table
CREATE TABLE public.collaboration_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_users INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collaboration members table
CREATE TABLE public.collaboration_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create collaboration invitations table
CREATE TABLE public.collaboration_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collaboration messages table
CREATE TABLE public.collaboration_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shared output table for real-time code execution results
CREATE TABLE public.collaboration_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  code TEXT NOT NULL,
  output TEXT NOT NULL,
  language TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.collaboration_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_outputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaboration_rooms
CREATE POLICY "Users can view rooms they are members of"
ON public.collaboration_rooms FOR SELECT
USING (
  auth.uid() = owner_id OR
  EXISTS (SELECT 1 FROM public.collaboration_members WHERE room_id = id AND user_id = auth.uid())
);

CREATE POLICY "Users can create rooms"
ON public.collaboration_rooms FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their rooms"
ON public.collaboration_rooms FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their rooms"
ON public.collaboration_rooms FOR DELETE
USING (auth.uid() = owner_id);

-- RLS Policies for collaboration_members
CREATE POLICY "Members can view room members"
ON public.collaboration_members FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.collaboration_rooms WHERE id = room_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.collaboration_members cm WHERE cm.room_id = room_id AND cm.user_id = auth.uid())))
);

CREATE POLICY "Room owners and members can add members"
ON public.collaboration_members FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.collaboration_rooms WHERE id = room_id AND owner_id = auth.uid()) OR
  auth.uid() = user_id
);

CREATE POLICY "Members can update their own status"
ON public.collaboration_members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Members can leave rooms"
ON public.collaboration_members FOR DELETE
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.collaboration_rooms WHERE id = room_id AND owner_id = auth.uid()));

-- RLS Policies for collaboration_invitations
CREATE POLICY "Users can view invitations sent to them or by them"
ON public.collaboration_invitations FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Room owners can create invitations"
ON public.collaboration_invitations FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.collaboration_rooms WHERE id = room_id AND owner_id = auth.uid())
);

CREATE POLICY "Invitees can update invitation status"
ON public.collaboration_invitations FOR UPDATE
USING (auth.uid() = invitee_id);

-- RLS Policies for collaboration_messages
CREATE POLICY "Room members can view messages"
ON public.collaboration_messages FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.collaboration_members WHERE room_id = collaboration_messages.room_id AND user_id = auth.uid())
);

CREATE POLICY "Room members can send messages"
ON public.collaboration_messages FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.collaboration_members WHERE room_id = collaboration_messages.room_id AND user_id = auth.uid()) OR
  is_ai = true
);

-- RLS Policies for collaboration_outputs
CREATE POLICY "Room members can view outputs"
ON public.collaboration_outputs FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.collaboration_members WHERE room_id = collaboration_outputs.room_id AND user_id = auth.uid())
);

CREATE POLICY "Room members can add outputs"
ON public.collaboration_outputs FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.collaboration_members WHERE room_id = collaboration_outputs.room_id AND user_id = auth.uid())
);

-- Enable realtime for all collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_outputs;

-- Add triggers for updated_at
CREATE TRIGGER update_collaboration_rooms_updated_at
BEFORE UPDATE ON public.collaboration_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaboration_invitations_updated_at
BEFORE UPDATE ON public.collaboration_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
