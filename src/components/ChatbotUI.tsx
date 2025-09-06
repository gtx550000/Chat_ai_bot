// Chatbot.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import "./Chatbot.css";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot" | "system";
  avatar: string;
}

// ========== CONFIG ==========
const WEBHOOK_URL =
  import.meta?.env?.VITE_N8N_WEBHOOK_URL ||
  (window as any)?.VITE_N8N_WEBHOOK_URL ||
  "";

const CHAT_TRIGGER_URL =
  import.meta?.env?.VITE_N8N_CHAT_TRIGGER_URL ||
  (window as any)?.VITE_N8N_CHAT_TRIGGER_URL ||
  "";

const MODE: "chat-trigger" | "webhook" =
  CHAT_TRIGGER_URL ? "chat-trigger" : "webhook";

const WEBHOOK_SECRET_HEADER_NAME =
  import.meta?.env?.VITE_N8N_WEBHOOK_HEADER_NAME || "";
const WEBHOOK_SECRET_HEADER_VALUE =
  import.meta?.env?.VITE_N8N_WEBHOOK_HEADER_VALUE || "";

const CHAT_INPUT_KEY =
  import.meta?.env?.VITE_N8N_CHAT_INPUT_KEY || "chatInput";
const CHAT_SESSION_KEY =
  import.meta?.env?.VITE_N8N_CHAT_SESSION_KEY || "sessionId";
const CHAT_ENABLE_STREAMING =
  (import.meta?.env?.VITE_N8N_CHAT_STREAMING || "false").toLowerCase() ===
  "true";

// ========== UTILS ==========
const getOrCreateSessionId = (key = "chat.sid") => {
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(key, sid);
  }
  return sid;
};

// helper: พยายามอ่าน response ไม่ว่าจะมาเป็น JSON หรือ text
async function readReply(res: Response) {
  // ถ้า content-type เป็น JSON อ่านเป็น JSON
  const ctype = res.headers.get("content-type") || "";
  if (ctype.includes("application/json")) {
    const data = await res.json().catch(() => ({} as any));
    // รองรับหลาย key: reply / message / text
    return (data?.reply ?? data?.message ?? data?.text ?? "").toString();
  }
  // ไม่ใช่ JSON ก็อ่านเป็น text
  const txt = await res.text();
  try {
    // บางกรณี server ส่ง string ที่เป็น JSON -> ลอง parse
    const j = JSON.parse(txt);
    return (j?.reply ?? j?.message ?? j?.text ?? txt).toString();
  } catch {
    return txt || "(ไม่มีคำตอบ)";
  }
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), text: "สวัสดีครับ/ค่ะ มีอะไรให้ช่วยไหม?", sender: "bot", avatar: "🤖" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
console.log("ENV WEBHOOK URL:", import.meta.env.VITE_N8N_WEBHOOK_URL);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // ---------- SENDER (Webhook โหมดหลัก) ----------
  const sendViaWebhook = async (text: string) => {
    if (!WEBHOOK_URL) throw new Error("ยังไม่ได้ตั้งค่า VITE_N8N_WEBHOOK_URL");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (WEBHOOK_SECRET_HEADER_NAME && WEBHOOK_SECRET_HEADER_VALUE) {
      headers[WEBHOOK_SECRET_HEADER_NAME] = WEBHOOK_SECRET_HEADER_VALUE;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        sessionId,
        message: text,
        metadata: {
          path: window.location.pathname,
          userAgent: navigator.userAgent,
        },
      }),
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${t}`);
    }

    const reply = await readReply(res);
    return reply || "(ไม่มีคำตอบ)";
  };

  // ---------- SENDER (Chat Trigger: ใช้เฉพาะถ้าตั้งค่า URL ไว้) ----------
  const sendViaChatTrigger = async (text: string) => {
    if (!CHAT_TRIGGER_URL) throw new Error("ยังไม่ได้ตั้งค่า VITE_N8N_CHAT_TRIGGER_URL");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const body: Record<string, any> = {
      action: "sendMessage",
      [CHAT_INPUT_KEY]: text,
      [CHAT_SESSION_KEY]: sessionId,
      metadata: {
        path: window.location.pathname,
        userAgent: navigator.userAgent,
      },
    };

    if (CHAT_ENABLE_STREAMING) {
      try {
        const res = await fetch(CHAT_TRIGGER_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({ ...body, stream: true }),
        });

        const ctype = res.headers.get("content-type") || "";
        if (!ctype.includes("text/event-stream") && !ctype.includes("text/plain")) {
          return await readReply(res);
        }

        const reader = res.body?.getReader();
        if (!reader) return await readReply(res);

        let fullText = "";
        const dec = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          fullText += dec.decode(value);
        }
        return fullText.trim() || "(ไม่มีคำตอบ)";
      } catch {
        // ถ้าสตรีมพัง fallback เป็น non-stream
      }
    }

    const res = await fetch(CHAT_TRIGGER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${t}`);
    }
    return await readReply(res);
  };

  const sendToN8n = async (text: string) =>
    MODE === "chat-trigger" ? sendViaChatTrigger(text) : sendViaWebhook(text);

  // ---------- UI ----------
  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: crypto.randomUUID(), text, sender: "user", avatar: "🧑" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setIsTyping(true);

    try {
      const reply = await sendToN8n(text);
      const botMsg: Message = { id: crypto.randomUUID(), text: reply, sender: "bot", avatar: "🤖" };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      setError(e?.message || "ส่งข้อความไม่สำเร็จ");
      const sysMsg: Message = { id: crypto.randomUUID(), text: "ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ", sender: "system", avatar: "⚠️" };
      setMessages((prev) => [...prev, sysMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      <header className="chatbot-header">
        <div className="header-left">
          <span className="back-arrow" role="button" aria-label="back">←</span>
          <span className="header-title">Chatbot</span>
        </div>
        <div className="header-right">
          <span className="icon" title={MODE === "chat-trigger" ? "n8n Chat Trigger" : "Webhook"}>
            {MODE === "chat-trigger" ? "⚡" : "✓"}
          </span>
          <span className="icon" title="close">✕</span>
        </div>
      </header>

      <div ref={listRef} className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            <div className="avatar">{msg.avatar}</div>
            <div className="message-bubble"><p>{msg.text}</p></div>
          </div>
        ))}

        {isTyping && (
          <div className="message-row bot">
            <div className="avatar">🤖</div>
            <div className="message-bubble typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
      </div>

      <div className="mood-understanding-bar">
        <div className="bar-label">MOOD UNDERSTANDING</div>
      </div>

      {error && <div className="error-line">⚠️ {error}</div>}

      <div className="input-area">
        <div className="input-field-wrapper">
          <input
            type="text"
            placeholder="Inpt:"
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isTyping}
            aria-label="ข้อความ"
          />
          <button className="input-icon" type="button" title="attach image" disabled={isTyping}>📷</button>
        </div>
        <div className="input-buttons">
          <button className="input-icon" onClick={handleSend} disabled={!input.trim() || isTyping} title="send">▶️</button>
          <button className="button emoji-button" title="emoji">🙂</button>
          <button className="button attachment-button" title="attach">📎</button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
