"use client";

const CREW_DATA = [
  { name: "Dr. Priya Sharma", role: "Lead Scientist", status: "on-duty", location: "Laboratory" },
  { name: "Eng. Rahul Mehta", role: "Power Engineer", status: "on-duty", location: "Power Plant" },
  { name: "Dr. Anil Verma", role: "Glaciologist", status: "research", location: "Field Site" },
  { name: "Ms. Sunita Rao", role: "Medical Officer", status: "standby", location: "Medical Bay" },
  { name: "Eng. Vikram Singh", role: "Systems Engineer", status: "rest", location: "Habitat" },
];

const STATUS_COLORS: Record<string, string> = {
  "on-duty": "#22c55e",
  "research": "#58a6ff",
  "standby": "#f59e0b",
  "rest": "#8b949e",
};

export function CrewPanel() {
  return (
    <div className="w-full border-b flex flex-col" style={{ borderColor: "#1e3a5f", background: "#080f1e" }}>
      <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: "#1e3a5f", background: "#0a1628" }}>
        <h2 className="text-[13px] font-semibold text-[#e2e8f0] m-0">👥 Crew Status</h2>
        <span className="text-[11px] text-[#8b949e]">{CREW_DATA.length} on station</span>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {CREW_DATA.map((crew, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <span className="text-[13px] font-medium text-[#e2e8f0]">{crew.name}</span>
              <span 
                className="text-[10px] px-2 py-0.5 rounded capitalize font-medium"
                style={{ 
                  background: `${STATUS_COLORS[crew.status]}15`,
                  color: STATUS_COLORS[crew.status],
                  border: `1px solid ${STATUS_COLORS[crew.status]}40`
                }}
              >
                {crew.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-[#8b949e]">
              <span>{crew.role}</span>
              <span className="flex items-center gap-1">
                📍 {crew.location}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
