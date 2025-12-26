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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  /* ---------- AUTO SCROLL ---------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* ---------- SEND MESSAGE ---------- */
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setIsLoading(true);

    setMessages(prev => [...prev, { role: "user", content: userText }]);

    try {
      const fileContext = selectedFile
        ? `Current file: ${selectedFile.name}

\`\`\`${selectedFile.language ?? ""}
${code}
\`\`\``
        : "";

      const modePrefix =
        activeMode === "fix"
          ? "[FIX MODE]\n"
          : activeMode === "refactor"
          ? "[REFACTOR MODE]\n"
          : "";

      const res = await supabase.functions.invoke("ai-code", {
        body: {
          messages: [
            ...messages,
            {
              role: "user",
              content: `${modePrefix}${fileContext}\nUser: ${userText}`,
            },
          ],
        },
      });

      if (res.error) throw new Error(res.error.message);

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: res.data.response },
      ]);
    } catch (err) {
      console.error("AIChat error:", err);
      toast.error("AI request failed");
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "❌ AI failed. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- COPY CODE ---------- */
  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  /* ---------- RENDER MESSAGE ---------- */
  const renderMessage = (content: string, msgIndex: number) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    let codeIndex = 0;

    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (!match) return null;

        const [, lang, codeText] = match;
        const globalIndex = msgIndex * 1000 + codeIndex++;

        return (
          <div
            key={i}
            className="my-2 rounded-lg overflow-hidden border border-border bg-[#1e1e2e]"
          >
            <div className="flex items-center justify-between px-3 py-1 text-xs bg-[#181825]">
              <span>{lang || "code"}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2"
                onClick={() => copyCode(codeText.trim(), globalIndex)}
              >
                {copiedIndex === globalIndex ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            <pre className="p-3 text-sm overflow-x-auto">
              <code>{codeText.trim()}</code>
            </pre>
          </div>
        );
      }

      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  /* ---------- UI ---------- */
  return (
    <div className="w-96 flex flex-col bg-[#252526] border-l border-border">
      {/* HEADER */}
      <div className="p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* MODES */}
      <div className="p-2 flex gap-1 border-b border-border">
        <Button
          size="sm"
          variant={activeMode === "chat" ? "default" : "ghost"}
          className="flex-1 h-7 text-xs"
          onClick={() => setActiveMode("chat")}
        >
          <Wand2 className="w-3 h-3 mr-1" /> Chat
        </Button>
        <Button
          size="sm"
          variant={activeMode === "fix" ? "default" : "ghost"}
          className="flex-1 h-7 text-xs"
          onClick={() => setActiveMode("fix")}
        >
          <Bug className="w-3 h-3 mr-1" /> Fix
        </Button>
        <Button
          size="sm"
          variant={activeMode === "refactor" ? "default" : "ghost"}
          className="flex-1 h-7 text-xs"
          onClick={() => setActiveMode("refactor")}
        >
          <RefreshCw className="w-3 h-3 mr-1" /> Refactor
        </Button>
      </div>

      {/* MESSAGES */}
      <ScrollArea className="flex-1 p-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-10">
            <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Ask anything about your code
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "text-sm",
                  m.role === "user"
                    ? "ml-4 bg-primary/10 p-3 rounded-lg"
                    : "mr-4"
                )}
              >
                {m.role === "assistant"
                  ? renderMessage(m.content, i)
                  : m.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* INPUT */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your code…"
            className="min-h-[60px] resize-none text-sm"
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            size="icon"
            disabled={isLoading || !input.trim()}
            onClick={sendMessage}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
