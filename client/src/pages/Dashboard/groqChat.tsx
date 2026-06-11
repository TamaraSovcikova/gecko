import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { MessageCircle, X, Send, Trash2, Bot, User, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

const WELCOME: Message = {
  role: "assistant",
  content: "Hi! I'm your Gecko AI finance assistant. I can answer questions about your spending, budgeting, and savings goals. What would you like to know?",
};

const GroqChat = () => {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Load history when chat opens for the first time
  useEffect(() => {
    if (!isOpen || historyLoaded || !token) return;
    const loadHistory = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/chat/history`, { headers: { Authorization: `Bearer ${token}` } });
        const msgs: Message[] = res.data.messages || [];
        if (msgs.length > 0) {
          setMessages(msgs.map((m) => ({ role: m.role, content: m.content })));
        }
        setHistoryLoaded(true);
      } catch { /* ignore - use in-memory state */ }
    };
    loadHistory();
  }, [isOpen, historyLoaded, token]);

  const clearHistory = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/chat/history`, { headers: { Authorization: `Bearer ${token}` } });
    } catch { /* ignore */ }
    setMessages([WELCOME]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    // Add placeholder assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);
    setIsStreaming(true);

    const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/chat/stream`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let cancelled = false;

      abortRef.current = () => { cancelled = true; reader.cancel(); };

      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.done) { cancelled = true; break; }
            if (payload.error) {
              setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: "Sorry, something went wrong.", streaming: false } : m));
              cancelled = true;
              break;
            }
            if (payload.token) {
              setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: m.content + payload.token } : m));
            }
          } catch { /* skip malformed */ }
        }
      }

      // Mark streaming done
      setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, streaming: false } : m));
    } catch (err) {
      // Fallback to non-streaming
      try {
        const fallback = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/chat`, { message: text }, { headers: { Authorization: `Bearer ${token}` } });
        setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { role: "assistant", content: fallback.data.reply, streaming: false } : m));
      } catch {
        setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { role: "assistant", content: "Sorry, I couldn't connect to the AI service right now.", streaming: false } : m));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* FAB */}
      <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((v) => !v)} aria-label="Open AI chat assistant"
        className="fixed bottom-5 right-4 w-14 h-14 rounded-full bg-purple-700 text-white border-none cursor-pointer flex items-center justify-center shadow-pop z-[2600]">
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-6 h-6" /></motion.span>
            : <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><MessageCircle className="w-6 h-6" /></motion.span>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-4 z-[2600] flex flex-col rounded-2xl overflow-hidden shadow-pop border border-purple-200"
            style={{ width: "min(340px, calc(100vw - 24px))", height: "min(480px, calc(100vh - 136px))", fontFamily: "Manrope, Segoe UI, Arial, sans-serif" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-purple-700 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-200" />
                <div>
                  <p className="text-sm font-bold leading-none">Gecko AI</p>
                  <p className="text-[10px] text-purple-300 mt-0.5">Finance assistant</p>
                </div>
              </div>
              <button type="button" onClick={clearHistory} title="Clear history" className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-purple-50 p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-2 items-end", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5",
                    msg.role === "user" ? "bg-purple-600" : "bg-white border border-purple-200")}>
                    {msg.role === "user" ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <div className={cn("max-w-[76%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user" ? "bg-purple-700 text-white rounded-br-sm" : "bg-white border border-purple-100 text-purple-900 rounded-bl-sm shadow-sm")}>
                    {msg.content || (msg.streaming && <span className="inline-flex gap-0.5"><span className="animate-bounce">.</span><span className="animate-bounce [animation-delay:0.15s]">.</span><span className="animate-bounce [animation-delay:0.3s]">.</span></span>)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-end gap-2 px-3 py-3 bg-white border-t border-purple-100 shrink-0">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ask about your finances..." rows={1} disabled={isStreaming}
                className="flex-1 resize-none bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 text-sm text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all max-h-24 overflow-y-auto disabled:opacity-60"
                style={{ minHeight: "38px" }} />
              <button type="button" onClick={sendMessage} disabled={!input.trim() || isStreaming}
                className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center hover:bg-purple-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GroqChat;
