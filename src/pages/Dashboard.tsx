import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

/* 🔥 GLOBAL INVITE POPUP */
import { InvitationNotification } from "@/components/collaboration/InvitationNotification";

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= AUTH SESSION ================= */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /* ================= UI ================= */
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={user} />

      <main className="flex-1 overflow-y-auto relative">

        {/* 🔥 GLOBAL INVITE POPUP (PUBG STYLE) */}
        <InvitationNotification
          onAccept={(roomId) => {
            /**
             * 🔥 IMPORTANT FIX
             * Invite accept ke baad:
             * - Room change hota hai
             * - CollaborationRoom remount hota hai
             * - Username / presence fresh load hota hai
             */
            navigate(`/dashboard/collaboration/${roomId}`, {
              state: { joinedViaInvite: true },
              replace: true,
            });
          }}
        />

        {/* 🔥 NESTED ROUTES */}
        <Outlet />

      </main>
    </div>
  );
};

export default Dashboard;
