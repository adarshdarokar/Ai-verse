import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Copy,
  Check,
  Wand2,
  Bug,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Message, EditorMode, FileItem } from "./types";
import { cn } from "@/lib/utils";

interface AIChatProps {
  selectedFile: FileItem | null;
  code: string;
  onClose: () => void;
}

export function AIChat({ selectedFile, code, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<EditorMode>("chat");
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const context = selectedFile
        ? `Current file: ${selectedFile.name}\n\nCode:\n\`\`\`${selectedFile.language || ""}\n${code}\n\`\`\``
        : "";

      const modePrefix =
        activeMode === "fix"
          ? "[FIX MODE] Identify errors and provide corrected code with explanations.\n\n"
          : activeMode === "refactor"
          ? "[REFACTOR MODE] Improve and optimize the following code.\n\n"
          : "";

      const response = await supabase.functions.invoke("ai-code", {
        body: {
          messages: [
            ...messages,
            {
              role: "user",
              content: `${modePrefix}${context}\n\nUser request: ${userMessage}`,
            },
          ],
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response.data.response }]);
    } catch (error) {
      console.error("AI Error:", error);
      toast.error("Failed to get AI response");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCodeBlock = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderMessage = (content: string, msgIndex: number) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    let codeBlockIndex = 0;

    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (match) {
          const [, lang, codeContent] = match;
          const currentIndex = codeBlockIndex++;
          const globalIndex = msgIndex * 1000 + currentIndex;

          return (
            <div key={i} className="relative my-2 rounded-lg overflow-hidden bg-[#1e1e2e] border border-border">
              <div className="flex items-center justify-between px-3 py-1 bg-[#181825] text-xs text-muted-foreground">
                <span>{lang || "code"}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={() => copyCodeBlock(codeContent.trim(), globalIndex)}
                >
                  {copiedCode === globalIndex ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <pre className="p-3 overflow-x-auto text-sm">
                <code>{codeContent.trim()}</code>
              </pre>
            </div>
          );
        }
      }
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="w-96 border-l border-border flex flex-col bg-[#252526]">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">AI Assistant</span>
        </div>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Mode Buttons */}
      <div className="p-2 border-b border-border flex gap-1">
        <Button
          size="sm"
          variant={activeMode === "chat" ? "default" : "ghost"}
          className="flex-1 h-7 text-xs"
          onClick={() => setActiveMode("chat")}
        >
          <Wand2 className="w-3 h-3 mr-1" />
          Chat
        </Button>
        <Button
          size="sm"
          variant={activeMode === "fix" ? "default" : "ghost"}
          className="flex-1 h-7 text-xs"
          onClick={() => setActiveMode("fix")}
        >
          <Bug className="w-3 h-3 mr-1" />
          Fix
        </Button>
        <Button
          size="sm"
          variant={activeMode === "refactor" ? "default" : "ghost"}
          className="flex-1 h-7 text-xs"
          onClick={() => setActiveMode("refactor")}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refactor
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Ask me about your code!</p>
            <p className="text-xs mt-1">I can help fix bugs, refactor, and explain code.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "text-sm",
                  msg.role === "user" ? "ml-4 p-3 rounded-lg bg-primary/10" : "mr-4"
                )}
              >
                {msg.role === "assistant" ? renderMessage(msg.content, index) : msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your code..."
            className="min-h-[60px] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon" className="h-auto">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
