import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  /* ---------- SESSION ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard");
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_e, session) => {
        if (session) navigate("/dashboard");
      });

    return () => subscription.unsubscribe();
  }, [navigate]);

  /* ---------- OAUTH ---------- */
  const handleOAuth = async (provider: "google" | "github") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) toast.error(error.message);
  };

  /* ---------- VALIDATION ---------- */
  const validate = () => {
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (isSignUp && fullName.trim().length < 3) {
      toast.error("Please enter your full name");
      return false;
    }
    return true;
  };

  /* ---------- AUTH ---------- */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) return toast.error(error.message);
        toast.success("Account created successfully");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return toast.error(error.message);
        toast.success("Welcome back");
      }
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans">

      {/* LEFT BRAND */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-b from-[#b08a72] via-[#8a614b] to-[#3a241b]">
        <div className="text-center text-[#fff6ef] space-y-4 px-12">
          <h1 className="text-5xl font-semibold tracking-tight">
            Welcome to AI-Verse
          </h1>
          <p className="text-xs tracking-[0.4em] uppercase opacity-90">
            Think · Create · Collaborate · Repeat
          </p>
        </div>
      </div>

      {/* RIGHT AUTH */}
      <div className="flex items-center justify-center bg-gradient-to-b from-[#f7efe7] via-[#efe3d6] to-[#e2d1bf] px-6">
        <Card className="w-full max-w-md rounded-3xl bg-[#fcf7f2] shadow-[0_40px_90px_-30px_rgba(120,80,50,0.45)] border border-[#e8d8c8]">

          <CardHeader className="text-center pt-8 space-y-1">
            <h2 className="text-2xl font-semibold text-[#3a241b]">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <CardDescription className="text-[#8a6b58]">
              {isSignUp ? "Start building with AI-Verse" : "Sign in to continue"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-8 pb-8">

            {/* GOOGLE */}
            <button
              onClick={() => handleOAuth("google")}
              className="w-full h-11 flex items-center justify-center gap-3 rounded-xl bg-white border border-[#e6d6c6] hover:bg-[#f6efe8] transition"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5"
              />
              <span className="font-medium text-[#3a241b]">
                Continue with Google
              </span>
            </button>

            {/* GITHUB */}
            <button
              onClick={() => handleOAuth("github")}
              className="w-full h-11 flex items-center justify-center gap-3 rounded-xl bg-white border border-[#e6d6c6] hover:bg-[#f6efe8] transition"
            >
              <img
                src="https://www.svgrepo.com/show/512317/github-142.svg"
                className="w-5 h-5"
              />
              <span className="font-medium text-[#3a241b]">
                Continue with GitHub
              </span>
            </button>

            {/* DIVIDER */}
            <div className="flex items-center gap-3 text-xs text-[#8a6b58]">
              <div className="h-px flex-1 bg-[#dcc8b8]" />
              OR
              <div className="h-px flex-1 bg-[#dcc8b8]" />
            </div>

            {/* FORM */}
            <form onSubmit={handleAuth} className="space-y-4">

              {isSignUp && (
                <div className="space-y-1.5">
                  <Label className="text-[#3a241b] text-sm">Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-[#f4ece4] text-[#3a241b] placeholder:text-[#a58b77] rounded-xl border border-[#e2d2c3] focus:ring-2 focus:ring-[#b08a72]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-[#3a241b] text-sm">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-[#f4ece4] text-[#3a241b] placeholder:text-[#a58b77] rounded-xl border border-[#e2d2c3] focus:ring-2 focus:ring-[#b08a72]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#3a241b] text-sm">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#f4ece4] text-[#3a241b] placeholder:text-[#a58b77] rounded-xl border border-[#e2d2c3] focus:ring-2 focus:ring-[#b08a72]"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full font-semibold text-white bg-gradient-to-r from-[#c1936d] to-[#9e6b48] shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : isSignUp ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-[#7a5140] hover:text-[#3a241b]"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don’t have an account? Sign up"}
              </button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
