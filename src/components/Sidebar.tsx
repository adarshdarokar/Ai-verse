import { NavLink, useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Code2,
  LogOut,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface SidebarProps {
  user: User;
}

const Sidebar = ({ user }: SidebarProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Error signing out");
    else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const navItems = [
    { to: "/dashboard/chat", icon: MessageSquare, label: "AI Chat" },
    { to: "/dashboard/image", icon: ImageIcon, label: "Image Gen" },
    { to: "/dashboard/video", icon: Video, label: "Video Gen" },
    { to: "/dashboard/code", icon: Code2, label: "Code Editor" },
    { to: "/dashboard/collaboration", icon: Users, label: "Collaboration" },
  ];

  return (
    <div
      className="
        w-64 h-full flex flex-col

        bg-gradient-to-b 
        from-[#3B2A21] 
        via-[#2B1D17] 
        to-[#1D1410]

        text-[#EBDDCB]
        border-r border-black/20
        shadow-[6px_0_25px_rgba(0,0,0,0.35)]

        rounded-r-2xl   /* NEW: Right side rounded */
      "
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-black/20">
        <div className="flex items-center gap-3">

          {/* SMALLER ICON + NO GLOW */}
          <div
            className="
              w-8 h-8 rounded-lg 
              bg-gradient-to-br from-[#C7A583] to-[#9E7B5E]
              flex items-center justify-center
            "
          >
            <Sparkles className="w-4 h-4 text-white" /> {/* icon reduced */}
          </div>

          <span className="text-xl font-semibold text-[#F0E4D4]">
            AI-Verse
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
              transition-all duration-300

              ${
                isActive
                  ? `
                bg-[#DCC3A7] text-[#3B2A21]
                shadow-[0_4px_12px_rgba(200,170,140,0.35)]
                scale-[1.02]
              `
                  : `
                text-[#E6D8C8]
                hover:bg-[#FFFFFF10]
                hover:shadow-[0_4px_12px_rgba(255,255,255,0.05)]
                hover:scale-[1.01]
              `
              }
            `}
          >
            <item.icon className="w-4 h-4" />  {/* icon smaller */}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-black/20 bg-[#00000020] backdrop-blur-md">
        <div
          className="
            w-full px-4 py-3 rounded-lg 
            bg-white/10 text-[#F1E7DD]
            shadow border border-white/10
            text-sm font-medium truncate
          "
        >
          {user.email}
        </div>

        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="
            w-full mt-4 justify-start 
            text-red-400 hover:text-red-500 
            hover:bg-red-500/10 rounded-lg
          "
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
