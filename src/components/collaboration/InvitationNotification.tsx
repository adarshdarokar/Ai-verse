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

  /* ================= LOAD INVITES ================= */

  useEffect(() => {
    let mounted = true;

    const loadInvites = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user || !mounted) return;

      const user = auth.user;
      const email = user.email?.toLowerCase();

      const { data, error } = await supabase
        .from("collaboration_invitations")
        .select(
          `
          id,
          room_id,
          inviter_id,
          invitee_id,
          invitee_email,
          collaboration_rooms ( name )
        `
        )
        .or(
          `invitee_id.eq.${user.id}${
            email ? `,invitee_email.eq.${email}` : ""
          }`
        )
        .eq("status", "pending");

      if (error || !data || !mounted) return;

      const mapped: Invitation[] = await Promise.all(
        data.map(async (inv: any) => {
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

      // 🔒 strong dedupe
      setInvites((prev) => {
        const map = new Map<string, Invitation>();
        [...mapped, ...prev].forEach((i) => map.set(i.id, i));
        return Array.from(map.values());
      });
    };

    loadInvites();
    return () => {
      mounted = false;
    };
  }, []);

  /* ================= AUTH RESET ================= */

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setInvites([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ================= REALTIME LISTENER ================= */

  useEffect(() => {
    let channel: any;

    const subscribe = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      const user = auth.user;
      const email = user.email?.toLowerCase();

      channel = supabase
        .channel(`invites-${user.id}`)
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
              email &&
              inv.invitee_email.toLowerCase() === email;

            const idMatch = inv.invitee_id === user.id;
            if (!emailMatch && !idMatch) return;

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

            const inviteObj: Invitation = {
              id: inv.id,
              room_id: inv.room_id,
              inviter_id: inv.inviter_id,
              room_name: room?.name || "Room",
              inviter_name:
                inviter?.full_name ||
                inviter?.email?.split("@")[0] ||
                "Someone",
            };

            setInvites((prev) =>
              prev.some((x) => x.id === inviteObj.id)
                ? prev
                : [inviteObj, ...prev]
            );

            toast.info("New collaboration invite");
          }
        )
        .subscribe();
    };

    subscribe();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  /* ================= ACCEPT / DECLINE ================= */

  const respond = async (inv: Invitation, accept: boolean) => {
    setLoadingId(inv.id);

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      if (accept) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name,email")
          .eq("id", auth.user.id)
          .single();

        await supabase
          .from("collaboration_members")
          .upsert(
            {
              room_id: inv.room_id,
              user_id: auth.user.id,
              username:
                profile?.full_name ||
                profile?.email?.split("@")[0] ||
                "User",
              joined_at: new Date().toISOString(),
            },
            { onConflict: ["room_id", "user_id"] }
          );
      }

      await supabase
        .from("collaboration_invitations")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", inv.id);

      setInvites((prev) => prev.filter((x) => x.id !== inv.id));

      if (accept) {
        toast.success("Joined room");
        onAccept(inv.room_id);

        // 🔥 GLOBAL SYNC (CollaborationRoom listens to this)
        window.dispatchEvent(
          new CustomEvent("collaboration:joined", {
            detail: { roomId: inv.room_id },
          })
        );
      } else {
        toast.info("Invite declined");
      }
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
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
