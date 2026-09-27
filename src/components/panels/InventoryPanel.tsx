"use client";

import { useEffect, useState } from "react";
import { useStationStore } from "@/lib/store";

interface InventoryItem {
  id: string;
  name: string;
  category: "food" | "medical" | "spare_parts";
  quantity: number;
  unit: string;
  low_stock_threshold: number;
}

interface Ticket {
  id: string;
  item_name: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
}

const API_BASE = "http://127.0.0.1:8000";

export function InventoryPanel() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  async function refresh() {
    const [invRes, ticketRes] = await Promise.all([
      fetch(`${API_BASE}/inventory`),
      fetch(`${API_BASE}/tickets`),
    ]);
    setInventory(await invRes.json());
    setTickets(await ticketRes.json());
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const timestamp = useStationStore((s) => s.stationState.timestamp);
  const addReorderRequest = useStationStore((s) => s.addReorderRequest);
  const reorderRequests = useStationStore((s) => s.stationState.reorderRequests);
  const [showInfo, setShowInfo] = useState(false);

  const getSuggestedQuantity = (name: string) => {
    if (name.includes("rations")) return "200kg";
    if (name.includes("water")) return "500L";
    if (name.includes("Antibiotics")) return "20 units";
    if (name.includes("Trauma")) return "5 kits";
    if (name.includes("fuel filter")) return "6 units";
    if (name.includes("seal kit")) return "4 units";
    return "10 units"; // fallback
  };

  const activeRequests = reorderRequests.filter(r => r.status !== "rejected");
  const openTickets = tickets.filter((t) => t.status === "open");

  return (
    <>
      <div className="w-full border-b flex flex-col max-h-[80vh] overflow-y-auto" style={{ borderColor: "#1e3a5f", background: "#080f1e" }}>
        <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: "#1e3a5f", background: "#0a1628" }}>
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-semibold text-[#e2e8f0] m-0 uppercase">📦 Logistics & Inventory</h2>
            <button 
              onClick={() => setShowInfo(true)}
              className="w-4 h-4 rounded-full border border-zinc-500 flex items-center justify-center text-[10px] text-zinc-400 hover:text-white hover:border-white transition-colors cursor-pointer"
              title="Resupply Process"
            >
              ℹ
            </button>
          </div>
        </div>
        
        <div className="p-4 flex flex-col gap-3 text-sm text-white">
          {openTickets.length > 0 && (
            <div className="mb-1 rounded bg-red-950/50 border border-red-800 p-2">
              <p className="text-red-400 font-semibold text-xs mb-1">
                {openTickets.length} open ticket{openTickets.length > 1 ? "s" : ""}
              </p>
              {openTickets.map((t) => (
                <p key={t.id} className="text-xs text-red-200">{t.message}</p>
              ))}
            </div>
          )}

          {(["food", "medical", "spare_parts"] as const).map((category) => (
            <div key={category} className="mb-2">
              <p className="text-zinc-400 text-xs uppercase mb-1 font-semibold">{category.replace("_", " ")}</p>
              {inventory
                .filter((i) => i.category === category)
                .map((item) => {
                  const low = item.quantity <= item.low_stock_threshold;
                  const itemRequest = reorderRequests.find(r => r.itemName === item.name);
                  
                  return (
                    <div key={item.id} className="group relative flex flex-col py-1 border-b border-[#1e3a5f]/30 last:border-0">
                      <div className="flex justify-between items-center">
                        <span className={low ? "text-amber-400" : "text-zinc-200"}>{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={low ? "text-amber-400 font-semibold" : "text-zinc-400"}>
                            {item.quantity}{item.unit}
                          </span>
                          {!itemRequest ? (
                            <button
                              onClick={() => addReorderRequest(item.name, getSuggestedQuantity(item.name))}
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#0d2040] border border-[#58a6ff] text-[#58a6ff] rounded px-1.5 py-0.5 text-[9px] cursor-pointer"
                            >
                              ↑ Reorder
                            </button>
                          ) : itemRequest.status === "pending" ? (
                            <button className="opacity-100 bg-[#0d2040] border border-[#f59e0b] text-[#f59e0b] rounded px-1.5 py-0.5 text-[9px] cursor-default">
                              Requested
                            </button>
                          ) : itemRequest.status === "approved" ? (
                            <button className="opacity-100 bg-[#0d2040] border border-[#22c55e] text-[#22c55e] rounded px-1.5 py-0.5 text-[9px] cursor-default">
                              Approved
                            </button>
                          ) : itemRequest.status === "dispatched" ? (
                            <button className="opacity-100 bg-[#0d2040] border border-[#58a6ff] text-[#58a6ff] rounded px-1.5 py-0.5 text-[9px] cursor-default">
                              Dispatched
                            </button>
                          ) : (
                            <button className="opacity-100 bg-[#0d2040] border border-[#ef4444] text-[#ef4444] rounded px-1.5 py-0.5 text-[9px] cursor-default">
                              Rejected
                            </button>
                          )}
                        </div>
                      </div>
                      {itemRequest && (
                        <div className={`text-[9px] mt-0.5 ${
                          itemRequest.status === "pending" ? "text-[#f59e0b]" :
                          itemRequest.status === "approved" ? "text-[#22c55e]" :
                          itemRequest.status === "dispatched" ? "text-[#58a6ff]" :
                          "text-[#ef4444]"
                        }`}>
                          {itemRequest.status === "pending" && "⏳ Awaiting NCPOR approval"}
                          {itemRequest.status === "approved" && "✓ Approved — dispatching"}
                          {itemRequest.status === "dispatched" && `🚢 En route — ETA: ${itemRequest.eta || "Unknown"}`}
                          {itemRequest.status === "rejected" && "✗ Rejected by NCPOR"}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}

          {activeRequests.length > 0 && (
            <div className="mt-4 border-t border-[#1e3a5f] pt-3">
              <h3 className="text-xs font-bold text-[#58a6ff] mb-2">📦 Reorder Queue</h3>
              <div className="flex flex-col gap-2">
                {activeRequests.map(req => (
                  <div key={req.id} className="bg-[#020617] border border-[#1e3a5f] rounded p-2 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-[#e2e8f0]">{req.itemName}</span>
                      <span className="text-[10px] text-[#22c55e] bg-[#22c55e]/10 px-1 rounded">{req.quantity}</span>
                    </div>
                    <div className="text-[10px] text-[#8b949e]">Status: {req.status}</div>
                    {req.eta && <div className="text-[10px] text-[#8b949e]">ETA: {req.eta}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 text-right">
            <span style={{ fontSize: "8px", color: "#4a6380", fontFamily: "monospace" }}>
              Last updated: {timestamp ? new Date(timestamp).toLocaleTimeString() : "--:--:--"}
            </span>
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div className="bg-[#080f1e] border border-[#1e3a5f] rounded-lg p-5 max-w-sm w-full text-[#e2e8f0] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-[#58a6ff]">Resupply Process</h3>
              <button onClick={() => setShowInfo(false)} className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-lg">✕</button>
            </div>
            <div className="text-xs text-zinc-300 space-y-3">
              <ol className="list-decimal pl-4 space-y-1 text-zinc-300">
                <li>Station raises reorder request digitally</li>
                <li>Request synced to NCPOR control (Goa) via satellite when link available</li>
                <li>NCPOR approves and schedules next resupply vessel or air drop</li>
                <li>Estimated delivery: 14-21 days by sea, 3-5 days by aircraft if critical</li>
                <li>Receipt confirmed by station crew on delivery</li>
              </ol>
              
              <div className="pt-3 border-t border-[#1e3a5f] mt-3 text-zinc-400">
                <span className="text-[#f59e0b] font-semibold">Note:</span> Critical items (medical, fuel) trigger automatic priority escalation if stock drops below 20%.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}