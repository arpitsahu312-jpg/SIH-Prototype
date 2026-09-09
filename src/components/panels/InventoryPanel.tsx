"use client";

import { useEffect, useState } from "react";

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

  const openTickets = tickets.filter((t) => t.status === "open");

  return (
    <div className="absolute top-4 right-4 z-10 w-80 rounded-lg bg-zinc-900/90 backdrop-blur p-4 text-white text-sm max-h-[80vh] overflow-y-auto">
      <h2 className="font-bold mb-2">Logistics & Inventory</h2>

      {openTickets.length > 0 && (
        <div className="mb-3 rounded bg-red-950/50 border border-red-800 p-2">
          <p className="text-red-400 font-semibold text-xs mb-1">
            {openTickets.length} open ticket{openTickets.length > 1 ? "s" : ""}
          </p>
          {openTickets.map((t) => (
            <p key={t.id} className="text-xs text-red-200">{t.message}</p>
          ))}
        </div>
      )}

      {(["food", "medical", "spare_parts"] as const).map((category) => (
        <div key={category} className="mb-3">
          <p className="text-zinc-400 text-xs uppercase mb-1">{category.replace("_", " ")}</p>
          {inventory
            .filter((i) => i.category === category)
            .map((item) => {
              const low = item.quantity <= item.low_stock_threshold;
              return (
                <div key={item.id} className="flex justify-between py-0.5">
                  <span className={low ? "text-amber-400" : "text-zinc-200"}>{item.name}</span>
                  <span className={low ? "text-amber-400 font-semibold" : "text-zinc-400"}>
                    {item.quantity}{item.unit}
                  </span>
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}