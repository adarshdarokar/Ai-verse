import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 overflow-hidden font-sans">

      {/* LEFT — PREMIUM BRAND SIDE */}
      <div className="relative flex items-center px-28 bg-gradient-to-b from-[#b08a72] via-[#8a614b] to-[#3a241b]">
        <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/25 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_65%)] pointer-events-none" />

        <div className="relative max-w-xl">
          {/* LOGO */}
          <div className="flex items-center gap-4 mb-28 select-none">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f2d5bf] via-[#d6b094] to-[#b18466] flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <span className="text-[18px] font-semibold text-[#3a241b]">A</span>
            </div>
            <span className="text-[18px] font-semibold tracking-wide text-[#fff4ee]">
              AI-Verse
            </span>
          </div>

          <h1 className="text-[58px] font-semibold leading-[1.05] mb-10 tracking-[-0.035em] text-[#fff7f0]">
            Build smarter <br /> with AI-Verse
          </h1>

          <p className="text-[18px] leading-[1.7] text-[#f3e6dc]/90 mb-14 max-w-lg">
            A focused AI workspace for creators who value clarity,
            speed, and absolute control over their workflow.
          </p>

          <div className="flex flex-wrap gap-3 mb-20">
            {[
              "Unified AI tools",
              "Distraction-free UI",
              "Built for devs",
              "Fast & secure",
              "Real-time collaboration",
            ].map((item) => (
              <span
                key={item}
                className="px-5 py-2 text-sm font-medium rounded-full bg-white/15 border border-white/25 text-[#fff6ef] backdrop-blur-md"
              >
                {item}
              </span>
            ))}
          </div>

          <p className="text-sm italic tracking-wide text-[#f3e6dc]/70">
            “Less noise. More thinking.”
          </p>
        </div>
      </div>

      {/* RIGHT — CLEAN BEIGE (NO DARK EFFECT) */}
      <div className="relative flex items-center justify-center px-12 bg-gradient-to-b from-[#f6eee6] via-[#efe3d6] to-[#e2d1bf]">

        <div className="relative flex flex-col items-center">
          {/* IMAGE — CLEAN */}
          <img
            src="/darkbrwon.webp"
            alt="AI visual"
            className="w-[600px] h-[480px] object-contain mb-20"
          />

          <Button
            onClick={() => navigate("/auth")}
            className="
              px-20 h-13
              rounded-full
              text-[16px] font-semibold tracking-wide
              text-white
              bg-gradient-to-r from-[#c1936d] via-[#b8845f] to-[#9e6b48]
              shadow-[0_26px_55px_-12px_rgba(160,110,70,0.85)]
              transition-all duration-300
              hover:-translate-y-[3px]
            "
          >
            Get Started →
          </Button>

          <p className="mt-6 text-sm text-[#7a5a45]">
            Start free · No credit card required
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
