import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Users, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StartCollaborationFormProps {
  onRoomCreated: (roomId: string, username: string) => void;
}

export const StartCollaborationForm = ({
  onRoomCreated,
}: StartCollaborationFormProps) => {
  const [username, setUsername] = useState('');
  const [projectName, setProjectName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /* ---------------- ADD EMAIL ---------------- */
  const addEmail = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    if (invitedEmails.includes(email)) {
      toast.error('Email already added');
      return;
    }

    if (invitedEmails.length >= 3) {
      toast.error('Max 3 invites allowed');
      return;
    }

    setInvitedEmails((prev) => [...prev, email]);
    setInviteEmail('');
  };

  const removeEmail = (email: string) => {
    setInvitedEmails((prev) => prev.filter((e) => e !== email));
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const safeUsername = username.trim();

    if (!safeUsername || !projectName.trim()) {
      toast.error('All fields required');
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in.');
        return;
      }

      /* 🔥 FIX: prevent duplicate room by same owner + name */
      const { data: existingRoom } = await supabase
        .from('collaboration_rooms')
        .select('id')
        .eq('owner_id', user.id)
        .eq('name', projectName.trim())
        .maybeSingle();

      if (existingRoom) {
        toast.error('Project with same name already exists');
        return;
      }

      /* CREATE ROOM */
      const { data: room, error: roomError } = await supabase
        .from('collaboration_rooms')
        .insert({
          name: projectName.trim(),
          owner_id: user.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      /* 🔥 FIX: OWNER AS MEMBER (UPSERT, NOT INSERT) */
      await supabase
        .from('collaboration_members')
        .upsert(
          {
            room_id: room.id,
            user_id: user.id,
            username: safeUsername,
          },
          { onConflict: ['room_id', 'user_id'] }
        );

      /* SEND INVITES (SAFE) */
      for (const email of invitedEmails) {
        const safeEmail = email.toLowerCase();

        const { data: existing } = await supabase
          .from('collaboration_invitations')
          .select('id')
          .eq('room_id', room.id)
          .eq('invitee_email', safeEmail)
          .eq('status', 'pending')
          .maybeSingle();

        if (existing) continue;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', safeEmail)
          .single();

        await supabase.from('collaboration_invitations').insert({
          room_id: room.id,
          inviter_id: user.id,
          invitee_email: safeEmail,
          invitee_id: profile?.id || null,
          status: 'pending',
        });
      }

      toast.success('Room created!');

      /* 🔥 FIX: guaranteed redirect consistency */
      onRoomCreated(room.id, safeUsername);

    } catch (err) {
      console.error(err);
      toast.error('Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- UI (UNCHANGED) ---------------- */
  return (
    <Card
      className="
        w-full max-w-md mx-auto 
        bg-[#FAF3EB]/80 
        border border-[#E8D8C8]
        shadow-xl 
        rounded-2xl 
        backdrop-blur-xl
      "
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#4A382C] text-2xl font-semibold">
          <Users className="h-5 w-5 text-[#6A4A3C]" />
          Start Collaboration
        </CardTitle>

        <CardDescription className="text-[#7A6A5C]">
          Create a collaboration room and invite up to 3 users
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* USERNAME */}
          <div className="space-y-2">
            <Label className="text-[#4A382C]">Your Username</Label>
            <Input
              placeholder="Enter your display name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="
                bg-white border-[#D8C6B5]
                text-[#3B2A21] rounded-xl
                focus-visible:ring-[#6A4A3C]
              "
            />
          </div>

          {/* PROJECT NAME */}
          <div className="space-y-2">
            <Label className="text-[#4A382C]">Project Name</Label>
            <Input
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="
                bg-white border-[#D8C6B5]
                text-[#3B2A21] rounded-xl
                focus-visible:ring-[#6A4A3C]
              "
            />
          </div>

          {/* INVITES */}
          <div className="space-y-2">
            <Label className="text-[#4A382C]">Invite Users (Optional)</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addEmail())
                }
                className="
                  bg-white border-[#D8C6B5]
                  text-[#3B2A21] rounded-xl
                  focus-visible:ring-[#6A4A3C]
                "
              />

              <Button
                type="button"
                onClick={addEmail}
                className="bg-[#6A4A3C] text-white rounded-xl shadow"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* EMAIL BADGES */}
          {invitedEmails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {invitedEmails.map((email) => (
                <Badge
                  key={email}
                  className="
                    bg-[#E8D6C5] text-[#4A382C] 
                    rounded-lg px-3 py-1
                    flex items-center gap-1
                  "
                >
                  {email}
                  <button
                    onClick={() => removeEmail(email)}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* SUBMIT */}
          <Button
            type="submit"
            disabled={isLoading}
            className="
              w-full py-3 
              bg-gradient-to-br from-[#6A4A3C] to-[#4A3328]
              text-white rounded-xl
              shadow-lg text-md
            "
          >
            {isLoading ? 'Creating...' : 'Start Collaboration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
