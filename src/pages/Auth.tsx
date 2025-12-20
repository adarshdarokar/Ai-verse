import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  /* ---------------- LOGIN IF ALREADY AUTHENTICATED ---------------- */
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate("/dashboard");
    };
    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) navigate("/dashboard");
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  /* --------------------------- SIGNUP / LOGIN --------------------------- */
  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        /* ---------- SIGNUP ---------- */
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin + "/dashboard",
          },
        });

        if (error) return toast.error(error.message);

        // AUTO LOGIN AFTER SIGNUP
        await supabase.auth.signInWithPassword({ email, password });

        toast.success("Account created! Redirecting...");
        navigate("/dashboard");

      } else {
        /* ---------- LOGIN ---------- */
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) return toast.error(error.message);

        toast.success("Signed in successfully!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* LEFT SIDE */}
      <div
        className="
          hidden md:flex flex-col justify-center p-16
          bg-gradient-to-b from-[#7A5646] via-[#604437] to-[#4A332B]
          text-left text-[#F7F1EB]
        "
      >
        <h1 className="text-5xl font-serif tracking-wide font-bold mb-4">
          Welcome to AI-Verse
        </h1>

        <p className="text-lg opacity-90 max-w-md">
          Your premium AI workspace with luxury aesthetics and a smooth user experience.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div
        className="
          flex items-center justify-center p-6
          bg-[radial-gradient(circle_at_50%_45%,#DAC8B8_0%,#E8DCD1_40%,#F3EBE3_100%)]
          relative
        "
      >
        <div className="absolute top-32 -left-10 w-80 h-80 bg-[#CDB8A6]/40 blur-[150px] rounded-full"></div>

        <Card
          className="
            w-full max-w-md relative z-10 
            bg-[#FAF4EE]/85 backdrop-blur-xl 
            border border-[#E6D8C9]
            shadow-[0px_18px_45px_rgba(0,0,0,0.10)]
            rounded-3xl
          "
        >
          <CardHeader className="text-center space-y-1 pt-6">
            <h2 className="text-[28px] font-serif tracking-wide text-[#3E2C24] font-medium">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>

            <CardDescription className="text-[#8A6B58] text-sm tracking-wide opacity-90">
              {isSignUp ? "Start your journey with us." : "Sign in to continue >"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAuth} className="space-y-5">

              {isSignUp && (
                <div className="space-y-2">
                  <Label className="text-[#3E2C24] font-medium">Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="
                      bg-[#F2E7DD] border-[#D6C6B9] text-[#3E2C24]
                      rounded-xl shadow-sm placeholder:text-[#A58F7F]
                      focus:border-[#BFA48F] focus:ring-[#BFA48F]
                    "
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[#3E2C24] font-medium">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="
                    bg-[#F2E7DD] border-[#D6C6B9] text-[#3E2C24]
                    rounded-xl shadow-sm placeholder:text-[#A58F7F]
                    focus:border-[#BFA48F] focus:ring-[#BFA48F]
                  "
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#3E2C24] font-medium">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="
                    bg-[#F2E7DD] border-[#D6C6B9] text-[#3E2C24]
                    rounded-xl shadow-sm placeholder:text-[#A58F7F]
                    focus:border-[#BFA48F] focus:ring-[#BFA48F]
                  "
                />
              </div>

              <Button
                type="submit"
                className="
                  w-full py-3 text-lg font-semibold
                  bg-gradient-to-r from-[#AF8A6D] to-[#916C52]
                  hover:opacity-90 text-white rounded-2xl
                  shadow-[0_4px_15px_rgba(0,0,0,0.18)]
                "
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? "Creating..." : "Signing in..."}
                  </>
                ) : (
                  <>{isSignUp ? "Create Account" : "Sign In"}</>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-[#7D5F4A] hover:text-[#3E2C24] transition-all"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don’t have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
