import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Send,
  MessageSquare,
  Copy,
  Trash2,
  Edit2,
  Plus,
  ImagePlus,
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

  return parts.map((block, i) =>
    i % 2 === 1 ? (
      <div key={i} className="relative my-2">
        <button
          className="absolute right-2 top-2 bg-[#D8B892] text-[#3A2A1F] px-2 py-1 rounded text-xs"
          onClick={() => navigator.clipboard.writeText(block.trim())}
        >
          <Copy className="w-3 h-3" />
        </button>
        <pre className="bg-[#2F251D] text-[#F6E8D8] text-xs p-3 rounded-lg overflow-x-auto">
          <code>{block.trim()}</code>
        </pre>
      </div>
    ) : (
      <p key={i} className="whitespace-pre-wrap leading-relaxed text-[14.5px]">
        {block}
      </p>
    )
  );
};

/* ================= SIDEBAR ================= */
const ChatSidebar = ({
  sessions,
  currentSession,
  onSelect,
  onDelete,
  onRename,
  onNew,
}: any) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  return (
    <div className="w-64 m-6 mr-0 rounded-2xl bg-[#F7EFE6] p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#4A382C]">Chats</h2>
        <button
          onClick={onNew}
          className="w-8 h-8 rounded-lg bg-[#E3D2C0] flex items-center justify-center"
        >
          <Plus className="w-4 h-4 text-[#3A2A1F]" />
        </button>
      </div>

      {sessions.map((s: ChatSession) => {
        const active = currentSession === s.id;

        return (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer ${
              active ? "bg-[#5E4335] text-white" : "hover:bg-[#efe3d6]"
            }`}
          >
            {editingId === s.id ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => {
                  onRename(s.id, editTitle || "New Chat");
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onRename(s.id, editTitle || "New Chat");
                    setEditingId(null);
                  }
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="w-full bg-[#3A2A1F] text-white text-sm px-2 py-1 rounded outline-none"
              />
            ) : (
           <span
  className={`text-sm truncate ${
    active ? "text-white" : "text-[#4A382C]"
  }`}
>
  {s.title || "New Chat"}
</span>

            )}

            {active && (
              <div className="flex gap-2 ml-2">
                <Edit2
                  className="w-4 h-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(s.id);
                    setEditTitle(s.title);
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
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ================= CHAT ================= */
export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => data && setSessions(data));
  }, []);

  useEffect(() => {
    if (!currentSession) return;

    supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", currentSession)
      .order("created_at")
      .then(({ data }) => data && setMessages(data));
  }, [currentSession]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewChat = async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .insert({ title: "New Chat" })
      .select()
      .single();

    if (!data) return;

    setSessions((p) => [data, ...p]);
    setCurrentSession(data.id);
    setMessages([]);
  };

  const deleteChat = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("session_id", id);
    await supabase.from("chat_sessions").delete().eq("id", id);

    setSessions((p) => p.filter((s) => s.id !== id));
    if (currentSession === id) {
      setCurrentSession(null);
      setMessages([]);
    }
  };

  const renameChat = async (id: string, title: string) => {
    await supabase.from("chat_sessions").update({ title }).eq("id", id);
    setSessions((p) =>
      p.map((s) => (s.id === id ? { ...s, title } : s))
    );
  };

 const sendMessage = async (e: any) => {
  e.preventDefault();
  if (!input.trim() || !currentSession || isLoading) return;

  const userContent = input.trim();
  setInput("");
  setIsLoading(true);

  const userMsg: Message = {
    id: crypto.randomUUID(),
    role: "user",
    content: userContent,
    created_at: new Date().toISOString(),
  };

  // show user message instantly
  setMessages((p) => [...p, userMsg]);

  // save user message
  await supabase.from("chat_messages").insert({
    session_id: currentSession,
    role: "user",
    content: userContent,
  });

  // ✅ FIX: set chat title ONLY from first user message
  const chat = sessions.find((s) => s.id === currentSession);

  if (chat && chat.title === "New Chat") {
    const cleanTitle = userContent
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 40);

    await supabase
      .from("chat_sessions")
      .update({ title: cleanTitle })
      .eq("id", currentSession);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession ? { ...s, title: cleanTitle } : s
      )
    );
  }

  try {
    const { data } = await supabase.functions.invoke("ai-chat", {
      body: { messages: [...messages, userMsg], sessionId: currentSession },
    });

    if (data?.message) {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString(),
      };

      setMessages((p) => [...p, aiMsg]);

      // save AI message
      await supabase.from("chat_messages").insert({
        session_id: currentSession,
        role: "assistant",
        content: data.message,
      });
    }
  } catch {
    toast.error("AI error");
  }

  setIsLoading(false);
};


  const Avatar = ({ ai }: { ai?: boolean }) => (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center ${
        ai ? "bg-[#5A3F32]" : "bg-[#3A2A1F]"
      }`}
    >
      {ai ? (
        <MessageSquare className="w-4 h-4 text-white" />
      ) : (
        <span className="text-white font-semibold">U</span>
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

      <div className="flex-1 flex flex-col m-6 rounded-2xl bg-[#F7EFE6] shadow-xl">
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-7">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && <div className="mt-1"><Avatar ai /></div>}

                <div
                  className={`max-w-[70%] px-5 py-3 rounded-2xl text-[14.5px] leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-[#5E4335] text-white shadow-sm"
                      : "bg-[#E3CDB6] text-[#3A2A1F] shadow-sm"
                  }`}
                >
                  {renderFormattedMessage(msg.content)}
                </div>

                {msg.role === "user" && <div className="mt-1"><Avatar /></div>}
              </div>
            ))}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* INPUT BAR */}
        <form onSubmit={sendMessage} className="p-4 bg-[#EAD8C6]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 bg-[#F3E7D7] px-4 py-2.5 rounded-[20px] border border-[#d8c3aa]">
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-[#E6D2B8] flex items-center justify-center"
              >
                <ImagePlus className="w-4 h-4 text-[#3A2A1F]" />
              </button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message AI…"
                className="flex-1 bg-[#FAF6F1] text-[#2F241C] placeholder:text-[#9A7F67] rounded-[14px] px-4 py-2.5 border border-[#e2d3c3] focus-visible:ring-0 focus:bg-white text-[14.5px]"
              />

              <button
                type="submit"
                className="w-9 h-9 rounded-full bg-[#5A3F32] flex items-center justify-center"
              >
                <Send className="w-4 h-4 text-[#F9F4EE]" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
