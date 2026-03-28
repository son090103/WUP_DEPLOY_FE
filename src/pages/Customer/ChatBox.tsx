import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const API_BASE = import.meta.env.VITE_API_URL;

export default function ChatBox() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Xin chào! Toi co the giup ban tim chuyen xe, dat ve hoac tra cuu lich trinh. Ban muon di dau?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<Record<string, any>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      // Dùng route có auth nếu có token, không thì dùng route không auth
      const url = token
        ? `${API_BASE}/api/ai/check/chat`
        : `${API_BASE}/api/ai/notcheck/v2/chat`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: currentInput,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      const data = await res.json();

      if (data.requireAuth && !token) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Ban can dang nhap de dat ve. Vui long dang nhap va thu lai nhe!" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply || "Xin loi, toi khong hieu. Ban thu lai nhe!" },
        ]);
      }

      if (data.context) setContext(data.context);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Co loi ket noi. Vui long thu lai sau!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* NÚT MỞ CHATBOX */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f7a53a] to-[#e8791c] shadow-[0_8px_24px_-6px_rgba(232,121,28,0.7)] transition-all duration-300 hover:scale-110"
        >
          <MessageCircle size={26} className="text-white" />
        </button>
      )}

      {/* CHATBOX POPUP */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-[9999] flex flex-col rounded-[20px] border border-[#e7eaf0] bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.3)]"
          style={{ width: 360, height: 520 }}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between rounded-t-[20px] bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Trợ lý đặt vé</p>
                <p className="text-[11px] text-white/70">Luôn sẵn sàng hỗ trợ</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <X size={15} />
            </button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* AVATAR */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${msg.role === "assistant"
                      ? "bg-gradient-to-br from-[#f7a53a] to-[#e8791c]"
                      : "bg-[#e5e7eb]"
                    }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot size={14} className="text-white" />
                  ) : (
                    <User size={14} className="text-[#6b7280]" />
                  )}
                </div>

                {/* BUBBLE */}
                <div
                  className={`max-w-[75%] rounded-[14px] px-3 py-2 text-sm leading-relaxed ${msg.role === "user"
                      ? "rounded-br-[4px] bg-gradient-to-br from-[#f7a53a] to-[#e8791c] text-white"
                      : "rounded-bl-[4px] bg-[#f3f4f6] text-[#1f2937]"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* LOADING */}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f7a53a] to-[#e8791c]">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="rounded-[14px] rounded-bl-[4px] bg-[#f3f4f6] px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="border-t border-[#e5e7eb] px-3 py-3">
            <div className="flex items-center gap-2 rounded-[12px] border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af]"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#f7a53a] to-[#e8791c] text-white disabled:opacity-40 transition hover:scale-105"
              >
                <Send size={14} />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-[#9ca3af]">
              Powered by AI · Hỗ trợ 24/7
            </p>
          </div>
        </div>
      )}
    </>
  );
}