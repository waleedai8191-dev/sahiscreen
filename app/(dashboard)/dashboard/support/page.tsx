"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageCircle,
  BookOpen,
  Zap,
  CreditCard,
  Upload,
  RotateCcw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── Suggested questions ───────────────────────────────────
const SUGGESTIONS = [
  { icon: Upload, label: "How do I upload CVs?" },
  { icon: Zap, label: "Why is a candidate score low?" },
  { icon: BookOpen, label: "How does the scoring work?" },
  { icon: CreditCard, label: "How do I upgrade my plan?" },
  { icon: MessageCircle, label: "How does the apply link work?" },
];

// ── Message bubble ────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        flexDirection: isUser ? "row-reverse" : "row",
        marginBottom: 16,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: isUser
            ? "linear-gradient(135deg, #7C3AED, #a78bfa)"
            : "linear-gradient(135deg, #0f172a, #334155)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isUser ? (
          <User size={15} color="white" />
        ) : (
          <Bot size={15} color="white" />
        )}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "75%",
          background: isUser ? "#7C3AED" : "white",
          color: isUser ? "white" : "#0f172a",
          border: isUser ? "none" : "1px solid #e2e8f0",
          borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          padding: "11px 14px",
          fontSize: 13,
          lineHeight: 1.6,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setStarted(true);
    setInput("");

    const userMsg: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      const reply =
        data.reply ?? "Sorry, I couldn't get a response. Please try again.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const reset = () => {
    setMessages([]);
    setStarted(false);
    setInput("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .support-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f8fafc;
          min-height: 100vh;
          padding: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .support-inner {
          width: 100%;
          max-width: 720px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Header */
        .support-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .support-bot-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #0f172a, #334155);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 8px 24px rgba(15,23,42,0.2);
        }

        .support-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }

        .support-sub {
          font-size: 13px;
          color: #64748b;
        }

        /* Chat card */
        .chat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 560px;
        }

        /* Chat body */
        .chat-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          scroll-behavior: smooth;
        }

        .chat-body::-webkit-scrollbar { width: 4px; }
        .chat-body::-webkit-scrollbar-track { background: transparent; }
        .chat-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

        /* Welcome state */
        .welcome-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 24px;
          padding: 20px 0;
        }

        .welcome-greeting {
          text-align: center;
        }

        .welcome-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .welcome-sub {
          font-size: 13px;
          color: #64748b;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          width: 100%;
          max-width: 480px;
        }

        .suggestion-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 14px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .suggestion-btn:hover {
          border-color: #7C3AED;
          color: #7C3AED;
          background: #faf5ff;
        }

        /* Typing indicator */
        .typing-indicator {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .typing-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0f172a, #334155);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .typing-bubble {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px 16px 16px 16px;
          padding: 12px 16px;
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .typing-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #94a3b8;
          animation: typing-bounce 1.2s infinite;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        /* Input area */
        .chat-input-area {
          border-top: 1px solid #f1f5f9;
          padding: 16px;
          display: flex;
          gap: 10px;
          align-items: flex-end;
          background: white;
        }

        .chat-textarea {
          flex: 1;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          resize: none;
          min-height: 42px;
          max-height: 120px;
          line-height: 1.5;
          transition: border-color 0.2s ease;
        }

        .chat-textarea:focus {
          border-color: #7C3AED;
          background: white;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
        }

        .chat-textarea::placeholder { color: #94a3b8; }

        .chat-send-btn {
          width: 42px; height: 42px;
          border-radius: 12px;
          background: #7C3AED;
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .chat-send-btn:hover:not(:disabled) {
          background: #6d28d9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124,58,237,0.3);
        }

        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Reset button */
        .reset-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 6px 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
          align-self: flex-start;
          margin-bottom: 12px;
        }

        .reset-btn:hover {
          border-color: #7C3AED;
          color: #7C3AED;
          background: #faf5ff;
        }

        /* Footer note */
        .chat-footer-note {
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          padding: 12px;
          border-top: 1px solid #f8fafc;
        }

        @media (max-width: 600px) {
          .support-root { padding: 16px; }
          .suggestions-grid { grid-template-columns: 1fr; }
           .chat-input-area { padding: 10px; gap: 8px; }
  .chat-textarea { font-size: 14px; padding: 9px 12px; min-height: 40px; }
  .chat-send-btn { width: 40px; height: 40px; flex-shrink: 0; }
}

@media (max-width: 400px) {
  .support-root { padding: 10px; }
  .chat-card { border-radius: 14px; }
  .chat-textarea { font-size: 14px; padding: 8px 10px; }
  .support-title { font-size: 18px; }
  .welcome-title { font-size: 15px; }
}
      `}</style>

      <div className="support-root">
        <div className="support-inner">
          {/* Header */}
          <div className="support-header">
            <div className="support-bot-icon">
              <Bot size={26} color="white" />
            </div>
            <h1 className="support-title">Sahi Assistant</h1>
            <p className="support-sub">
              AI-powered support — knows everything about SahiScreen
            </p>
          </div>

          {/* Reset button (only when conversation started) */}
          {started && (
            <button className="reset-btn" onClick={reset}>
              <RotateCcw size={12} /> New conversation
            </button>
          )}

          {/* Chat card */}
          <div className="chat-card">
            <div className="chat-body">
              {!started ? (
                /* Welcome state */
                <div className="welcome-state">
                  <div className="welcome-greeting">
                    <p className="welcome-title">Hi! I'm Sahi 👋</p>
                    <p className="welcome-sub">
                      Ask me anything about SahiScreen — features, billing, how
                      screening works, or anything else.
                    </p>
                  </div>

                  <div className="suggestions-grid">
                    {SUGGESTIONS.map((s) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.label}
                          className="suggestion-btn"
                          onClick={() => sendMessage(s.label)}
                        >
                          <Icon size={13} color="#7C3AED" />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Messages */
                <>
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} />
                  ))}

                  {loading && (
                    <div className="typing-indicator">
                      <div className="typing-avatar">
                        <Bot size={15} color="white" />
                      </div>
                      <div className="typing-bubble">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input area */}
            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                className="chat-textarea"
                placeholder="Ask about SahiScreen...."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="chat-send-btn"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
              >
                {loading ? (
                  <Loader2 size={16} color="white" className="animate-spin" />
                ) : (
                  <Send size={16} color="white" />
                )}
              </button>
            </div>

            <p className="chat-footer-note">
              Sahi can make mistakes — for account issues email
              support@sahiscreen.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
