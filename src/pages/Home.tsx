import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, MessageSquare, Image, Video, Code2, ArrowRight } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const features = [
    {
      icon: MessageSquare,
      title: "AI Chat",
      description: "Intelligent conversations powered by advanced AI",
      available: true,
    },
    {
      icon: Image,
      title: "Image Generation",
      description: "Create stunning visuals from text descriptions",
      available: true,
    },
    {
      icon: Video,
      title: "Video Generation",
      description: "Transform ideas into dynamic video content",
      available: false,
    },
    {
      icon: Code2,
      title: "Code Editor",
      description: "VS Code-like editor with AI assistance",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold gradient-text">AIVerse</span>
            </div>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary"
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
            Your AI Universe
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Experience the future of creativity and productivity with AIVerse. 
            Chat, create, and code with cutting-edge AI technology.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary text-lg px-8 py-6"
          >
            Start Creating Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Powerful AI Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 glass-effect hover:border-primary transition-all group relative overflow-hidden"
              >
                {!feature.available && (
                  <div className="absolute top-4 right-4 bg-accent px-2 py-1 rounded text-xs font-semibold">
                    Coming Soon
                  </div>
                )}
                <feature.icon className="w-12 h-12 mb-4 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <Card className="p-12 glass-effect text-center glow-primary">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Explore AIVerse?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of creators using AI to bring their ideas to life
            </p>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary text-lg px-8 py-6"
            >
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Home;
