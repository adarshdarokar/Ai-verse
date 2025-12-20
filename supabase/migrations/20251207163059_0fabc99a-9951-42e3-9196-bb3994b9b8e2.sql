-- Drop the problematic RLS policies that cause recursion
DROP POLICY IF EXISTS "Members can view room members" ON public.collaboration_members;
DROP POLICY IF EXISTS "Room owners and members can add members" ON public.collaboration_members;

-- Create security definer function to check room membership
CREATE OR REPLACE FUNCTION public.is_room_member(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collaboration_members
    WHERE user_id = _user_id
      AND room_id = _room_id
  )
$$;

-- Create security definer function to check room ownership
CREATE OR REPLACE FUNCTION public.is_room_owner(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collaboration_rooms
    WHERE id = _room_id
      AND owner_id = _user_id
  )
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Members can view room members"
ON public.collaboration_members
FOR SELECT
USING (
  public.is_room_owner(auth.uid(), room_id) OR 
  public.is_room_member(auth.uid(), room_id)
);

CREATE POLICY "Room owners and members can add members"
ON public.collaboration_members
FOR INSERT
WITH CHECK (
  public.is_room_owner(auth.uid(), room_id) OR 
  auth.uid() = user_id
);

-- Also fix collaboration_rooms SELECT policy which has similar issue
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON public.collaboration_rooms;

CREATE POLICY "Users can view rooms they are members of"
ON public.collaboration_rooms
FOR SELECT
USING (
  auth.uid() = owner_id OR 
  public.is_room_member(auth.uid(), id)
);