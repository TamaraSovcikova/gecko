//could be moved to components if resued elsewher to dashboard?
import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { BsChatDots, BsSend } from "react-icons/bs";
import { BiX } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import { COLORS } from "../../constants/theme";

type Message = {
  role: "user" | "bot";
  content: string;
};

const GroqChat = () => {
  const { token } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const Markdown = ReactMarkdown as any;

  const sendMessage = async () => {
    if (!input.trim()) return; //no blank mesages allowed!
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]); //adds to previous messages mmediately
    setInput(""); //clear nput
    setIsTyping(true);

    try {
      const res = await axios.post(
        //as requested in 'tehcnical notes' on JIRA
        `${import.meta.env.VITE_API_URL}/api/v1/chat`,
        { message: userMessage.content },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const aiMessage: Message = {
        role: "bot",
        content: res.data.reply,
      };
      setMessages((prev) => [...prev, aiMessage]); //adds to message history
    } catch (err) {
      //fallback
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Error getting response." },
      ]); //adds 'error getting response' to previous messages
    } finally {
      setIsTyping(false); //'is typing...' mst stop regarldess of success or fail
    }
  };

  return (
    <>
      {/*This is chat button*/}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open Groq chat assistant"
        title="Ask Zoar AI"
        style={{
          position: "fixed",
          bottom: 18,
          right: 16,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: COLORS.purple500,
          color: COLORS.textInverse,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 20px rgba(92, 63, 163, 0.35)",
          zIndex: 2600,
        }}
      >
        {/*imported react icons, it looks awesome so hope thats allowed...*/}
        <BsChatDots size={26} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 92,
            right: 16,
            width: "min(320px, calc(100vw - 24px))",
            height: "min(420px, calc(100vh - 128px))",
            maxHeight: "calc(100vh - 128px)",
            background: COLORS.purple100,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 12px 28px rgba(26, 16, 64, 0.25)",
            zIndex: 2600,
          }}
        >
          {/*Title updated to match Groq branding*/}
          <div
            style={{
              padding: 10,
              background: COLORS.purple600,
              color: COLORS.textInverse,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong>Groq API Assistant</strong>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: COLORS.textInverse,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/*imported cross icon*/}
              <BiX size={20} />
            </button>
          </div>

          {/*message styling to get that response colours and typing...*/}
          <div style={{ flex: 1, padding: 10, overflowY: "auto" }}>
            {" "}
            {/*overflow allows scrolling!*/}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 10,
                }}
              >
                {/*user aligns right, 'bot' left*/}
                <span
                  style={{
                    padding: "10px",
                    borderRadius: 16,
                    maxWidth: "80%",
                    background:
                      msg.role === "user" ? COLORS.purple500 : COLORS.purple50,
                    color:
                      msg.role === "user"
                        ? COLORS.textInverse
                        : COLORS.textPrimary,
                  }}
                >
                  <Markdown>{msg.content}</Markdown>
                </span>
              </div>
            ))}
            {isTyping && (
              <div style={{ fontSize: 15, color: COLORS.textMuted }}>Typing...</div>
            )}
          </div>

          {/*user inputting*/}
          <div style={{ display: "flex", padding: 10 }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type message..."
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 20,
                border: `1px solid ${COLORS.purple300}`,
                background: COLORS.purple50,
              }}
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            />

            <button
              onClick={sendMessage}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: COLORS.purple600,
                color: COLORS.textInverse,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BsSend size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GroqChat;
