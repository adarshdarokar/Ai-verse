import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import ImageGeneration from "./pages/ImageGeneration";
import VideoGeneration from "./pages/VideoGeneration";
import CodeEditor from "./pages/CodeEditor";
import Collaboration from "./pages/Collaboration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />

          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="chat" element={<Chat />} />
            <Route path="image" element={<ImageGeneration />} />
            <Route path="video" element={<VideoGeneration />} />
            <Route path="code" element={<CodeEditor />} />
            <Route path="collaboration" element={<Collaboration />} />
            <Route
              path="collaboration/:roomId"
              element={<Collaboration />}
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
