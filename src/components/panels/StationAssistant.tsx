"use client";

import { useState, useRef, useEffect } from "react";
import { useStationStore } from "@/lib/store";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const API_BASE = "http://127.0.0.1:8000";

export function StationAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stationState = useStationStore((s) => s.stationState);

  const generatorFuel = stationState.generatorFuel;
  const generatorOutput = stationState.generatorOutput;
  const environment = stationState.environment;

  const rules = [];
  if (generatorFuel > 0 && generatorOutput / generatorFuel < 0.45) {
    rules.push("⚡ Energy efficiency below optimal. Generator output-to-fuel ratio is low. Consider load balancing.");
  }
  if (environment.windSpeed > 40 && !environment.blizzard) {
    rules.push("🌨 Wind speed elevated. Pre-position emergency supplies. Blizzard conditions possible within 6 hours.");
  }
  if (generatorFuel > 60 && !environment.blizzard) {
    rules.push("🔧 Optimal maintenance window detected. All systems stable — schedule generator service now.");
  }
  if (generatorFuel < 40) {
    const daysRemaining = generatorFuel / (100 / 30);
    rules.push(`⛽ Resupply recommended. At current consumption rate, fuel reserves will reach critical in ~${daysRemaining.toFixed(1)} days.`);
  }

  const analysisSection = rules.length > 0 ? (
    <div className="w-full flex flex-col gap-2 p-3 bg-[#080f1e] border-b border-[#1e3a5f]">
      <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">🤖 LIVE ANALYSIS</div>
      {rules.map((rule, idx) => (
        <div key={idx} className="bg-[#0a1628] border-l-[3px] border-l-[#58a6ff] border border-[#1e3a5f] p-2.5 text-[11px] text-[#e2e8f0] rounded-sm leading-snug">
          {rule}
        </div>
      ))}
    </div>
  ) : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function sendQuestion() {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ask-manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Connection error — is the offline assistant service running?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <>
        {analysisSection}
        <button
          onClick={() => setOpen(true)}
          className="absolute bottom-4 right-[19rem] z-10 rounded-full bg-[#58a6ff] hover:bg-blue-400 text-white px-4 py-2 text-sm font-semibold shadow-lg"
        >
          🤖 Station Manual Assistant
        </button>
      </>
    );
  }

  return (
    <>
      {analysisSection}
      <div className="w-full h-[28rem] rounded-lg bg-zinc-900/95 backdrop-blur flex flex-col shadow-xl" style={{ borderTop: "1px solid #1e3a5f" }}>
      <div className="flex justify-between items-center p-3 border-b border-zinc-700">
        <div>
          <h2 className="font-bold text-white text-sm">Station Manual Assistant</h2>
          <p className="text-xs text-zinc-500">Offline · Ollama (llama3.2:3b)</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-zinc-500 text-xs">
            Ask about station procedures, fault codes, or maintenance — answered entirely offline from local manuals.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg p-2 max-w-[85%] ${
              m.role === "user"
                ? "bg-blue-600 text-white ml-auto"
                : "bg-zinc-800 text-zinc-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="bg-zinc-800 text-zinc-400 text-sm rounded-lg p-2 max-w-[85%]">
            Thinking...
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-700 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendQuestion()}
          placeholder="e.g. What does Fault Code 220 mean?"
          className="flex-1 bg-zinc-800 text-white text-sm rounded px-2 py-1.5 outline-none"
        />
        <button
          onClick={sendQuestion}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-3 rounded"
        >
          Ask
        </button>
      </div>
    </div>
    </>
  );
}