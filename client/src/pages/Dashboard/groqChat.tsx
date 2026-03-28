//could be moved to components if resued elsewher to dashboard?
import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {BsChatDots, BsSend} from "react-icons/bs";
import {BiX} from "react-icons/bi";

type Message = {
    role: "user" | "bot";
    content: string;
};

const GroqChat = () => {
    const {token} = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return //no blank mesages allowed!
        const userMessage: Message = {role: "user", content: input};
        setMessages((prev) => [...prev, userMessage]); //adds to previous messages mmediately
        setInput(""); //clear nput
        setIsTyping(true);

        try {
            const res = await axios.post(//as requested in 'tehcnical notes' on JIRA
                `${import.meta.env.VITE_API_URL}/api/v1/chat`,
                {message: userMessage.content},
                {headers: {Authorization: `Bearer ${token}`}}
            );
            const aiMessage: Message = {
                role: "bot",
                content: res.data.reply};
            setMessages((prev) => [...prev, aiMessage]); //adds to message history

        } catch (err) { //fallback
            console.error(err);
            setMessages((prev) => [...prev, {role: "bot", content: "Error getting response."}]); //adds 'error getting response' to previous messages
        } finally {
            setIsTyping(false); //'is typing...' mst stop regarldess of success or fail
        }
    };

    return (
        <>
            {/*This is chat button*/}
            <button onClick={() => setIsOpen(!isOpen)}
                style={{position: "fixed",
                    bottom: 20,
                    right: 20,
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "red",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"}}>
                {/*imported react icons, it looks awesome so hope thats allowed...*/}
                <BsChatDots size={26} />
            </button>

            {isOpen && (
                <div style={{position: "fixed",
                        bottom: 90,
                        right: 20,
                        width: 320,
                        height: 420,
                        background: "lightgrey",
                        borderRadius: 12,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden"}}>

                    {/*Title currently called Grok API assisstant for easy understanding but could be given a nname or something?*/}
                    <div style={{padding: 10,
                            background: "red",
                            color: "white",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"}}>
                        <strong>Grok API Assistant</strong>
                        <button onClick={() => setIsOpen(false)}
                            style={{background: "transparent",
                                border: "none",
                                color: "white",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"}}>
                            {/*imported cross icon*/}
                            <BiX size={20} />
                        </button>
                    </div>

                    {/*message styling to get that response colours and typing...*/}
                    <div style={{flex: 1, padding: 10, overflowY: "auto",}}> {/*overflow allows scrolling!*/}
                        {messages.map((msg, i) => (
                            <div key={i}
                                style={{display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10,}}>
                                {/*user aligns right, 'bot' left*/}
                              <span style={{padding: "10px",
                                      borderRadius: 16,
                                      maxWidth: "80%",
                                      background: msg.role === "user" ? "red" : "white",
                                      color: msg.role === "user" ? "white" : "black" }}>
                                {msg.content}
                              </span>
                            </div>
                        ))}

                        {isTyping && (
                            <div style={{ fontSize: 15, color: "gray" }}>
                                Typing...
                            </div>)}
                    </div>

                    {/*user inputting*/}
                    <div style={{display: "flex", padding: 10}}>
                        <input value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Type message..."
                            style={{flex: 1, padding: 10, borderRadius: 20, border: "none", background: "white"}}
                            onKeyDown={(event) => event.key === "Enter" && sendMessage()}/>

                        <button onClick={sendMessage}
                            style={{width: 40,
                                height: 40,
                                borderRadius: "50%",
                                background: "red",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"}}>
                            <BsSend size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default GroqChat;