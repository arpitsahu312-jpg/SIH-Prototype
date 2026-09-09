"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RoleSelector() {
  const [selected, setSelected] = useState<"scientist" | "operator" | null>(null);
  const router = useRouter();

  function handleSelect(role: "scientist" | "operator") {
    setSelected(role);
    setTimeout(() => {
      router.push(role === "scientist" ? "/" : "/operator");
    }, 600);
  }

  if (selected) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <p className="text-white text-lg">
          Logging in as {selected === "scientist" ? "Lead Scientist (Maitri Station)" : "NCPOR Operator"}...
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-6">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-white mb-2">Antarctic Digital Twin</h1>
        <p className="text-zinc-400">Select your role to continue</p>
      </div>

      <div className="flex gap-6">
        <button
          onClick={() => handleSelect("scientist")}
          className="w-64 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-blue-500 p-6 text-left transition-colors"
        >
          <p className="text-3xl mb-2">🔬</p>
          <h2 className="text-white font-semibold mb-1">Lead Scientist</h2>
          <p className="text-zinc-400 text-sm">Maitri Station — Local Edge Dashboard</p>
        </button>

        <button
          onClick={() => handleSelect("operator")}
          className="w-64 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-blue-500 p-6 text-left transition-colors"
        >
          <p className="text-3xl mb-2">🛰️</p>
          <h2 className="text-white font-semibold mb-1">NCPOR Operator</h2>
          <p className="text-zinc-400 text-sm">India Control Center — Cloud Dashboard</p>
        </button>
      </div>
    </div>
  );
}