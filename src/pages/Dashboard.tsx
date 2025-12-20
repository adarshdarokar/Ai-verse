import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

/* 🔥 ADD THIS IMPORT */
import { InvitationNotification } from "@/components/collaboration/InvitationNotification";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={user} />

      <main className="flex-1 overflow-y-auto relative">
        {/* 🔥 GLOBAL INVITE POPUP (PUBG STYLE) */}
        <InvitationNotification
          onAccept={(roomId) => {
            navigate(`/dashboard/collaboration/${roomId}`);
          }}
        />

        {/* EXISTING ROUTES */}
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
