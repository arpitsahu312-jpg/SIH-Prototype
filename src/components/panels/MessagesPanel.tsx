import { useEffect, useState, useRef } from "react";
import { useStationStore } from "@/lib/store";

export function MessagesPanel() {
  const messages = useStationStore((s) => s.stationState.messages);
  const sendMessage = useStationStore((s) => s.sendMessage);
  const markMessagesRead = useStationStore((s) => s.markMessagesRead);
  const pendingCount = useStationStore((s) => s.stationState.pendingMessages.length);
  const satelliteOnline = useStationStore((s) => s.stationState.satelliteOnline);
  
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate unread count for the badge
  const unreadCount = messages.filter(m => m.from === "ncpor" && !m.read).length;

  useEffect(() => {
    // Mark messages as read when the panel is opened/mounted
    markMessagesRead();
  }, [markMessagesRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (priority: "normal" | "urgent") => {
    if (!replyText.trim()) return;
    sendMessage("station", replyText, priority);
    setReplyText("");
    // Also mark any new ones as read since we are interacting
    markMessagesRead();
  };

  return (
    <div style={{ background: "#0a1628", display: "flex", flexDirection: "column", height: "350px", borderBottom: "1px solid #1e3a5f" }}>
      {/* Panel Header */}
      <div style={{
        padding: "8px 12px",
        fontSize: "11px",
        fontWeight: "bold",
        color: "#58a6ff",
        letterSpacing: "0.1em",
        borderBottom: "1px solid #1e3a5f",
        textTransform: "uppercase",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span>📨 NCPOR COMMUNICATIONS</span>
        {unreadCount > 0 && (
          <span style={{ color: "#ef4444", fontSize: "10px", fontWeight: "bold", background: "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)" }}>
            ● {unreadCount} unread
          </span>
        )}
      </div>

      {/* Message Thread */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "10px", background: "#080f1e" }} className="custom-scrollbar">
        {messages.map(m => (
          <div key={m.id} style={{
            alignSelf: m.from === "ncpor" ? "flex-start" : "flex-end",
            maxWidth: "90%",
            background: m.from === "ncpor" ? "#0d2040" : "#0a2018",
            borderLeft: m.from === "ncpor" ? "2px solid #58a6ff" : "2px solid #22c55e",
            borderRadius: "4px",
            padding: "8px",
            fontSize: "11px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", gap: "12px", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", color: m.from === "ncpor" ? "#58a6ff" : "#22c55e", fontSize: "9px", textTransform: "uppercase" }}>
                {m.from === "ncpor" ? "NCPOR Control · Goa" : "You (Lead Scientist)"}
              </span>
              <span style={{ color: "#8b949e", fontSize: "9px", fontFamily: "monospace" }}>{m.timestamp}</span>
            </div>
            <div style={{ color: "#e2e8f0", lineHeight: "1.4" }}>
              {m.priority === "urgent" && <span style={{ color: "#ef4444", fontWeight: "bold", marginRight: "6px", background: "rgba(239,68,68,0.1)", padding: "1px 4px", borderRadius: "2px", fontSize: "9px" }}>⚠ URGENT</span>}
              {m.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Composer */}
      <div style={{ padding: "12px", background: "#0a1628", borderTop: "1px solid #1e3a5f" }}>
        <textarea
          rows={2}
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          placeholder="Reply to NCPOR..."
          style={{
            width: "100%",
            background: "#161b22",
            border: "1px solid #1e3a5f",
            color: "#e2e8f0",
            fontSize: "11px",
            padding: "6px",
            borderRadius: "4px",
            resize: "none",
            marginTop: "6px",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button 
            onClick={() => handleSend("normal")}
            style={{ flex: 1, background: "#1e3a5f", color: "#e2e8f0", border: "none", padding: "6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", cursor: "pointer", transition: "background 0.2s" }}
            onMouseOver={e => e.currentTarget.style.background = "#2a4a7f"}
            onMouseOut={e => e.currentTarget.style.background = "#1e3a5f"}
          >
            Send Reply
          </button>
          <button 
            onClick={() => handleSend("urgent")}
            style={{ flex: 1, background: "#1a0a0a", color: "#ef4444", border: "1px solid #ef4444", padding: "6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "#1a0a0a"; }}
          >
            ⚠ Emergency
          </button>
        </div>
        {!satelliteOnline && pendingCount > 0 && (
          <div style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid #f59e0b",
            borderRadius: "4px",
            padding: "6px 8px",
            fontSize: "10px",
            color: "#f59e0b",
            marginTop: "6px",
          }}>
            ⏳ {pendingCount} message{pendingCount !== 1 ? "s" : ""} queued
            — will sync when satellite reconnects
          </div>
        )}
      </div>
    </div>
  );
}
