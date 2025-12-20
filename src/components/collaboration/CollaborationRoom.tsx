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
          className="w-full px-4 py-2 rounded-md border border-[#D8C0A8] 
                     bg-white/90 text-[#3A2A22] mb-4"
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} className="bg-white/80 text-[#4A382C]">
            Cancel
          </Button>
          <Button
            onClick={() => onSend(email)}
            disabled={!email.trim() || loading}
            className="bg-[#6A4A3C] text-white"
          >
            {loading ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- Notification Dropdown ---------------------- */
const NotificationDropdown = ({ open, invites, onAccept, onDecline, onClose }) => {
  if (!open) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 z-50 bg-[#F7EFE7] rounded-xl shadow-2xl border border-[#CBBBAA] p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#3A2B22]">Notifications</h3>
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
              <p className="text-xs text-[#6a5f55]">Room: {inv.room_name}</p>

              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => onAccept(inv)}
                  className="bg-[#6A4A3C] text-white px-3 py-1"
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecline(inv)}
                  className="bg-white px-3 py-1 text-[#4A382C]"
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

/* ---------------------- MAIN COMPONENT ---------------------- */
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

  /* ------------------ Initial Load ------------------ */
  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setCurrentUserId(auth.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", auth.user.id)
        .single();

      if (profile?.email) setCurrentUserEmail(profile.email.toLowerCase());

      const { data: room } = await supabase
        .from("collaboration_rooms")
        .select("name, owner_id")
        .eq("id", roomId)
        .single();

      setRoomInfo(room);

      const { data: membersData } = await supabase
        .from("collaboration_members")
        .select("*")
        .eq("room_id", roomId);

      setMembers(membersData || []);
    };

    load();
  }, [roomId]);

  /* ------------------ Load Pending Invites ------------------ */
  useEffect(() => {
    if (!currentUserEmail && !currentUserId) return;

    const loadPending = async () => {
      const { data } = await supabase
        .from("collaboration_invitations")
        .select("*")
        .or(
          `and(invitee_email.eq.${currentUserEmail},status.eq.pending),
           and(invitee_id.eq.${currentUserId},status.eq.pending)`
        );

      if (!data || data.length === 0) return;

      const mapped = await Promise.all(
        data.map(async (inv) => {
          const [{ data: room }, { data: inviter }] = await Promise.all([
            supabase.from("collaboration_rooms").select("name").eq("id", inv.room_id).single(),
            supabase.from("profiles").select("full_name, email").eq("id", inv.inviter_id).single(),
          ]);

          return {
            id: inv.id,
            room_id: inv.room_id,
            inviter_name:
              inviter?.full_name || inviter?.email?.split("@")[0] || "Someone",
            room_name: room?.name || "Room",
          };
        })
      );

      setInvites((prev) => [...mapped, ...prev]);
    };

    loadPending();
  }, [currentUserEmail, currentUserId]);

  /* ------------------ Realtime Invite Listener ------------------ */
  useEffect(() => {
    if (!currentUserEmail) return;

    const insert = supabase
      .channel("invite-insert")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "collaboration_invitations" },
        async (payload) => {
          const inv = payload.new;

          const emailMatch =
            inv.invitee_email &&
            inv.invitee_email.toLowerCase() === currentUserEmail;

          const idMatch =
            inv.invitee_id &&
            String(inv.invitee_id) === String(currentUserId);

          if (!emailMatch && !idMatch) return;

          const [{ data: room }, { data: inviter }] = await Promise.all([
            supabase.from("collaboration_rooms").select("name").eq("id", inv.room_id).single(),
            supabase.from("profiles").select("full_name, email").eq("id", inv.inviter_id).single(),
          ]);

          const inviteObj = {
            id: inv.id,
            room_id: inv.room_id,
            inviter_name:
              inviter?.full_name || inviter?.email?.split("@")[0] || "Someone",
            room_name: room?.name || "Room",
          };

          setInvites((prev) => [inviteObj, ...prev]);
          toast.info(`Invite from ${inviteObj.inviter_name}`);
        }
      )
      .subscribe();

    return () => insert.unsubscribe();
  }, [currentUserEmail, currentUserId]);

  /* ------------------ Send Invite ------------------ */
  const sendInvite = async (email) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return toast.error("Enter email");

    setInviteLoading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", trimmed);

      const payload = {
        room_id: roomId,
        inviter_id: auth.user.id,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      if (profile?.length) payload.invitee_id = profile[0].id;
      else payload.invitee_email = trimmed;

      await supabase.from("collaboration_invitations").insert(payload);

      toast.success(`Invite sent to ${trimmed}`);
      setInviteOpen(false);
    } catch (err) {
      toast.error("Failed to send invite");
    }

    setInviteLoading(false);
  };

  /* ------------------ Accept / Decline ------------------ */
  const acceptInvite = async (inv) => {
    const { data: auth } = await supabase.auth.getUser();

    await supabase.from("collaboration_members").upsert(
      {
        room_id: inv.room_id,
        user_id: auth.user.id,
        username: username,
        joined_at: new Date().toISOString(),
      },
      { onConflict: ["room_id", "user_id"] }
    );

    await supabase
      .from("collaboration_invitations")
      .update({ status: "accepted" })
      .eq("id", inv.id);

    setInvites((prev) => prev.filter((x) => x.id !== inv.id));
    toast.success("Joined the room");
  };

  const declineInvite = async (inv) => {
    await supabase
      .from("collaboration_invitations")
      .update({ status: "declined" })
      .eq("id", inv.id);

    setInvites((prev) => prev.filter((x) => x.id !== inv.id));
    toast.info("Declined");
  };

  /* ------------------ Leave Room ------------------ */
  const handleLeave = async () => {
    const { data: auth } = await supabase.auth.getUser();

    await supabase
      .from("collaboration_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", auth.user.id);

    toast.success("Left the room");
    onLeave && onLeave();
  };

  /* ------------------ Click Outside Notification ------------------ */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const mergedMembers = members.map((m) => ({
    ...m,
    isOnline: onlineUsers.has(m.username),
  }));

  const onlineCount = mergedMembers.filter((m) => m.isOnline).length;

  /* ------------------ UI ------------------ */
  return (
    <div className="h-screen flex flex-col bg-[#E8DCCF]">
      
      {/* Invite Modal */}
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSend={sendInvite}
        loading={inviteLoading}
      />

      {/* NAVBAR */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-[#CBBBAA]
        bg-gradient-to-r from-[#3A251C] via-[#4A2F23] to-[#2A1A14] text-[#EBD8C8]"
      >
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-[#4A2F23] border border-[#C7A583]/40">
            <Users className="h-5 w-5 text-[#EBD8C8]" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#F4E8DD]">
              {roomInfo?.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[#D6C7B7]">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-green-500" />
                </span>
                {onlineCount} online
              </span>
              • {members.length} members
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4 relative" ref={notifRef}>
          
          {/* Bell */}
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg bg-[#4A2F23] border border-[#A88C6D]"
          >
            <Bell className="h-5 w-5 text-[#EBD8C8]" />
            {invites.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs px-1">
                {invites.length}
              </span>
            )}
          </button>

          {/* Dropdown */}
          <NotificationDropdown
            open={notifOpen}
            invites={invites}
            onAccept={acceptInvite}
            onDecline={declineInvite}
            onClose={() => setNotifOpen(false)}
          />

          {/* Invite */}
          <Button
            size="sm"
            onClick={() => setInviteOpen(true)}
            className="bg-[#C7A583] text-[#3A2B22] border border-[#A88C6D]"
          >
            <UserPlus className="h-4 w-4" /> Invite
          </Button>

          {/* Leave */}
          <Button
            size="sm"
            onClick={handleLeave}
            className="bg-[#B89C7A] text-[#3A2B22] border border-[#A88C6D]"
          >
            <LogOut className="h-4 w-4 mr-2" /> Leave
          </Button>
        </div>
      </div>

      {/* Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
          <ActiveUsersList
            members={mergedMembers}
            currentUserId={currentUserId}
            ownerId={roomInfo?.owner_id}
          />
        </ResizablePanel>

        <ResizableHandle className="bg-[#CBBBAA]" withHandle />

        <ResizablePanel defaultSize={50} minSize={35}>
          <GroupChat roomId={roomId} username={username} />
        </ResizablePanel>

        <ResizableHandle className="bg-[#CBBBAA]" withHandle />

        <ResizablePanel defaultSize={32} minSize={25}>
          <SharedOutputPanel roomId={roomId} username={username} />
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
};

export default CollaborationRoom;
