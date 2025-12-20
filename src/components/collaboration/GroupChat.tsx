import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Loader2, MessageCircle, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  username: string;
  content: string;
  is_ai: boolean;
  created_at: string;
}

interface GroupChatProps {
  roomId: string;
  username: string;
}

/* -------------------------------------
   FORMATTER: ChatGPT-style CODE BLOCKS  
-------------------------------------- */
const renderFormattedMessage = (content: string) => {
  const parts = content.split(/```([\s\S]*?)```/g);

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Copied!");
  };

  return parts.map((text, index) => {
    const isCode = index % 2 === 1;

    if (isCode) {
      const codeText = text.trim();

      return (
        <div
          key={index}
          className="
            relative group
            bg-[#2B231C] text-[#EBD8C8]
            rounded-lg p-3 my-2 text-xs
            border border-[#C7A583]/40
          "
        >
          {/* COPY BUTTON */}
          <button
            onClick={() => copyCode(codeText)}
            className="
              absolute top-2 right-2
              opacity-0 group-hover:opacity-100
              transition-opacity
              bg-[#4A3A2C]/70 hover:bg-[#6A4A3C]
              text-[#EBD8C8] p-1.5 rounded-md
            "
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <pre className="overflow-x-auto">
            <code>{codeText}</code>
          </pre>
        </div>
      );
    }

    return (
      <p key={index} className="leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
    );
  });
};

export const GroupChat = ({ roomId, username }: GroupChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ---------------- FETCH MESSAGES ---------------- */
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("collaboration_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "collaboration_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [roomId]);

  /* AUTO SCROLL */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const msg = newMessage.trim();
    setNewMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("collaboration_messages").insert({
        room_id: roomId,
        user_id: user?.id,
        username,
        content: msg,
        is_ai: false,
      });

      /* AI Trigger */
      if (msg.includes("@ai")) {
        setIsLoading(true);
        const query = msg.replace(/@ai/gi, "").trim();

        try {
          await supabase.functions.invoke("collaboration-ai", {
            body: { message: query, roomId },
          });
        } catch {
          toast.error("AI failed to respond");
        }

        setIsLoading(false);
      }
    } catch {
      toast.error("Failed to send message");
    }
  };

  const formatTime = (t: string) =>
    new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /* ---------------- UI ---------------- */
  return (
    <div className="h-full flex flex-col bg-[#E8DCCF]">

      {/* HEADER */}
      <div
        className="
          px-5 py-4 border-b border-[#CBBBAA]
          bg-gradient-to-r from-[#4A3328] via-[#5A3A2D] to-[#3A251C]
          text-[#EBD8C8] shadow-sm
        "
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#5A3A2D] border border-[#C7A583]/40">
            <MessageCircle className="h-4 w-4 text-[#EBD8C8]" />
          </div>

          <div>
            <h3 className="text-sm font-semibold">Team Chat</h3>
            <p className="text-xs text-[#D5C6B6] flex items-center gap-1">
              Type{" "}
              <span className="px-1.5 py-0.5 bg-[#C7A583]/30 text-[#EBD8C8] text-[10px] rounded">
                @ai
              </span>{" "}
              to ask assistant
            </p>
          </div>
        </div>
      </div>

      {/* MESSAGE LIST */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-5">

          {messages.map((msg) => {
            const isSelf = msg.username === username;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isSelf ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className={`
                    w-9 h-9 rounded-xl flex items-center justify-center
                    font-semibold border shadow-sm shrink-0
                    ${
                      msg.is_ai
                        ? "bg-[#F6E8D9] text-[#5A4336] border-[#D6C7B7]"
                        : "bg-gradient-to-br from-[#6A4A3C] to-[#4A3328] text-white border-[#C7A583]/50"
                    }
                  `}
                >
                  {msg.is_ai ? <Bot className="h-4 w-4" /> : msg.username[0].toUpperCase()}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col max-w-[75%] ${isSelf ? "items-end" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#4A3A30]">
                      {msg.is_ai ? "AI Assistant" : msg.username}
                    </span>
                    {msg.is_ai && <Sparkles className="h-3 w-3 text-[#C7A583]" />}
                    <span className="text-[10px] text-[#7A6A63]">{formatTime(msg.created_at)}</span>
                  </div>

                  <div
                    className={`
                      rounded-2xl px-4 py-2 text-sm shadow-sm
                      ${
                        msg.is_ai
                          ? "bg-[#FFF7EE] border border-[#E3D3C0] text-[#5A4336]"
                          : isSelf
                          ? "bg-gradient-to-br from-[#6A4A3C] to-[#4A3328] text-white"
                          : "bg-[#D9B894] text-white border border-[#C7A583]"
                      }
                    `}
                  >
                    {msg.is_ai
                      ? renderFormattedMessage(msg.content)
                      : <pre className="whitespace-pre-wrap">{msg.content}</pre>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI Typing */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F6E8D9] flex items-center justify-center border border-[#D6C7B7]">
                <Bot className="h-4 w-4 text-[#5A4336]" />
              </div>

              <div className="rounded-2xl px-4 py-2 bg-[#FFF7EE] border border-[#E3D3C0]">
                <Loader2 className="h-4 w-4 animate-spin inline-block text-[#5A4336]" />
                <span className="ml-2 text-xs text-[#7A6A63]">AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* INPUT BAR */}
      <form
        onSubmit={sendMessage}
        className="
          p-4 border-t border-[#CBBBAA]
          bg-gradient-to-r from-[#4A3328] via-[#5A3A2D] to-[#3A251C]
        "
      >
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="
              flex-1 bg-[#F7EFE7] border-2 border-[#4A3328]
              text-[#4A3A30] rounded-xl
              placeholder:text-[#9A8C80]
              focus:ring-2 focus:ring-[#C7A583]/50 shadow-sm
            "
          />

          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !newMessage.trim()}
            className="bg-[#C7A583] hover:bg-[#B8956F] text-white rounded-xl shadow-md"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

    </div>
  );
};
