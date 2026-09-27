"use client";

interface ArchitectureModalProps {
  onClose: () => void;
}

export function ArchitectureModal({ onClose }: ArchitectureModalProps) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(2,6,23,0.95)" }} className="flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#080f1e] border border-[#1e3a5f] rounded-lg p-6 max-w-2xl w-full text-[#e2e8f0] shadow-2xl flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-[#58a6ff] uppercase tracking-wide">PolarTwin System Architecture</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-xl">✕</button>
        </div>

        {/* LAYER 1 — ANTARCTICA EDGE */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Layer 1 — Antarctica Edge</h3>
          <div className="border border-[#1e3a5f] bg-[#0a1628] rounded p-4 flex flex-col gap-4 shadow-inner">
            <div className="flex items-center justify-between gap-2 text-center text-xs font-mono">
              <div className="bg-[#0d2040] border border-[#1e3a5f] p-2 rounded flex-1">
                <span className="text-[#58a6ff]">[MQTT Sensors]</span>
              </div>
              <div className="text-zinc-500">→</div>
              <div className="bg-[#0d2040] border border-[#1e3a5f] p-2 rounded flex-1">
                <span className="text-[#58a6ff]">[Mosquitto Broker]</span>
              </div>
              <div className="text-zinc-500">→</div>
              <div className="bg-[#0d2040] border border-[#1e3a5f] p-2 rounded flex-1">
                <span className="text-[#58a6ff]">[FastAPI Edge Server]</span>
              </div>
            </div>
            <div className="flex justify-center gap-6 text-center text-xs font-mono">
              <div className="flex flex-col gap-1 items-center flex-1">
                <div className="bg-[#0d2040] border border-[#1e3a5f] p-2 rounded w-full">
                  <span className="text-[#22c55e]">[Ollama LLM]</span> + <span className="text-[#22c55e]">[ChromaDB]</span>
                </div>
              </div>
              <div className="flex items-center text-zinc-500">→</div>
              <div className="bg-[#0d2040] border border-[#58a6ff] p-2 rounded flex-1 font-bold text-white shadow-[0_0_10px_rgba(88,166,255,0.2)]">
                [Station Dashboard (Next.js)]
              </div>
            </div>
            <div className="flex justify-center mt-2">
              <div className="bg-[#1e140a] border border-[#f59e0b]/50 p-2 rounded text-xs font-mono text-[#f59e0b] w-1/2 text-center">
                [SQLite Offline Queue]
              </div>
            </div>
          </div>
        </div>

        {/* LAYER 2 — SATELLITE LINK */}
        <div className="flex flex-col items-center justify-center -my-2 relative z-10">
          <div className="border border-dashed border-[#f59e0b] bg-[#1a1105] rounded-full px-6 py-2 flex flex-col items-center shadow-lg">
            <span className="text-sm">🛰️</span>
            <span className="text-[10px] font-bold text-[#f59e0b] mt-1">↕ Iridium Satellite · 2.4 Mbps · &lt;200ms latency</span>
            <span className="text-[9px] text-[#f59e0b]/70 mt-0.5">Data encrypted · Queued during outages</span>
          </div>
        </div>

        {/* LAYER 3 — INDIA CLOUD */}
        <div className="flex flex-col gap-2 mt-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Layer 3 — India Cloud</h3>
          <div className="border border-[#1e4d2b] bg-[#051109] rounded p-4 flex flex-col gap-4 shadow-inner">
            <div className="flex items-center justify-between gap-2 text-center text-xs font-mono">
              <div className="bg-[#0a1e12] border border-[#1e4d2b] p-2 rounded flex-1">
                <span className="text-[#22c55e]">[NCPOR Control Center]</span>
              </div>
              <div className="text-zinc-500">→</div>
              <div className="bg-[#0a1e12] border border-[#1e4d2b] p-2 rounded flex-1">
                <span className="text-[#22c55e]">[PostgreSQL/Supabase]</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 text-center text-xs font-mono">
              <div className="bg-[#0a1e12] border border-[#1e4d2b] p-2 rounded flex-1">
                <span className="text-[#22c55e]">[Operator Dashboard]</span>
              </div>
              <div className="bg-[#0a1e12] border border-[#1e4d2b] p-2 rounded flex-1 mx-2">
                <span className="text-[#22c55e]">[Alert Management]</span>
              </div>
              <div className="bg-[#0a1e12] border border-[#1e4d2b] p-2 rounded flex-1">
                <span className="text-[#22c55e]">[Resupply Dispatch System]</span>
              </div>
            </div>
          </div>
        </div>

        {/* SCALABILITY */}
        <div style={{
          marginTop: "4px",
          padding: "12px",
          background: "rgba(30,58,95,0.3)",
          border: "1px solid #1e3a5f",
          borderRadius: "6px",
          fontSize: "11px",
          color: "#8b949e",
        }}>
          <div style={{ color: "#58a6ff", marginBottom: "6px", fontWeight: 500 }}>
            SCALABILITY & FUTURE SCOPE
          </div>
          • Designed to connect unlimited stations — each station runs its own edge server<br/>
          • NCPOR cloud layer aggregates all stations in one operator view<br/>
          • Planned additions: Flutter mobile companion app, drone telemetry integration, satellite imagery overlay<br/>
          • Fully containerized — deployable via Docker on any station hardware in &lt;2 hours
        </div>

      </div>
    </div>
  );
}
