"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStationStore } from "@/lib/store";

export function RoleSelector() {
  const [selected, setSelected] = useState<"scientist" | "operator" | null>(null);
  const router = useRouter();

  function handleSelect(role: "scientist" | "operator") {
    setSelected(role);
    useStationStore.getState().setUserRole(role);
    setTimeout(() => {
      router.push(role === "scientist" ? "/" : "/operator");
    }, 1200);
  }

  if (selected) {
    return (
      <div className="fixed inset-0 z-50 bg-[#010409] flex flex-col items-center justify-center font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0a1628] via-[#010409] to-[#000000]"></div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 relative flex items-center justify-center">
             <div className="absolute inset-0 rounded-full border-t-2 border-[#58a6ff] animate-spin"></div>
             <div className="absolute inset-2 rounded-full border-b-2 border-[#22c55e] animate-[spin_1.5s_linear_infinite_reverse]"></div>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <p className="text-[#8b949e] font-mono tracking-widest uppercase text-sm">
            Authenticating as <span className="text-[#e2e8f0] font-bold">{selected === "scientist" ? "Lead Scientist" : "NCPOR Operator"}</span>...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#010409] flex flex-col items-center justify-center font-sans overflow-hidden">
      {/* Cinematic Background Mesh */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0a1628] via-[#010409] to-[#000000]"></div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e3a5f0f_1px,transparent_1px),linear-gradient(to_bottom,#1e3a5f0f_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="bg-[#080f1e]/80 backdrop-blur-md border border-[#1e3a5f] rounded-xl p-10 w-full max-w-lg shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#58a6ff]/20 to-transparent blur-2xl"></div>
        
        <div className="flex flex-col items-center mb-10">
          <span className="text-[#58a6ff] font-bold tracking-[0.2em] text-2xl flex items-center gap-3 mb-2" style={{ textShadow: "0 0 15px rgba(88, 166, 255, 0.4)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            PolarTwin
          </span>
          <p className="text-[#8b949e] text-[11px] uppercase tracking-[0.2em] font-mono">Edge-to-Cloud Access Portal</p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleSelect("scientist")}
            className="w-full bg-[#0a1628]/90 border border-[#1e3a5f] hover:border-[#22c55e] group-hover/btn relative p-5 flex items-center gap-5 rounded-lg transition-all cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(34,197,94,0.15)] text-left group overflow-hidden"
          >
            <div className="w-1.5 h-12 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e] absolute left-0 top-1/2 -translate-y-1/2 scale-y-0 group-hover:scale-y-100 transition-transform"></div>
            <div className="w-12 h-12 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-md flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-[#e2e8f0] tracking-[0.1em] text-sm mb-1 uppercase">Lead Scientist</h3>
              <p className="text-[10px] text-[#8b949e] font-mono tracking-widest uppercase">Bharati Station, Antarctica · Edge Node</p>
            </div>
          </button>

          <button
            onClick={() => handleSelect("operator")}
            className="w-full bg-[#0a1628]/90 border border-[#1e3a5f] hover:border-[#58a6ff] group-hover/btn relative p-5 flex items-center gap-5 rounded-lg transition-all cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(88,166,255,0.15)] text-left group overflow-hidden"
          >
            <div className="w-1.5 h-12 bg-[#58a6ff] rounded-full shadow-[0_0_10px_#58a6ff] absolute left-0 top-1/2 -translate-y-1/2 scale-y-0 group-hover:scale-y-100 transition-transform"></div>
            <div className="w-12 h-12 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-md flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-[#e2e8f0] tracking-[0.1em] text-sm mb-1 uppercase">NCPOR Operator</h3>
              <p className="text-[10px] text-[#8b949e] font-mono tracking-widest uppercase">Global Ops HQ, Goa · Cloud Node</p>
            </div>
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-[#1e3a5f]/50 text-center">
          <p className="text-[9px] text-[#4a6380] font-mono tracking-widest uppercase">Select profile to securely authenticate</p>
        </div>
      </div>
    </div>
  );
}