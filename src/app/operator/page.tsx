"use client";

import { useTelemetry } from "@/lib/useTelemetry";
import { useStationStore } from "@/lib/store";
import StationCanvas from "@/components/scene/StationCanvas";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

function SectionHeader({ title, children }: { title: string, children?: React.ReactNode }) {
  return (
    <div style={{
      background: "#0a1628",
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
      <span>{title}</span>
      {children}
    </div>
  );
}

const DEFCON_LABELS: Record<number, string> = {
  5: "ALL CLEAR",
  4: "ADVISORY", 
  3: "ELEVATED",
  2: "HIGH ALERT",
  1: "CRITICAL",
};

export default function OperatorView() {
  useTelemetry();
  const router = useRouter();
  
  const stationStore = useStationStore();
  const stationState = stationStore.cloudState;
  
  const satelliteOnline = stationState.satelliteOnline;
  const lastSyncTime = stationState.lastSyncTime;
  const timestamp = stationState.timestamp;
  
  const messages = stationState.messages;
  const sendMessage = stationStore.sendMessage;
  const reorderRequests = stationState.reorderRequests;
  const updateReorderStatus = stationStore.updateReorderStatus;
  
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Calculations
  const fuel = stationState.generatorFuel;
  const pressure = stationState.pipelinePressure;
  const blizzard = stationState.environment.blizzard;
  
  let defcon = 5;
  if (fuel < 8 && blizzard && (pressure <= 1.5 || pressure >= 8)) defcon = 1;
  else if (blizzard || fuel < 15) defcon = 2;
  else if (fuel < 30 || pressure <= 2.5 || pressure >= 6) defcon = 3;
  else if (fuel < 50) defcon = 4;
  
  const defconColor = defcon <= 2 ? "#ef4444" : defcon === 3 ? "#f59e0b" : "#22c55e";
  const fuelColor = fuel < 15 ? "#ef4444" : fuel < 30 ? "#f59e0b" : "#22c55e";
  const pressureColor = (pressure <= 1.5 || pressure >= 8) ? "#ef4444" : (pressure <= 2.5 || pressure >= 6) ? "#f59e0b" : "#22c55e";
  
  const pendingCount = reorderRequests.filter(r => r.status === "pending").length;
  const dispatchedCount = reorderRequests.filter(r => r.status === "dispatched").length;

  const activeProtocols = stationState.activeProtocols;
  const activeProtocolsFiltered = activeProtocols.filter(p => p.active);

  const unreadFromStation = messages.filter(
    m => m.from === "station" && !m.read
  ).length;

  const alerts = [];
  activeProtocolsFiltered.forEach(p => {
    alerts.push({ text: `🚨 ${p.name} ACTIVATED`, time: p.activatedAt || "just now", color: "#ef4444" });
  });
  if (fuel < 15) alerts.push({ text: "🔴 Fuel critical", time: "just now", color: "#ef4444" });
  else if (fuel < 30) alerts.push({ text: "⚠ Fuel below threshold", time: "just now", color: "#f59e0b" });
  
  if (blizzard) alerts.push({ text: "🌨 Blizzard active", time: "just now", color: "#ef4444" });
  
  if (pressure < 2.5 || pressure > 6) alerts.push({ text: "⚠ Pipeline pressure abnormal", time: "just now", color: "#f59e0b" });
  
  alerts.push({ text: "✓ Telemetry stream active", time: "just now", color: "#22c55e" });
  alerts.push({ text: "✓ Edge server responding", time: "just now", color: "#22c55e" });
  alerts.push({ text: `✓ Last sync: ${satelliteOnline ? (timestamp ? new Date(timestamp).toLocaleTimeString() : "--:--:--") : lastSyncTime || "--:--:--"}`, time: "just now", color: "#22c55e" });

  const crew = [
    { name: "Dr. Priya Sharma", role: "Lead Scientist", status: "On-Duty" },
    { name: "Eng. Rahul Mehta", role: "Power Engineer", status: "On-Duty" },
    { name: "Dr. Anil Verma", role: "Glaciologist", status: "Research" },
    { name: "Ms. Sunita Rao", role: "Medical Officer", status: "Standby" },
    { name: "Eng. Vikram Singh", role: "Systems Engineer", status: "Rest" },
  ];

  return (
    <main style={{ height: "100vh", width: "100vw", background: "#020617", color: "#e2e8f0", fontFamily: "sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* TOP NAVBAR */}
      <div style={{ height: "48px", background: "#0a1628", borderBottom: "1px solid #1e3a5f", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#58a6ff", fontWeight: "bold", letterSpacing: "0.1em", fontSize: "12px" }}>⬡ NCPOR CONTROL</span>
          <span style={{ color: "#1e3a5f" }}>|</span>
          <span style={{ color: "#8b949e", fontSize: "11px", letterSpacing: "0.05em" }}>Bharati Remote Management</span>
          <span style={{
            background: "rgba(88,166,255,0.15)",
            border: "1px solid rgba(88,166,255,0.3)",
            color: "#58a6ff",
            fontSize: "9px",
            padding: "2px 6px",
            borderRadius: "3px",
            letterSpacing: "0.5px",
            fontWeight: "bold"
          }}>
            NCPOR OPERATOR
          </span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "10px", fontWeight: "bold", letterSpacing: "1px", color: satelliteOnline ? "#22c55e" : "#ef4444" }}>
            ● SAT LINK {satelliteOnline ? "SECURE" : "OFFLINE"}
          </span>
          <span style={{ fontSize: "11px", color: "#8b949e", fontFamily: "monospace" }}>
            {satelliteOnline ? (timestamp ? new Date(timestamp).toLocaleTimeString() : "--:--:--") : `Last sync: ${lastSyncTime || "--:--:--"}`}
          </span>
          {unreadFromStation > 0 && (
            <span style={{ 
              background: "#ef4444", color: "white", fontSize: "10px", 
              fontWeight: "bold", padding: "2px 6px", borderRadius: "10px",
              display: "flex", alignItems: "center", gap: "4px"
            }}>
              📨 {unreadFromStation}
            </span>
          )}
          <button
            onClick={() => router.push("/login")}
            style={{
              background: "rgba(30,58,95,0.3)",
              border: "1px solid #1e3a5f",
              color: "#8b949e",
              fontSize: "11px",
              padding: "4px 12px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ← LOGOUT
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div style={{ height: "36px", background: "#020617", borderBottom: "1px solid #1e3a5f", display: "flex", alignItems: "center", padding: "0 16px", gap: "24px", fontSize: "10px", fontWeight: "bold", letterSpacing: "0.05em", flexShrink: 0, overflowX: "auto", color: "#8b949e" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <span>DEFCON:</span>
          <span style={{ color: defconColor }}>{defcon}</span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <span>FUEL:</span>
          <span style={{ color: fuelColor, fontFamily: "monospace" }}>{fuel.toFixed(1)}%</span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <span>CO2:</span>
          <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>14.4 kg</span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <span>CREW:</span>
          <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>5</span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <span>TEMP:</span>
          <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>{stationState.environment.temperature.toFixed(1)}°C</span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <span>WIND:</span>
          <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>{stationState.environment.windSpeed.toFixed(1)} km/h</span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <span>TREATY:</span>
          <span style={{ color: "#22c55e", fontFamily: "monospace" }}>84% COMPLIANT</span>
        </div>
      </div>

      {/* MAIN 3-COLUMN LAYOUT */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* LEFT SIDEBAR */}
        <div style={{ width: "260px", flexShrink: 0, background: "#080f1e", borderRight: "1px solid #1e3a5f", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          
          <div style={{ borderBottom: "1px solid #1e3a5f" }}>
            <SectionHeader title="🛡 GLOBAL ALERT" />
            <div style={{ padding: "16px" }}>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: defconColor }}>
                  DEFCON {defcon}
                </div>
                <div style={{ fontSize: "11px", color: defconColor, letterSpacing: "0.5px", marginTop: "2px" }}>
                  {DEFCON_LABELS[defcon]}
                </div>
                <div style={{ fontSize: "9px", color: "#4a6380", marginTop: "4px" }}>
                  ℹ 5=Normal · 4=Advisory · 3=Elevated · 2=High Alert · 1=Critical
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px", fontWeight: "bold", background: "#020617", padding: "12px", borderRadius: "4px", border: "1px solid #1e3a5f" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#8b949e" }}>Fuel</span>
                  <span style={{ color: fuelColor }}>● {fuel.toFixed(1)}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#8b949e" }}>Pipeline</span>
                  <span style={{ color: pressureColor }}>● {pressure.toFixed(2)} bar</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#8b949e" }}>Weather</span>
                  <span style={{ color: blizzard ? "#ef4444" : "#22c55e" }}>● {blizzard ? "ACTIVE" : "Clear"}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderBottom: "1px solid #1e3a5f" }}>
            <SectionHeader title="👥 STAFF & HEALTH" />
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {crew.map((member, i) => (
                <div key={i} style={{ background: "#020617", border: "1px solid #1e3a5f", borderRadius: "4px", padding: "8px", fontSize: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "bold", color: "#e2e8f0" }}>{member.name}</span>
                    <span style={{ color: "#22c55e" }}>● {member.status}</span>
                  </div>
                  <div style={{ color: "#8b949e" }}>{member.role}</div>
                </div>
              ))}
              <div style={{ fontSize: "9px", color: "#4a6380", textAlign: "center", fontStyle: "italic", marginTop: "4px" }}>
                Medical Officer on standby<br/>Next health check: 06:00 UTC
              </div>
            </div>
          </div>

          <div>
            <SectionHeader title="🔔 ALERT FEED" />
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {alerts.map((al, i) => (
                <div key={i} style={{ display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "10px", background: "#020617", padding: "8px", borderRadius: "4px", border: "1px solid #1e3a5f" }}>
                  <span style={{ color: al.color }}>●</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                    <span style={{ color: al.color, fontWeight: "bold" }}>{al.text}</span>
                    <span style={{ color: "#4a6380", fontSize: "9px" }}>{al.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e3a5f" }}>
            <SectionHeader title="🚨 ACTIVE PROTOCOLS" />
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {activeProtocolsFiltered.length === 0 ? (
                <div style={{ color: "#22c55e", fontSize: "10px", textAlign: "center", padding: "8px", border: "1px dashed #1e3a5f", borderRadius: "4px" }}>
                  ✓ No active emergency protocols
                </div>
              ) : (
                activeProtocolsFiltered.map(p => {
                  const completedItems = p.checklist.filter(c => c.checked).length;
                  const totalItems = p.checklist.length;
                  const progressPct = Math.round((completedItems / totalItems) * 100);
                  
                  return (
                    <div key={p.id} style={{ border: "1px solid #ef4444", borderRadius: "4px", background: "#020617", overflow: "hidden", animation: "pulse 2s infinite" }}>
                      <style dangerouslySetInnerHTML={{__html: `
                        @keyframes pulse {
                          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                          70% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
                          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                        }
                      `}} />
                      <div style={{ background: "rgba(239,68,68,0.1)", padding: "8px", borderBottom: "1px solid #1e3a5f" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "11px" }}>🚨 {p.name}</span>
                          <span style={{ background: "#ef4444", color: "white", fontSize: "8px", padding: "2px 4px", borderRadius: "2px", fontWeight: "bold" }}>ACTIVE</span>
                        </div>
                        <div style={{ fontSize: "9px", color: "#8b949e", marginTop: "4px" }}>ACTIVE since {p.activatedAt}</div>
                      </div>
                      <div style={{ padding: "8px" }}>
                        <div style={{ fontSize: "9px", color: "#e2e8f0", marginBottom: "4px", fontWeight: "bold" }}>CHECKLIST PROGRESS: {completedItems}/{totalItems} complete</div>
                        <div style={{ width: "100%", height: "4px", background: "#1e3a5f", borderRadius: "2px", marginBottom: "8px", overflow: "hidden" }}>
                          <div style={{ width: `${progressPct}%`, height: "100%", background: "#ef4444", transition: "width 0.3s" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {p.checklist.map((item, idx) => (
                            <div key={idx} style={{ fontSize: "9px", display: "flex", gap: "6px", alignItems: "flex-start" }}>
                              {item.checked ? (
                                <>
                                  <span style={{ color: "#22c55e", fontWeight: "bold" }}>✓</span>
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ color: "#8b949e", textDecoration: "line-through" }}>{item.item}</span>
                                    <span style={{ color: "#4a6380", fontSize: "8px" }}>[{item.checkedBy} · {item.checkedAt}]</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span style={{ color: "#4a6380", fontWeight: "bold" }}>○</span>
                                  <span style={{ color: "#e2e8f0" }}>{item.item}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* CENTER AREA */}
        <div style={{ flex: 1, position: "relative", background: "#020617" }}>
          <div style={{
            position: "absolute",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            background: "rgba(6,13,26,0.9)",
            border: "1px solid #58a6ff",
            borderRadius: "4px",
            padding: "4px 12px",
            fontSize: "9px",
            color: "#58a6ff",
            fontFamily: "monospace",
            letterSpacing: "1px",
            pointerEvents: "none",
          }}>
            📡 REMOTE VIEW — STREAMING VIA SATELLITE — READ ONLY
          </div>
          
          <StationCanvas />

          <div style={{ position: "absolute", bottom: "16px", left: "16px", zIndex: 10, background: "rgba(6,13,26,0.8)", border: "1px solid #1e3a5f", padding: "8px 12px", borderRadius: "4px" }}>
             <div style={{ fontSize: "10px", color: "#8b949e", marginBottom: "4px", fontWeight: "bold", letterSpacing: "0.1em" }}>PIPELINE STATUS</div>
             <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", color: "#e2e8f0" }}><span style={{ display: "inline-block", width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%" }}></span> Nominal (2.5 - 6.0 bar)</div>
             <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", color: "#e2e8f0", marginTop: "4px" }}><span style={{ display: "inline-block", width: "8px", height: "8px", background: "#f59e0b", borderRadius: "50%" }}></span> Warning (1.5 - 2.5 / 6.0 - 8.0)</div>
             <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", color: "#e2e8f0", marginTop: "4px" }}><span style={{ display: "inline-block", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%" }}></span> Critical (&lt; 1.5 / &gt; 8.0 bar)</div>
          </div>

          <div style={{ position: "absolute", bottom: "16px", right: "16px", zIndex: 10, background: "rgba(6,13,26,0.8)", border: "1px solid #1e3a5f", padding: "8px 12px", borderRadius: "4px", textAlign: "right" }}>
             <div style={{ fontSize: "10px", color: "#8b949e", fontWeight: "bold", letterSpacing: "0.1em" }}>COORDINATES</div>
             <div style={{ fontSize: "11px", color: "#e2e8f0", fontFamily: "monospace", marginTop: "4px" }}>69° 24' 28" S<br/>76° 11' 14" E</div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: "280px", flexShrink: 0, background: "#080f1e", borderLeft: "1px solid #1e3a5f", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          
          <div style={{ borderBottom: "1px solid #1e3a5f", display: "flex", flexDirection: "column", height: "360px" }}>
            <SectionHeader title="📨 COMMUNICATIONS">
              {unreadFromStation > 0 && (
                <span style={{ color: "#ef4444", fontSize: "10px", fontWeight: "bold", background: "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)" }}>
                  ● {unreadFromStation} unread
                </span>
              )}
            </SectionHeader>
            
            <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.slice(-5).map(m => (
                <div key={m.id} style={{
                  alignSelf: m.from === "ncpor" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: m.from === "ncpor" ? "#0d2040" : "#161b22",
                  borderLeft: m.from === "ncpor" ? "2px solid #58a6ff" : "2px solid #22c55e",
                  borderRadius: "4px",
                  padding: "8px",
                  fontSize: "11px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", gap: "8px" }}>
                    <span style={{ fontWeight: "bold", color: m.from === "ncpor" ? "#58a6ff" : "#22c55e", textTransform: "uppercase", fontSize: "9px" }}>
                      {m.from === "ncpor" ? "NCPOR" : "STATION"}
                    </span>
                    <span style={{ color: "#8b949e", fontSize: "9px", fontFamily: "monospace" }}>{m.timestamp}</span>
                  </div>
                  <div style={{ color: "#e2e8f0", lineHeight: "1.4" }}>
                    {m.priority === "urgent" && <span style={{ color: "#ef4444", fontWeight: "bold", marginRight: "4px" }}>[URGENT]</span>}
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: "12px", borderTop: "1px solid #1e3a5f", background: "#0a1628" }}>
              <textarea 
                rows={2}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder="Type message to station..."
                style={{ width: "100%", background: "#161b22", border: "1px solid #1e3a5f", color: "#e2e8f0", fontSize: "11px", padding: "6px", borderRadius: "4px", resize: "none", marginBottom: "8px", outline: "none" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => {
                    if (messageText.trim()) {
                      sendMessage("ncpor", messageText, "normal");
                      setMessageText("");
                    }
                  }}
                  style={{ flex: 1, background: "#1e3a5f", color: "#58a6ff", border: "none", padding: "6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Send
                </button>
                <button 
                  onClick={() => {
                    if (messageText.trim()) {
                      sendMessage("ncpor", messageText, "urgent");
                      setMessageText("");
                    }
                  }}
                  style={{ flex: 1, background: "#1a0808", color: "#ef4444", border: "none", padding: "6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", cursor: "pointer" }}
                >
                  ⚠ Urgent
                </button>
              </div>
            </div>
          </div>

          <div style={{ borderBottom: "1px solid #1e3a5f" }}>
            <SectionHeader title="📦 RESUPPLY LOGISTICS" />
            <div style={{ padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", background: "#020617", border: "1px solid #1e3a5f", borderRadius: "4px", padding: "8px", marginBottom: "12px" }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: "9px", color: "#8b949e", textTransform: "uppercase" }}>Total</div><div style={{ fontSize: "12px", fontWeight: "bold", fontFamily: "monospace" }}>{reorderRequests.length}</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: "9px", color: "#8b949e", textTransform: "uppercase" }}>Awaiting</div><div style={{ fontSize: "12px", fontWeight: "bold", fontFamily: "monospace", color: "#f59e0b" }}>{pendingCount}</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: "9px", color: "#8b949e", textTransform: "uppercase" }}>In Transit</div><div style={{ fontSize: "12px", fontWeight: "bold", fontFamily: "monospace", color: "#22c55e" }}>{dispatchedCount}</div></div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {reorderRequests.length === 0 && <div style={{ fontSize: "10px", color: "#8b949e", textAlign: "center", fontStyle: "italic", padding: "12px" }}>Queue Empty</div>}
                {reorderRequests.map(req => (
                  <div key={req.id} style={{ background: "#020617", border: "1px solid #1e3a5f", borderRadius: "4px", padding: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "bold", color: "#e2e8f0" }}>{req.itemName}</span>
                      <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: req.status === "pending" ? "#f59e0b" : req.status === "dispatched" ? "#22c55e" : "#ef4444" }}>
                        {req.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#8b949e", marginBottom: "8px" }}>
                      <span>Qty: <span style={{ fontFamily: "monospace", color: "#e2e8f0" }}>{req.quantity}</span></span>
                      <span style={{ fontFamily: "monospace" }}>{req.requestedAt}</span>
                    </div>
                    
                    {req.status === "pending" && (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button onClick={() => updateReorderStatus(req.id, "dispatched", "14-21 days", "NCPOR Operator")} style={{ flex: 1, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", padding: "4px", borderRadius: "2px", fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", cursor: "pointer" }}>Approve</button>
                        <button onClick={() => updateReorderStatus(req.id, "rejected")} style={{ flex: 1, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "4px", borderRadius: "2px", fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", cursor: "pointer" }}>Reject</button>
                      </div>
                    )}
                    {req.status === "dispatched" && (
                      <div style={{ fontSize: "9px", color: "#22c55e", fontWeight: "bold", textAlign: "center" }}>EN ROUTE VIA VESSEL</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <SectionHeader title="🌿 SUSTAINABILITY" />
            <div style={{ padding: "12px", fontSize: "10px", color: "#e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#8b949e" }}>Est. CO2 Today:</span>
                <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>14.4 kg</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#8b949e" }}>Waste Storage:</span>
                <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>15.2 / 200 kg</span>
              </div>
              
              <div style={{ marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8b949e" }}>Treaty Compliance:</span>
                <span style={{ color: "#22c55e", fontWeight: "bold", fontFamily: "monospace" }}>84% COMPLIANT</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "#020617", border: "1px solid #1e3a5f", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                <div style={{ width: "84%", height: "100%", background: "#22c55e" }}></div>
              </div>
              <div style={{ fontSize: "9px", color: "#4a6380", fontStyle: "italic", textAlign: "center" }}>
                Per Antarctic Treaty Protocol — Annex III
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
