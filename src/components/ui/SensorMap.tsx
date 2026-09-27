"use client";

import { useState } from "react";

export function SensorMap() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button 
        onClick={() => setOpen(!open)}
        className="absolute top-[90px] left-[10px] z-10 bg-[#080f1e]/90 text-[#e2e8f0] px-3 py-1.5 rounded-lg border border-[#1e3a5f] text-xs font-bold hover:bg-[#1e3a5f]/50 transition-colors cursor-pointer"
        style={{ letterSpacing: "0.5px" }}
      >
        👁 SENSOR MAP
      </button>

      {open && (
        <div className="absolute top-[130px] left-[10px] z-10 bg-[#0a1628]/95 backdrop-blur border border-[#1e3a5f] rounded-lg p-4 text-white shadow-xl flex flex-col pointer-events-auto" style={{ width: "320px" }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[10px] font-bold text-[#58a6ff] uppercase tracking-wider">SENSOR MAPPING — LIVE</h3>
            <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer px-1">✕</button>
          </div>
          <table className="w-full text-left text-[9px] font-mono text-zinc-300">
            <thead>
              <tr className="text-zinc-500 border-b border-[#1e3a5f]">
                <th className="pb-1 font-normal w-24">ROOM</th>
                <th className="pb-1 font-normal w-24">SENSOR ID</th>
                <th className="pb-1 font-normal w-20">TYPE</th>
                <th className="pb-1 font-normal w-16">STATUS</th>
              </tr>
            </thead>
            <tbody className="leading-relaxed">
              <tr><td className="py-1">Laboratory</td><td>SNS-LAB-01</td><td>Temp/Hum</td><td className="text-[#22c55e]">● Live</td></tr>
              <tr><td className="py-1">Laboratory</td><td>SNS-LAB-02</td><td>Air quality</td><td className="text-[#22c55e]">● Live</td></tr>
              <tr><td className="py-1">Workshop</td><td>SNS-WRK-01</td><td>Temp</td><td className="text-[#22c55e]">● Live</td></tr>
              <tr><td className="py-1">Workshop</td><td>SNS-WRK-02</td><td>Pressure</td><td className="text-[#22c55e]">● Live</td></tr>
              <tr><td className="py-1">Habitat</td><td>SNS-HAB-01</td><td>Temp/Hum</td><td className="text-[#22c55e]">● Live</td></tr>
              <tr><td className="py-1">Habitat</td><td>SNS-HAB-02</td><td>CO2 level</td><td className="text-[#22c55e]">● Live</td></tr>
              <tr><td className="py-1">Generator</td><td>SNS-GEN-01</td><td>Fuel gauge</td><td className="text-[#22c55e]">● Live</td></tr>
              <tr><td className="py-1">Generator</td><td>SNS-GEN-02</td><td>Output meter</td><td className="text-[#22c55e]">● Live</td></tr>
              <tr><td className="py-1">Pipeline</td><td>SNS-PIP-01</td><td>Pressure</td><td className="text-[#22c55e]">● Live</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
