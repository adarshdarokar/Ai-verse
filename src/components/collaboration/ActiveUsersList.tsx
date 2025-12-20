import { ScrollArea } from "@/components/ui/scroll-area";
import { Crown, User, Circle } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  username: string;
  status: string;
  isOnline?: boolean;
}

interface ActiveUsersListProps {
  members: Member[];
  currentUserId: string | null;
  ownerId: string | null;
}

export const ActiveUsersList = ({
  members,
  currentUserId,
  ownerId,
}: ActiveUsersListProps) => {
  const sortedMembers = [...members].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    if (a.user_id === ownerId) return -1;
    if (b.user_id === ownerId) return 1;
    return 0;
  });

  return (
    <div
      className="
        h-full flex flex-col
        bg-[#E8DCCF]         /* Darker beige premium */
        border-r border-[#CDBEAE]
        rounded-r-2xl shadow-xl
      "
    >
      {/* HEADER */}
      <div
        className="
          px-4 py-4 
          border-b border-[#CDBEAE]
          bg-gradient-to-r from-[#EFE3D4] to-[#E5D6C7]
          rounded-tr-2xl
        "
      >
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#5A3F31]" />
          <h3 className="text-sm font-semibold text-[#3E2D23]">Members</h3>
        </div>
        <p className="text-xs text-[#7A6A5C] mt-0.5">{members.length}/4 users</p>
      </div>

      {/* MEMBER LIST */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {sortedMembers.map((member) => (
            <div
              key={member.id}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all

                ${
                  member.isOnline
                    ? "bg-gradient-to-r from-[#5E4032] to-[#4A3328] text-white shadow-md border border-[#C7A583]/30"
                    : "bg-[#F0E5D8]/80 text-[#3E2D23] border border-transparent"
                }

                ${
                  member.user_id === currentUserId
                    ? "ring-1 ring-[#C7A583]/50"
                    : ""
                }
              `}
            >
              {/* AVATAR */}
              <div className="relative">
                <div
                  className={`
                    w-9 h-9 rounded-xl flex items-center justify-center 
                    text-xs font-semibold border transition-all

                    ${
                      member.isOnline
                        ? "bg-gradient-to-br from-[#6A4A3C] to-[#4A3328] text-white border-[#D4B08A]"
                        : "bg-[#E4D7C8] text-[#7A6758] border-[#CABAA9]"
                    }
                  `}
                >
                  {member.username.charAt(0).toUpperCase()}
                </div>

                {/* STATUS DOT */}
                <div
                  className={`
                    absolute -bottom-0.5 -right-0.5 
                    w-3 h-3 rounded-full border-[2.5px] border-[#E8DCCF]
                    ${
                      member.isOnline
                        ? "bg-green-500"
                        : "bg-[#B8A99A]"
                    }
                  `}
                >
                  {member.isOnline && (
                    <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />
                  )}
                </div>
              </div>

              {/* TEXT INFO */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold truncate ${
                      member.isOnline ? "text-white" : "text-[#3E2D23]"
                    }`}
                  >
                    {member.username}
                  </span>

                  {member.user_id === ownerId && (
                    <Crown
                      className={`h-3 w-3 ${
                        member.isOnline ? "text-[#F4D8A6]" : "text-[#C7A583]"
                      }`}
                    />
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <Circle
                    className={`h-1.5 w-1.5 ${
                      member.isOnline
                        ? "fill-green-400 text-green-400"
                        : "fill-[#B8A99A]"
                    }`}
                  />
                  <span
                    className={`text-[10px] ${
                      member.isOnline ? "text-white/90" : "text-[#7A6A5C]"
                    }`}
                  >
                    {member.isOnline ? "Online" : "Offline"}
                    {member.user_id === currentUserId && " (you)"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
