import React, { useState, useEffect, useRef } from "react"; // 1. เพิ่ม useRef
import { LuSend } from "react-icons/lu";
import "../components/Chatbot.css"; // หรือ path ที่คุณเก็บ css ไว้

/* -------------------- SVG ICONS -------------------- */
const Icons = {
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Team: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0 0-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 11h.09A1.65 1.65 0 0 0 10 9.49V9a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09c0 .63.33 1.25 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 15z" />
    </svg>
  ),
};

/* -------------------- TYPES -------------------- */
type Message = {
  role: "user" | "assistant";
  content: string;
};

/* -------------------- COMPONENT -------------------- */
const TeamDashboard: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("chat_history");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        role: "assistant",
        content: "สวัสดี! เราคือทีม AI ของ K ลองถามอะไรเราดูได้เลยนะ!",
      },
    ];
  });

  // 2. สร้าง Ref สำหรับจุดต่ำสุดของแชท
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 3. ฟังก์ชันเลื่อนลงอัตโนมัติ
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 4. เรียกใช้เมื่อ messages เปลี่ยนแปลง
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  /* -------- SEND HANDLER -------- */
  const handleSend = async () => {
    if (!inputValue.trim() || isSending || isWaiting) return;

    const text = inputValue.trim();

    // เก็บข้อความ user
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInputValue("");

    setIsSending(true);
    setTimeout(() => setIsSending(false), 600);

    setIsWaiting(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (status ${res.status})`,
          },
        ]);
        return;
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "AI ไม่ได้ส่งข้อความกลับมา",
        },
      ]);
    } catch (err) {
      console.error("Error calling /api/chat:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "เกิดข้อผิดพลาดในการเชื่อมต่อ API",
        },
      ]);
    } finally {
      setIsWaiting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-box">AI</div>
        <div className="nav-icon"><Icons.Home /></div>
        <div className="nav-icon active"><Icons.Team /></div>
        <div className="nav-icon"><Icons.Chat /></div>
        <div style={{ marginTop: "auto", marginBottom: "20px" }} className="nav-icon">
          <Icons.Settings />
        </div>
      </aside>

      <main className="main-content">
        <header className="header-section">
          <h1 className="welcome-text">Hey! User</h1>
          <h2 className="sub-header">Meet our Creators</h2>

          <div className="filter-tags">
            <span className="tag active">All Team</span>
            <span className="tag">Developers</span>
            <span className="tag">Designers</span>
            <span className="tag">AI Logic</span>
          </div>
        </header>

        {/* --- CHAT SECTION --- */}
        <section className="chat-section">
          
          {/* 1. HISTORY ZONE (Scrollable) */}
          <div className="chat-history">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-bubble ${
                  msg.role === "user" ? "user" : "assistant"
                }`}
              >
                {msg.content}
              </div>
            ))}
            
            {/* 5. จุดอ้างอิงสำหรับ Auto Scroll (มองไม่เห็น) */}
            <div ref={chatEndRef} />
          </div>

          {/* 2. INPUT ZONE (Fixed Bottom) */}
          <div className="input-container">
            <input
              type="text"
              className="chat-input"
              placeholder={isWaiting ? "AI is thinking..." : "Ask me anything..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isWaiting}
            />

            <button
              className="send-btn"
              onClick={handleSend}
              disabled={isWaiting || isSending}
            >
              {isWaiting ? (
                <div className="loading-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              ) : (
                <div className={`send-icon ${isSending ? "flying" : ""}`}>
                  <LuSend />
                </div>
              )}
            </button>
          </div>
          
        </section>
      </main>
    </div>
  );
};

export default TeamDashboard;