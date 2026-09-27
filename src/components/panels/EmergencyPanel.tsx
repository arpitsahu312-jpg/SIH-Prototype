"use client";

import { useState, useEffect } from "react";
import { useStationStore } from "@/lib/store";

export function EmergencyPanel() {
  const activeProtocols = useStationStore((s) => s.stationState.activeProtocols);
  const activateProtocol = useStationStore((s) => s.activateProtocol);
  const checkProtocolItem = useStationStore((s) => s.checkProtocolItem);
  const stationState = useStationStore((s) => s.stationState);
  
  const [showInfo, setShowInfo] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  const triggers = {
    "blizzard-7": stationState.environment.blizzard,
    "fuel-alpha": stationState.generatorFuel < 20,
    "pipeline-lockdown": stationState.pipelinePressure < 2.0,
  };

  useEffect(() => {
    let shouldExpand = false;
    const nextExpanded = { ...expanded };

    activeProtocols.forEach((protocol) => {
      const isTriggered = triggers[protocol.id as keyof typeof triggers];
      
      if (isTriggered && !protocol.active) {
        activateProtocol(protocol.id);
      }
      
      if ((protocol.active || isTriggered) && !expanded[protocol.id]) {
        nextExpanded[protocol.id] = true;
        shouldExpand = true;
      }
    });

    if (shouldExpand) {
      setExpanded(nextExpanded);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationState.environment.blizzard, stationState.generatorFuel, stationState.pipelinePressure]);

  const deactivateProtocol = useStationStore(s => s.deactivateProtocol);

  useEffect(() => {
    const state = stationState;
    
    // Blizzard Protocol — deactivate if blizzard clears
    const blizzardShouldBeActive = 
      state.environment.blizzard || 
      state.environment.windSpeed > 80;
    if (!blizzardShouldBeActive) {
      deactivateProtocol("blizzard-7");
    }
  
    // Fuel Emergency — deactivate if fuel recovers above 20%
    const fuelShouldBeActive = state.generatorFuel < 20;
    if (!fuelShouldBeActive) {
      deactivateProtocol("fuel-alpha");
    }
  
    // Pipeline Lockdown — deactivate if pressure normalizes
    const pipelineShouldBeActive = 
      state.pipelinePressure < 2.0 || 
      state.pipelinePressure > 8.0;
    if (!pipelineShouldBeActive) {
      deactivateProtocol("pipeline-lockdown");
    }
  
  }, [
    stationState.environment.blizzard,
    stationState.environment.windSpeed,
    stationState.generatorFuel,
    stationState.pipelinePressure,
    deactivateProtocol
  ]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div className="w-full border-b flex flex-col" style={{ borderColor: "#1e3a5f", background: "#080f1e" }}>
        <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: "#1e3a5f", background: "#0a1628" }}>
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-semibold text-[#e2e8f0] m-0 uppercase">🚨 Emergency Protocols</h2>
            <button 
              onClick={() => setShowInfo(true)}
              className="w-4 h-4 rounded-full border border-[#8b949e] flex items-center justify-center text-[10px] text-[#8b949e] hover:text-white hover:border-white transition-colors cursor-pointer"
              title="Emergency Protocol System"
            >
              ℹ
            </button>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {activeProtocols.map((protocol) => {
            const isActive = protocol.active;
            const isExpanded = !!expanded[protocol.id];
            
            return (
              <div key={protocol.id} className="flex flex-col gap-2 rounded" style={{ background: "#020617", border: "1px solid #1e3a5f" }}>
                <div 
                  className="flex justify-between items-center px-3 py-2 cursor-pointer select-none"
                  onClick={() => toggleExpand(protocol.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-[#e2e8f0]">{protocol.name}</span>
                    <span className="text-[9px] text-[#8b949e]">Source: Standard Procedure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isActive ? 'animate-pulse' : ''}`}
                      style={{
                        background: isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 148, 158, 0.15)',
                        color: isActive ? '#ef4444' : '#8b949e',
                        border: `1px solid ${isActive ? '#ef4444' : '#1e3a5f'}`
                      }}
                    >
                      {isActive ? 'ACTIVE' : 'READY'}
                    </span>
                    <span className="text-[#8b949e] text-[10px] w-3 text-center">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-3 pb-3 flex flex-col gap-1.5" style={{ borderTop: "1px solid #1e3a5f", paddingTop: "8px" }}>
                    {protocol.checklist.map((item, idx) => {
                      return (
                        <div 
                          key={idx} 
                          className="flex items-start gap-2 cursor-pointer group"
                          onClick={() => checkProtocolItem(protocol.id, idx, "Lead Scientist")}
                        >
                          <div 
                            className="mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center transition-colors"
                            style={{
                              background: item.checked ? '#22c55e' : 'transparent',
                              border: `1px solid ${item.checked ? '#22c55e' : '#1e3a5f'}`
                            }}
                          >
                            {item.checked && <span className="text-white text-[9px]">✓</span>}
                          </div>
                          
                          {item.checked ? (
                            <span className="text-[11px] leading-tight transition-colors text-[#22c55e]">
                              ✓ {item.item} [{item.checkedAt}] — {item.checkedBy}
                            </span>
                          ) : (
                            <span className="text-[11px] leading-tight transition-colors text-[#e2e8f0] group-hover:text-white">
                              {item.item}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#080f1e] border border-[#1e3a5f] p-5 rounded-lg shadow-2xl flex flex-col gap-4 relative">
            <button 
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-[#8b949e] hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-[#58a6ff] text-lg font-bold flex items-center gap-2">
              🚨 Emergency Systems
            </h2>
            <div className="flex flex-col gap-3 text-sm text-[#e2e8f0]">
              <p>
                PolarTwin is fully integrated with Bharati Station&apos;s physical crisis management network.
              </p>
              <div className="bg-[#0a1628] p-3 rounded border border-[#1e3a5f]">
                <ul className="list-disc pl-5 flex flex-col gap-2">
                  <li><strong>Auto-Triggering:</strong> Certain catastrophic parameters (e.g., fuel below 20%, blizzard conditions, extreme pressure loss) will instantly activate corresponding protocols.</li>
                  <li><strong>Audit Trails:</strong> Checking off protocol items automatically logs the timestamp and the acting role (e.g., Lead Scientist).</li>
                  <li><strong>NCPOR Notification:</strong> Protocol activation is instantly synchronized back to Goa for situational awareness.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
