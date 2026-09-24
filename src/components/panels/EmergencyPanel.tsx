"use client";

import { useState, useEffect } from "react";
import { useStationStore } from "@/lib/store";

const PROTOCOLS = [
  {
    id: "blizzard",
    name: "Blizzard Protocol 7",
    checklist: [
      "Secure all external equipment",
      "Activate backup heating",
      "Check emergency food supplies",
      "Notify NCPOR control center",
    ],
  },
  {
    id: "fuel",
    name: "Fuel Emergency Alpha",
    checklist: [
      "Switch to reserve fuel tank",
      "Reduce non-essential power",
      "Dispatch resupply request",
      "Log incident report",
    ],
  },
  {
    id: "pipeline",
    name: "Pipeline Lockdown",
    checklist: [
      "Close main valve",
      "Isolate affected segment",
      "Check pressure gauges",
      "Call systems engineer",
    ],
  },
];

export function EmergencyPanel() {
  const stationState = useStationStore((s) => s.stationState);
  
  const triggers = {
    blizzard: stationState.environment.blizzard,
    fuel: stationState.generatorFuel < 20,
    pipeline: stationState.pipelinePressure < 2.0,
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<number, boolean>>>({});

  // Auto-expand when active
  useEffect(() => {
    setExpanded((prev) => {
      let changed = false;
      const next = { ...prev };
      
      if (triggers.blizzard && !prev.blizzard) {
        next.blizzard = true;
        changed = true;
      }
      if (triggers.fuel && !prev.fuel) {
        next.fuel = true;
        changed = true;
      }
      if (triggers.pipeline && !prev.pipeline) {
        next.pipeline = true;
        changed = true;
      }
      
      return changed ? next : prev;
    });
  }, [triggers.blizzard, triggers.fuel, triggers.pipeline]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCheck = (protocolId: string, itemIdx: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [protocolId]: {
        ...(prev[protocolId] || {}),
        [itemIdx]: !(prev[protocolId]?.[itemIdx]),
      },
    }));
  };

  return (
    <div className="w-full border-b flex flex-col" style={{ borderColor: "#1e3a5f", background: "#080f1e" }}>
      <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: "#1e3a5f", background: "#0a1628" }}>
        <h2 className="text-[13px] font-semibold text-[#e2e8f0] m-0">🚨 Emergency Protocols</h2>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {PROTOCOLS.map((protocol) => {
          const isActive = triggers[protocol.id as keyof typeof triggers];
          const isExpanded = !!expanded[protocol.id];
          
          return (
            <div key={protocol.id} className="flex flex-col gap-2 rounded" style={{ background: "#020617", border: "1px solid #1e3a5f" }}>
              <div 
                className="flex justify-between items-center px-3 py-2 cursor-pointer select-none"
                onClick={() => toggleExpand(protocol.id)}
              >
                <span className="text-[12px] font-medium text-[#e2e8f0]">{protocol.name}</span>
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
                    const isChecked = checkedItems[protocol.id]?.[idx];
                    return (
                      <div 
                        key={idx} 
                        className="flex items-start gap-2 cursor-pointer group"
                        onClick={() => toggleCheck(protocol.id, idx)}
                      >
                        <div 
                          className="mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center transition-colors"
                          style={{
                            background: isChecked ? '#58a6ff' : 'transparent',
                            border: `1px solid ${isChecked ? '#58a6ff' : '#1e3a5f'}`
                          }}
                        >
                          {isChecked && <span className="text-white text-[9px]">✓</span>}
                        </div>
                        <span 
                          className={`text-[11px] leading-tight transition-colors ${isChecked ? 'text-[#8b949e] line-through' : 'text-[#e2e8f0] group-hover:text-white'}`}
                        >
                          {item}
                        </span>
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
  );
}
