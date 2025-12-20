import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StartCollaborationForm } from '@/components/collaboration/StartCollaborationForm';
import { CollaborationRoom } from '@/components/collaboration/CollaborationRoom';
import { InvitationNotification } from '@/components/collaboration/InvitationNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, ArrowRight } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  owner_id: string;
  member_count: number;
  username: string;
}

const Collaboration = () => {
  const [currentRoom, setCurrentRoom] = useState<{ id: string; username: string } | null>(null);
  const [existingRooms, setExistingRooms] = useState<Room[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* ---------------------------------- LOAD ROOMS ---------------------------------- */
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setIsLoading(false);

      const { data: memberships } = await supabase
        .from('collaboration_members')
        .select(`
          room_id,
          username,
          collaboration_rooms!inner(id,name,owner_id)
        `)
        .eq('user_id', user.id);

      if (memberships) {
        const rooms = await Promise.all(
          memberships.map(async (m: any) => {
            const { count } = await supabase
              .from('collaboration_members')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', m.room_id);

            return {
              id: m.room_id,
              name: m.collaboration_rooms.name,
              owner_id: m.collaboration_rooms.owner_id,
              member_count: count || 1,
              username: m.username,
            };
          })
        );
        setExistingRooms(rooms);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------- ROUTING HANDLERS ------------------------------- */
  const handleRoomCreated = (roomId: string, username: string) => {
    setCurrentRoom({ id: roomId, username });
    setShowForm(false);
  };

  const handleJoinRoom = (room: Room) => {
    setCurrentRoom({ id: room.id, username: room.username });
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    fetchRooms();
  };

  const handleAcceptInvitation = (roomId: string) => {
    fetchRooms().then(() => {
      const room = existingRooms.find(r => r.id === roomId);
      if (room) setCurrentRoom({ id: roomId, username: room.username });
    });
  };

  /* ------------------------------ ROOM VIEW ------------------------------ */
  if (currentRoom) {
    return (
      <>
        <CollaborationRoom
          roomId={currentRoom.id}
          username={currentRoom.username}
          onLeave={handleLeaveRoom}
        />
        <InvitationNotification onAccept={handleAcceptInvitation} />
      </>
    );
  }

  /* ------------------------------ FORM VIEW ------------------------------ */
  if (showForm) {
    return (
      <div className="min-h-screen 
        bg-gradient-to-b from-[#F7EEE5] to-[#EDE1D6]
        flex items-center justify-center p-6">

        <div className="w-full max-w-xl 
          bg-[#FAF3EB] 
          rounded-2xl 
          shadow-xl 
          border border-[#E5D3C4]
          p-8">

      <Button
  onClick={() => setShowForm(false)}
  className="
    mb-4 
    bg-[#6A4A3C] 
    text-white 
    rounded-xl 
    shadow 
    px-4 
    py-2
    hover:bg-[#6A4A3C] 
    hover:text-white 
    transition-none
  "
>
  ← Back
</Button>


          <StartCollaborationForm onRoomCreated={handleRoomCreated} />
        </div>

        <InvitationNotification onAccept={handleAcceptInvitation} />
      </div>
    );
  }

  /* ------------------------------ MAIN PAGE ------------------------------ */
  return (
    <div className="
      min-h-screen p-10 
      bg-gradient-to-b from-[#F7EEE5] to-[#EDE1D6]
    ">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-semibold flex items-center gap-3 text-[#4A382C]">
              <Users className="h-8 w-8 text-[#6A4A3C]" />
              Collaboration
            </h1>
            <p className="text-[#7A6A5C] mt-1">
              Work together with up to 4 users in real-time
            </p>
          </div>

          <Button
            onClick={() => setShowForm(true)}
            className="
              bg-gradient-to-br from-[#6A4A3C] to-[#4A3328]
              text-white rounded-xl shadow-lg px-6 py-3
            "
          >
            <Plus className="h-4 w-4 mr-2" /> Start New
          </Button>
        </div>

        {/* LOADING */}
        {isLoading ? (
          <div className="text-center py-12 text-[#7A6A5C]">
            Loading...
          </div>
        ) : existingRooms.length === 0 ? (

          /* EMPTY STATE */
          <Card className="bg-[#FAF3EB] shadow-xl border border-[#E5D3C4] rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-14">
              <Users className="h-12 w-12 text-[#A08C7A] mb-4" />

              <h3 className="text-lg font-semibold text-[#4A382C] mb-2">
                No collaboration rooms yet
              </h3>

              <p className="text-[#7A6A5C] mb-5 text-center">
                Start a new collaboration or wait for someone to invite you
              </p>

              <Button
                onClick={() => setShowForm(true)}
                className="
                  bg-gradient-to-br from-[#6A4A3C] to-[#4A3328]
                  text-white rounded-xl shadow-lg
                "
              >
                <Plus className="h-4 w-4 mr-2" /> Start Collaboration
              </Button>
            </CardContent>
          </Card>

        ) : (

          /* ROOMS GRID */
          <div className="grid gap-6 md:grid-cols-2">
            {existingRooms.map((room) => (
              <Card
                key={room.id}
                onClick={() => handleJoinRoom(room)}
                className="
                  bg-[#FAF3EB] shadow-md
                  hover:bg-[#F2E7DD] 
                  transition-all cursor-pointer
                  border border-[#E5D3C4] rounded-2xl
                "
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-[#4A382C]">
                    <span>{room.name}</span>
                    <ArrowRight className="h-4 w-4 text-[#6A4A3C]" />
                  </CardTitle>

                  <CardDescription className="text-[#7A6A5C]">
                    {room.member_count} member{room.member_count !== 1 ? 's' : ''} • 
                    Joined as {room.username}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <InvitationNotification onAccept={handleAcceptInvitation} />
    </div>
  );
};

export default Collaboration;
