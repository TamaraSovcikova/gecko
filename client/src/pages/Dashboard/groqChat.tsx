import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { MessageCircle, X, Send, Trash2, Bot, User, Loader2, Sparkles, Database } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "../../lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  toolCalls?: string[];
};

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm your Gecko finance tutor. I can see your real spending, budget, and health score - ask me anything about your money, or use one of the prompts below to get started.",
};

const SUGGESTED_PROMPTS = [
  "Explain my payslip deductions in plain English",
  "What does my National Insurance contribution actually pay for?",
  "Am I saving enough for my age?",
  "How do I build an emergency fund?",
  "Why is my health score what it is?",
  "What should I do with leftover budget this month?",
];

const TOOL_LABELS: Record<string, string> = {
  get_budget_overview: "budget",
  get_expense_breakdown: "expenses",
  get_forecast: "forecast",
  get_health_score: "health score",
  get_loan_summary: "loan data",
  get_savings_goals: "savings goals",
};

function AssistantMessage({
  content,
  streaming,
  toolCalls,
}: {
  content: string;
  streaming?: boolean;
  toolCalls?: string[];
}) {
  if (streaming && !content) {
    const fetchingLabel = toolCalls?.length
      ? `Checking your ${toolCalls.map((t) => TOOL_LABELS[t] ?? t).join(", ")}...`
      : null;
    return (
      <div className="space-y-1.5">
        {fetchingLabel && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-purple-600 font-medium">
            <Database className="w-3 h-3 animate-pulse" />
            {fetchingLabel}
          </span>
        )}
        <span className="inline-flex gap-0.5 items-center h-5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.3s]" />
        </span>
      </div>
    );
  }
  return (
    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>ul]:my-1.5 [&>ul]:pl-4 [&>li]:mb-0.5 [&>strong]:font-semibold [&>strong]:text-gray-900">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

const GroqChat = () => {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isOpen || historyLoaded || !token) return;
    const loadHistory = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/chat/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const msgs: Message[] = res.data.messages || [];
        if (msgs.length > 0) {
          setMessages(msgs.map((m) => ({ role: m.role, content: m.content })));
        }
        setHistoryLoaded(true);
      } catch {
        /* ignore */
      }
    };
    loadHistory();
  }, [isOpen, historyLoaded, token]);

  const clearHistory = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/chat/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* ignore */
    }
    setMessages([WELCOME]);
  };

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);
    setIsStreaming(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let cancelled = false;
      abortRef.current = () => {
        cancelled = true;
        reader.cancel();
      };

      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split("\n").filter((l) => l.startsWith("data: "))) {
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.done) {
              cancelled = true;
              break;
            }
            if (payload.error) {
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: "Sorry, something went wrong.", streaming: false } : m
                )
              );
              cancelled = true;
              break;
            }
            if (payload.tool) {
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, toolCalls: [...(m.toolCalls ?? []), payload.tool] } : m
                )
              );
            }
            if (payload.token) {
              setMessages((prev) =>
                prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: m.content + payload.token } : m))
              );
            }
          } catch {
            /* skip malformed */
          }
        }
      }
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, streaming: false } : m)));
    } catch {
      try {
        const fallback = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/chat`,
          { message: msg },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { role: "assistant", content: fallback.data.reply, streaming: false } : m
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1
              ? { role: "assistant", content: "Sorry, I couldn't connect right now.", streaming: false }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const showSuggestions = messages.length <= 1 && !isStreaming;

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isOpen ? () => setIsOpen(false) : openChat}
        aria-label="Open AI chat assistant"
        className="fixed bottom-5 right-4 w-13 h-13 rounded-full bg-gray-900 text-white cursor-pointer flex items-center justify-center shadow-lg z-[2600] border border-gray-700"
        style={{ width: "52px", height: "52px" }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageCircle className="w-5 h-5" />
              {hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 right-4 z-[2600] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
            style={{
              width: "min(360px, calc(100vw - 24px))",
              height: "min(520px, calc(100vh - 136px))",
              fontFamily: "Manrope, Segoe UI, Arial, sans-serif",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">Finance Tutor</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Knows your real numbers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearHistory}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn("flex gap-2 items-end", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-0.5",
                      msg.role === "user" ? "bg-gray-800" : "bg-white border border-gray-200"
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="w-3 h-3 text-white" />
                    ) : (
                      <Bot className="w-3 h-3 text-purple-600" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] px-3 py-2.5 rounded-2xl text-sm",
                      msg.role === "user"
                        ? "bg-gray-900 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 rounded-bl-sm shadow-sm"
                    )}
                  >
                    {msg.role === "user" ? (
                      <p className="leading-relaxed">{msg.content}</p>
                    ) : (
                      <AssistantMessage content={msg.content} streaming={msg.streaming} toolCalls={msg.toolCalls} />
                    )}
                  </div>
                </div>
              ))}

              {/* Suggested prompts */}
              {showSuggestions && (
                <div className="pt-1 space-y-1.5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1">Try asking</p>
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="w-full text-left text-xs text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-end gap-2 px-3 py-3 bg-white border-t border-gray-100 shrink-0">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances..."
                rows={1}
                disabled={isStreaming}
                className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all max-h-24 overflow-y-auto disabled:opacity-60"
                style={{ minHeight: "38px" }}
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming}
                className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
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
