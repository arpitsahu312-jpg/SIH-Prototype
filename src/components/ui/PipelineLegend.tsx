export function PipelineLegend() {
  return (
    <div style={{
      position: "absolute",
      bottom: "12px",
      left: "12px",
      zIndex: 10,
      background: "rgba(6,13,26,0.85)",
      border: "1px solid #1e3a5f",
      borderRadius: "6px",
      padding: "10px",
      fontSize: "10px",
      color: "#e2e8f0",
      pointerEvents: "none",
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    }}>
      <div style={{ color: "#8b949e", marginBottom: "4px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>PIPELINE NETWORK</div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ color: "#f59e0b", letterSpacing: "-1px" }}>━━</span> Fuel / Kerosene</div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ color: "#3b82f6", letterSpacing: "-1px" }}>━━</span> Water / Cooling</div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ color: "#ef4444", letterSpacing: "-1px" }}>━━</span> Power / Electrical</div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ color: "#22d3ee", letterSpacing: "-1px" }}>━━</span> Data / Communications</div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ color: "#ff7043", letterSpacing: "-1px" }}>━━</span> Heating / Thermal</div>
    </div>
  );
}
