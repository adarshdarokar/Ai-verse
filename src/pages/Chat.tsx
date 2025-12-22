import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Send,
  MessageSquare,
  Copy,
  Trash2,
  Edit2,
  ImagePlus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

/* ================= TYPES ================= */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

/* =============== FORMATTER =============== */
const renderFormattedMessage = (content: string) => {
  const parts = content.split(/```([\s\S]*?)```/g);

  return parts.map((block, i) => {
    const isCode = i % 2 === 1;

    if (isCode) {
      return (
        <div key={i} className="relative group my-2">
          <button
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 bg-[#D8B892] text-[#3A2A1F] px-2 py-1 rounded text-xs shadow"
            onClick={() => {
              navigator.clipboard.writeText(block.trim());
              toast.success("Copied!");
            }}
          >
            <Copy className="w-3 h-3" />
          </button>

          <pre className="bg-[#2F251D] text-[#F6E8D8] text-xs p-3 rounded-lg border border-[#C7A583]/40 overflow-x-auto">
            <code>{block.trim()}</code>
          </pre>
        </div>
      );
    }

    return (
      <p key={i} className="whitespace-pre-wrap leading-relaxed text-[14.5px]">
        {block}
      </p>
    );
  });
};

/* ================= SIDEBAR ================= */
const ChatSidebar = ({
  sessions,
  currentSession,
  onSelect,
  onDelete,
  onRename,
  onNew,
}: {
  sessions: ChatSession[];
  currentSession: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onNew: () => void;
}) => {
  return (
    <div className="w-64 m-6 mr-0 rounded-2xl shadow-xl bg-[#F7EFE6] p-4 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-[#4A382C]">Chats</h2>

        {/* NEW CHAT */}
        <button
          onClick={onNew}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E3D2C0]"
        >
          <Plus className="w-4 h-4 text-[#3A2A1F]" />
        </button>
      </div>

      {sessions.map((s) => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer
            ${
              currentSession === s.id
                ? "bg-white shadow"
                : "hover:bg-white/60"
            }`}
        >
          <span className="text-sm truncate">
            {s.title || "New Chat"}
          </span>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100">
            <Edit2
              className="w-4 h-4"
              onClick={(e) => {
                e.stopPropagation();
                const t = prompt("Rename chat", s.title);
                if (t) onRename(s.id, t);
              }}
            />
            <Trash2
              className="w-4 h-4"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(s.id);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/* ================= CHAT ================= */
const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data) setSessions(data);
  };

  const loadMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  useEffect(() => {
    if (currentSession) loadMessages(currentSession);
  }, [currentSession]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* MANUAL NEW CHAT */
  const createNewChat = async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .insert({ title: "New Chat" })
      .select()
      .single();

    if (data) {
      setSessions((p) => [data, ...p]);
      setCurrentSession(data.id);
      setMessages([]);
    }
  };

  /* SEND MESSAGE */
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let sessionId = currentSession;

    if (!sessionId) {
      const { data } = await supabase
        .from("chat_sessions")
        .insert({ title: input.slice(0, 30) || "New Chat" })
        .select()
        .single();

      if (data) {
        setSessions((p) => [data, ...p]);
        setCurrentSession(data.id);
        sessionId = data.id;
      }
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await supabase.functions.invoke("ai-chat", {
        body: { messages: [...messages, userMsg] },
      });

      if (data?.message) {
        setMessages((p) => [
          ...p,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.message,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      toast.error("AI error");
    }

    setIsLoading(false);
  };

  /* IMAGE PICK (NO AUTO SEND) */
  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const path = `${crypto.randomUUID()}-${file.name}`;
    await supabase.storage.from("chat-images").upload(path, file);
    toast.success("Image attached");
  };

  /* CHAT MANAGEMENT */
  const deleteChat = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("session_id", id);
    await supabase.from("chat_sessions").delete().eq("id", id);

    setSessions((p) => p.filter((s) => s.id !== id));
    setMessages([]);
    setCurrentSession(null);
  };

  const renameChat = async (id: string, title: string) => {
    await supabase.from("chat_sessions").update({ title }).eq("id", id);

    setSessions((p) =>
      p.map((s) => (s.id === id ? { ...s, title } : s))
    );
  };

  /* AVATAR */
  const Avatar = ({ ai }: { ai?: boolean }) => (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center shadow
        ${
          ai
            ? "bg-gradient-to-br from-[#5A3F32] to-[#3A271E]"
            : "bg-gradient-to-br from-[#F6E8D6] to-[#E3D2C0]"
        }
      `}
    >
      {ai ? (
        <MessageSquare className="w-4 h-4 text-white" />
      ) : (
        <span className="text-[#4A3328] font-semibold">U</span>
      )}
    </div>
  );

  return (
    <div className="h-full flex bg-gradient-to-br from-[#F2E8DA] to-[#E5D4C3]">
      <ChatSidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelect={setCurrentSession}
        onDelete={deleteChat}
        onRename={renameChat}
        onNew={createNewChat}
      />

      <div className="flex-1 flex flex-col m-6 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-[#F7EFE6] to-[#E8D7C5]">
        {/* MESSAGES */}
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && <Avatar ai />}

                <div
                  className={`max-w-[62%] px-5 py-3 rounded-2xl text-sm shadow-sm ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-[#5E4335] to-[#3E2A21] text-[#FAF6F1]"
                      : "bg-white text-[#3A2A1F]"
                  }`}
                >
                  {renderFormattedMessage(msg.content)}
                </div>

                {msg.role === "user" && <Avatar />}
              </div>
            ))}

            {/* AI TYPING */}
            {isLoading && (
              <div className="flex gap-3 items-center">
                <Avatar ai />
                <div className="px-4 py-2 rounded-xl bg-[#5A3F32] text-white text-xs">
                  typing…
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* INPUT */}
        <form
          onSubmit={sendMessage}
          className="p-6 border-t border-black/10 bg-gradient-to-r from-[#F4ECE3] to-[#EAD8C6]"
        >
          <div className="max-w-4xl mx-auto flex gap-3 bg-white/40 p-3 rounded-3xl shadow-xl">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageUpload}
            />

            {/* SMALL PREMIUM ATTACH */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E3D2C0]"
            >
              <ImagePlus className="w-4 h-4 text-[#3A2A1F]" />
            </button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/80 text-[#3A2A1F] placeholder:text-[#7A6A5C] rounded-2xl px-6 py-4 shadow-inner"
            />

            <Button className="rounded-2xl bg-[#5A3F32] hover:bg-[#6A4A3B]">
              <Send className="w-5 h-5 text-white" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
