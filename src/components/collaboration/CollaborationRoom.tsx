// CollaborationRoom.jsx
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActiveUsersList } from "./ActiveUsersList";
import { GroupChat } from "./GroupChat";
import { SharedOutputPanel } from "./SharedOutputPanel";
import { Button } from "@/components/ui/button";
import { LogOut, Users, UserPlus, Bell, X } from "lucide-react";
import { toast } from "sonner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

/* ---------------------- Invite Modal ---------------------- */
const InviteModal = ({ open, onClose, onSend, loading }) => {
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!open) setEmail("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-[420px] rounded-2xl bg-[#F7EFE7] p-6 shadow-2xl border border-[#D8C0A8]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#3C2E25]">
            Invite by email
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
            <X className="w-4 h-4 text-[#5A4336]" />
          </button>
        </div>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="w-full px-4 py-2 rounded-md border border-[#D8C0A8] bg-white/90 text-[#3A2A22] mb-4"
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSend(email)}
            disabled={!email.trim() || loading}
          >
            {loading ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- Notification Dropdown ---------------------- */
const NotificationDropdown = ({
  open,
  invites,
  onAccept,
  onDecline,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 z-50 bg-[#F7EFE7] rounded-xl shadow-2xl border border-[#CBBBAA] p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#3A2B22]">
          Notifications
        </h3>
        <button onClick={onClose}>
          <X className="h-4 w-4 text-[#4A382C]" />
        </button>
      </div>

      {invites.length === 0 ? (
        <p className="text-xs text-[#6b6258]">No new invites</p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="p-3 rounded-lg bg-white border border-[#D8C0A8]"
            >
              <p className="text-sm font-medium text-[#3A2B22]">
                {inv.inviter_name} invited you
              </p>
              <p className="text-xs text-[#6a5f55]">
                Room: {inv.room_name}
              </p>

              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => onAccept(inv)}>
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecline(inv)}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------------- MAIN ---------------------- */
export const CollaborationRoom = ({ roomId, username, onLeave }) => {
  const [members, setMembers] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invites, setInvites] = useState([]);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  /* ------------------ MEMBERS ------------------ */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from("collaboration_members")
      .select("*")
      .eq("room_id", roomId);

    setMembers(data || []);
  };

  /* ------------------ INIT ------------------ */
  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setCurrentUserId(auth.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", auth.user.id)
        .single();

      setCurrentUserEmail(profile?.email?.toLowerCase() || null);

      const { data: room } = await supabase
        .from("collaboration_rooms")
        .select("name, owner_id")
        .eq("id", roomId)
        .single();

      setRoomInfo(room);
      fetchMembers();
    };

    init();
  }, [roomId]);

  /* ------------------ INVITES (LOAD + REALTIME) ------------------ */
  useEffect(() => {
    if (!currentUserId && !currentUserEmail) return;

    const load = async () => {
      const { data } = await supabase
        .from("collaboration_invitations")
        .select("*")
        .or(
          `invitee_id.eq.${currentUserId},invitee_email.eq.${currentUserEmail}`
        )
        .eq("status", "pending");

      if (!data) return;

      const mapped = await Promise.all(
        data.map(async (inv) => {
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

          return {
            ...inv,
            room_name: room?.name || "Room",
            inviter_name:
              inviter?.full_name ||
              inviter?.email?.split("@")[0] ||
              "Someone",
          };
        })
      );

      setInvites(mapped);
    };

    load();

    const channel = supabase
      .channel(`invite-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "collaboration_invitations",
        },
        (payload) => {
          const inv = payload.new;
          if (
            inv.invitee_id === currentUserId ||
            inv.invitee_email?.toLowerCase() === currentUserEmail
          ) {
            load();
            toast.info("New collaboration invite");
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUserId, currentUserEmail]);

  /* ------------------ PRESENCE ------------------ */
  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const channel = supabase.channel(`presence-${roomId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineUsers(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: currentUserId });
        }
      });

    return () => supabase.removeChannel(channel);
  }, [roomId, currentUserId]);

  /* ------------------ MEMBERS REALTIME ------------------ */
  useEffect(() => {
    const ch = supabase
      .channel(`members-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "collaboration_members",
          filter: `room_id=eq.${roomId}`,
        },
        fetchMembers
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [roomId]);

  /* ------------------ INVITE ACTIONS ------------------ */
  const sendInvite = async (email) => {
    setInviteLoading(true);
    await supabase.from("collaboration_invitations").insert({
      room_id: roomId,
      inviter_id: currentUserId,
      invitee_email: email.toLowerCase(),
      status: "pending",
    });
    setInviteLoading(false);
    setInviteOpen(false);
    toast.success("Invite sent");
  };

  const acceptInvite = async (inv) => {
    await supabase.from("collaboration_members").upsert(
      {
        room_id: inv.room_id,
        user_id: currentUserId,
        username,
        joined_at: new Date().toISOString(),
      },
      { onConflict: ["room_id", "user_id"] }
    );

    await supabase
      .from("collaboration_invitations")
      .update({ status: "accepted" })
      .eq("id", inv.id);

    setInvites((p) => p.filter((i) => i.id !== inv.id));
    fetchMembers();

    window.dispatchEvent(
      new CustomEvent("collaboration:joined", {
        detail: { roomId: inv.room_id },
      })
    );

    toast.success("Joined room");
  };

  const declineInvite = async (inv) => {
    await supabase
      .from("collaboration_invitations")
      .update({ status: "declined" })
      .eq("id", inv.id);

    setInvites((p) => p.filter((i) => i.id !== inv.id));
  };

  const mergedMembers = members.map((m) => ({
    ...m,
    isOnline: onlineUsers.has(String(m.user_id)),
  }));

  /* ------------------ UI ------------------ */
  return (
    <div className="h-screen flex flex-col bg-[#E8DCCF]">
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSend={sendInvite}
        loading={inviteLoading}
      />

      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CBBBAA] bg-gradient-to-r from-[#3A251C] via-[#4A2F23] to-[#2A1A14] text-[#EBD8C8]">
        <div className="flex items-center gap-4">
          <Users className="h-5 w-5" />
          <div>
            <h2 className="text-lg font-semibold">{roomInfo?.name}</h2>
            <div className="text-xs">
              {mergedMembers.filter((m) => m.isOnline).length} online •{" "}
              {members.length} members
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg bg-[#4A2F23]"
          >
            <Bell className="h-5 w-5" />
            {invites.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs px-1">
                {invites.length}
              </span>
            )}
          </button>

          <NotificationDropdown
            open={notifOpen}
            invites={invites}
            onAccept={acceptInvite}
            onDecline={declineInvite}
            onClose={() => setNotifOpen(false)}
          />

          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite
          </Button>

          <Button size="sm" onClick={onLeave}>
            <LogOut className="h-4 w-4 mr-2" /> Leave
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={18}>
          <ActiveUsersList
            members={mergedMembers}
            currentUserId={currentUserId}
            ownerId={roomInfo?.owner_id}
          />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50}>
          <GroupChat roomId={roomId} username={username} />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={32}>
          <SharedOutputPanel roomId={roomId} username={username} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default CollaborationRoom;
