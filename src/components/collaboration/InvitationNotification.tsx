import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Check, X } from "lucide-react";
import { toast } from "sonner";

/* ================= TYPES ================= */

interface Invitation {
  id: string;
  room_id: string;
  inviter_id: string;
  room_name: string;
  inviter_name: string;
}

interface Props {
  onAccept: (roomId: string) => void;
}

/* ================= COMPONENT ================= */

export const InvitationNotification = ({ onAccept }: Props) => {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  /* ================= LOAD EXISTING INVITES ================= */

  useEffect(() => {
    const loadInvites = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      const user = data.user;

      // ✅ 1. By invitee_id
      const { data: byId } = await supabase
        .from("collaboration_invitations")
        .select(
          `
          id,
          room_id,
          inviter_id,
          collaboration_rooms ( name )
        `
        )
        .eq("invitee_id", user.id)
        .eq("status", "pending");

      // ✅ 2. By invitee_email (ONLY if email exists)
      const { data: byEmail } = user.email
        ? await supabase
            .from("collaboration_invitations")
            .select(
              `
              id,
              room_id,
              inviter_id,
              collaboration_rooms ( name )
            `
            )
            .eq("invitee_email", user.email.toLowerCase())
            .eq("status", "pending")
        : { data: [] };

      const rows = [...(byId || []), ...(byEmail || [])];
      if (rows.length === 0) return;

      const mapped: Invitation[] = await Promise.all(
        rows.map(async (inv: any) => {
          const { data: inviter } = await supabase
            .from("profiles")
            .select("full_name,email")
            .eq("id", inv.inviter_id)
            .single();

          return {
            id: inv.id,
            room_id: inv.room_id,
            inviter_id: inv.inviter_id,
            room_name: inv.collaboration_rooms?.name || "Room",
            inviter_name:
              inviter?.full_name ||
              inviter?.email?.split("@")[0] ||
              "Someone",
          };
        })
      );

      setInvites(mapped);
    };

    loadInvites();
  }, []);

  /* ================= REALTIME ================= */

  useEffect(() => {
    let channel: any;

    const subscribe = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      const user = data.user;

      channel = supabase
        .channel(`invite-realtime-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "collaboration_invitations",
          },
          async ({ new: inv }: any) => {
            if (inv.status !== "pending") return;

            const emailMatch =
              inv.invitee_email &&
              user.email &&
              inv.invitee_email.toLowerCase() ===
                user.email.toLowerCase();

            const idMatch = inv.invitee_id === user.id;
            if (!emailMatch && !idMatch) return;

            // 🛑 duplicate guard
            setInvites((prev) => {
              if (prev.some((x) => x.id === inv.id)) return prev;
              return prev;
            });

            const [{ data: room }, { data: inviter }] = await Promise.all([
              supabase
                .from("collaboration_rooms")
                .select("name")
                .eq("id", inv.room_id)
                .single(),
              supabase
                .from("profiles")
                .select("full_name,email")
                .eq("id", inv.inviter_id)
                .single(),
            ]);

            setInvites((prev) => [
              {
                id: inv.id,
                room_id: inv.room_id,
                inviter_id: inv.inviter_id,
                room_name: room?.name || "Room",
                inviter_name:
                  inviter?.full_name ||
                  inviter?.email?.split("@")[0] ||
                  "Someone",
              },
              ...prev,
            ]);

            toast.info("New collaboration invite");
          }
        )
        .subscribe();
    };

    subscribe();
    return () => channel && supabase.removeChannel(channel);
  }, []);

  /* ================= ACCEPT / DECLINE ================= */

  const respond = async (inv: Invitation, accept: boolean) => {
    setLoadingId(inv.id);

    try {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      if (accept) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name,email")
          .eq("id", data.user.id)
          .single();

        await supabase.from("collaboration_members").upsert({
          room_id: inv.room_id,
          user_id: data.user.id,
          username:
            profile?.full_name ||
            profile?.email?.split("@")[0] ||
            "User",
        });
      }

      await supabase
        .from("collaboration_invitations")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", inv.id);

      setInvites((p) => p.filter((x) => x.id !== inv.id));

      accept
        ? (toast.success("Joined room"), onAccept(inv.room_id))
        : toast.info("Invite declined");
    } catch {
      toast.error("Action failed");
    } finally {
      setLoadingId(null);
    }
  };

  /* ================= UI ================= */

  if (invites.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
      {invites.map((inv) => (
        <Card key={inv.id} className="shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex gap-2">
              <Users className="h-4 w-4" />
              Collaboration Invite
            </CardTitle>
            <CardDescription className="text-xs">
              <b>{inv.inviter_name}</b> invited you to{" "}
              <b>{inv.room_name}</b>
            </CardDescription>
          </CardHeader>

          <CardContent className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={loadingId === inv.id}
              onClick={() => respond(inv, true)}
            >
              <Check className="h-3 w-3 mr-1" /> Accept
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={loadingId === inv.id}
              onClick={() => respond(inv, false)}
            >
              <X className="h-3 w-3 mr-1" /> Decline
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
