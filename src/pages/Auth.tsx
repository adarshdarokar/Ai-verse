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

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin + "/dashboard",
          },
        });

        if (error) return toast.error(error.message);

        await supabase.auth.signInWithPassword({ email, password });
        toast.success("Account created!");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return toast.error(error.message);

        toast.success("Signed in successfully!");
        navigate("/dashboard");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 overflow-hidden font-sans">

      {/* LEFT — SAME GRADIENT AS HOME */}
      <div className="hidden md:flex items-center justify-center px-16 bg-gradient-to-b from-[#b08a72] via-[#8a614b] to-[#3a241b]">
        <div className="text-center text-[#fff6ef] space-y-4">
          <h1 className="text-5xl font-semibold tracking-wide">
            Welcome to AI-Verse
          </h1>
          <p className="text-lg opacity-90">
            Think. Create. Collaborate. Repeat.
          </p>
        </div>
      </div>

      {/* RIGHT — SAME BEIGE AS HOME */}
      <div className="flex items-center justify-center px-6 bg-gradient-to-b from-[#f6eee6] via-[#efe3d6] to-[#e2d1bf]">

        <Card
          className="
            w-full max-w-md
            bg-[#fbf6f1]/95
            border border-[#e2d2c3]
            rounded-3xl
            shadow-[0_20px_45px_rgba(160,110,70,0.25)]
          "
        >
          <CardHeader className="text-center pt-8 space-y-1">
            <h2 className="text-[28px] font-semibold tracking-wide text-[#3a241b]">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <CardDescription className="text-[#8a6b58] text-sm tracking-wide">
              {isSignUp ? "Start your journey with us." : "Sign in to continue"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAuth} className="space-y-5">

              {isSignUp && (
                <div className="space-y-2">
                  <Label className="text-[#3a241b] font-medium">Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="bg-[#f3eae1] border-[#d8c8ba] text-[#3a241b] rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[#3a241b] font-medium">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-[#f3eae1] border-[#d8c8ba] text-[#3a241b] rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#3a241b] font-medium">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-[#f3eae1] border-[#d8c8ba] text-[#3a241b] rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="
                  w-full py-3 text-lg font-semibold
                  text-white rounded-2xl
                  bg-gradient-to-r from-[#c1936d] via-[#b8845f] to-[#9e6b48]
                  shadow-[0_24px_50px_-12px_rgba(160,110,70,0.85)]
                "
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? "Creating..." : "Signing in..."}
                  </>
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-[#7a5140] hover:text-[#3a241b] transition"
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
