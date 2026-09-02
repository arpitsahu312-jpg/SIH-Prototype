"""antarctic-edge-server — hackathon telemetry prototype."""

from __future__ import annotations

import asyncio
import json
import random
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Literal

import numpy as np
import joblib
import chromadb
from sentence_transformers import SentenceTransformer
import ollama

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
TICK_SECONDS = 3.0
FAULT_CHANCE = 0.05
FAULT_RECOVER_MIN_S = 15.0
FAULT_RECOVER_MAX_S = 20.0
MAX_HISTORY_POINTS = 40

ROOM_BASELINES = {"room-1": 21.5, "room-2": 22.0, "room-3": 20.8}
GENERATOR_FUEL_BASE = 87.0
GENERATOR_OUTPUT_BASE = 42.3
PIPELINE_PRESSURE_BASE = 4.2
ENV_WIND_BASE = 15.0
ENV_TEMP_BASE = -32.0

ComponentId = Literal["generator", "pipeline", "room-1", "room-2", "room-3"]
Severity = Literal["warning", "critical"]
VALID_COMPONENTS = {"generator", "pipeline", "room-1", "room-2", "room-3"}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utcnow().isoformat()


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def initial_state() -> dict:
    return {
        "rooms": [
            {"id": "room-1", "status": "normal", "temperature": ROOM_BASELINES["room-1"]},
            {"id": "room-2", "status": "normal", "temperature": ROOM_BASELINES["room-2"]},
            {"id": "room-3", "status": "normal", "temperature": ROOM_BASELINES["room-3"]},
        ],
        "generator": {"status": "normal", "fuelLevel": GENERATOR_FUEL_BASE, "output": GENERATOR_OUTPUT_BASE},
        "pipeline": {"status": "normal", "pressure": PIPELINE_PRESSURE_BASE},
        "environment": {"windSpeed": ENV_WIND_BASE, "temperature": ENV_TEMP_BASE, "blizzard": False},
        "timestamp": iso_now(),
    }


state: dict = initial_state()
active_faults: dict[str, datetime] = {}
fuel_history: list[dict] = []
clients: set[WebSocket] = set()
lock = asyncio.Lock()


class FaultInjectBody(BaseModel):
    component: ComponentId
    severity: Severity = Field(..., description="warning or critical")


def find_room(room_id: str) -> dict | None:
    for room in state["rooms"]:
        if room["id"] == room_id:
            return room
    return None


def apply_jitter(faulted: set[str]) -> None:
    for room in state["rooms"]:
        if room["id"] in faulted:
            continue
        room["temperature"] = round(clamp(room["temperature"] + random.uniform(-0.12, 0.12), 18.0, 24.5), 2)

    gen = state["generator"]
    if "generator" not in faulted:
        gen["fuelLevel"] = round(clamp(gen["fuelLevel"] + random.uniform(-0.25, 0.08), 40.0, 98.0), 1)
        gen["output"] = round(clamp(gen["output"] + random.uniform(-0.35, 0.35), 35.0, 50.0), 1)

    pipe = state["pipeline"]
    if "pipeline" not in faulted:
        pipe["pressure"] = round(clamp(pipe["pressure"] + random.uniform(-0.08, 0.08), 3.4, 5.0), 2)

    env = state["environment"]
    env["windSpeed"] = round(clamp(env["windSpeed"] + random.uniform(-1.2, 1.2), 4.0, 45.0), 1)
    env["temperature"] = round(clamp(env["temperature"] + random.uniform(-0.6, 0.6), -55.0, -10.0), 1)
    env["blizzard"] = env["windSpeed"] > 32 if env["windSpeed"] > 32 else (False if env["windSpeed"] < 22 else env["blizzard"])


def apply_fault_values(component_id: str, severity: Severity) -> None:
    critical = severity == "critical"

    if component_id.startswith("room-"):
        room = find_room(component_id)
        if not room:
            return
        room["status"] = severity
        room["temperature"] = round(random.uniform(31.0, 36.5) if critical else random.uniform(26.0, 28.5), 1)
        return

    if component_id == "generator":
        gen = state["generator"]
        gen["status"] = severity
        if critical:
            gen["fuelLevel"] = round(random.uniform(5.0, 12.0), 1)
            gen["output"] = round(random.uniform(8.0, 16.0), 1)
        else:
            gen["fuelLevel"] = round(random.uniform(22.0, 32.0), 1)
            gen["output"] = round(random.uniform(22.0, 28.0), 1)
        return

    if component_id == "pipeline":
        pipe = state["pipeline"]
        pipe["status"] = severity
        if critical:
            pipe["pressure"] = round(random.choice([random.uniform(0.4, 1.1), random.uniform(8.8, 11.5)]), 2)
        else:
            pipe["pressure"] = round(random.choice([random.uniform(1.8, 2.4), random.uniform(6.4, 7.4)]), 2)


def restore_component(component_id: str) -> None:
    if component_id.startswith("room-"):
        room = find_room(component_id)
        if room:
            room["status"] = "normal"
            room["temperature"] = ROOM_BASELINES.get(component_id, 21.5)
        return
    if component_id == "generator":
        gen = state["generator"]
        gen["status"] = "normal"
        gen["fuelLevel"] = GENERATOR_FUEL_BASE
        gen["output"] = GENERATOR_OUTPUT_BASE
        return
    if component_id == "pipeline":
        pipe = state["pipeline"]
        pipe["status"] = "normal"
        pipe["pressure"] = PIPELINE_PRESSURE_BASE


def inject_fault_component(component_id: str, severity: Severity) -> None:
    apply_fault_values(component_id, severity)
    delay = random.uniform(FAULT_RECOVER_MIN_S, FAULT_RECOVER_MAX_S)
    active_faults[component_id] = utcnow() + timedelta(seconds=delay)


def recover_expired_faults() -> None:
    now = utcnow()
    expired = [cid for cid, until in active_faults.items() if now >= until]
    for cid in expired:
        restore_component(cid)
        del active_faults[cid]


def pick_random_healthy_component() -> str | None:
    candidates = [r["id"] for r in state["rooms"] if r["id"] not in active_faults]
    if "generator" not in active_faults:
        candidates.append("generator")
    if "pipeline" not in active_faults:
        candidates.append("pipeline")
    return random.choice(candidates) if candidates else None


def snapshot() -> dict:
    state["timestamp"] = iso_now()
    return json.loads(json.dumps(state))


async def broadcast(payload: dict) -> None:
    if not clients:
        return
    message = json.dumps(payload)
    stale: list[WebSocket] = []
    for ws in list(clients):
        try:
            await ws.send_text(message)
        except Exception:
            stale.append(ws)
    for ws in stale:
        clients.discard(ws)


async def telemetry_loop() -> None:
    while True:
        await asyncio.sleep(TICK_SECONDS)
        async with lock:
            recover_expired_faults()
            faulted_ids = set(active_faults.keys())

            if random.random() < FAULT_CHANCE:
                target = pick_random_healthy_component()
                if target:
                    inject_fault_component(target, random.choice(["warning", "critical"]))
                    faulted_ids.add(target)

            apply_jitter(faulted_ids)
            check_low_stock()
            if not satellite_online:
                pending_sync_log.append({"timestamp": iso_now(), "type": "telemetry_tick"})
            payload = snapshot()
            fuel_history.append({
                "timestamp": payload["timestamp"],
                "fuelLevel": payload["generator"]["fuelLevel"],
                "output": payload["generator"]["output"],
            })
            if len(fuel_history) > MAX_HISTORY_POINTS:
                fuel_history.pop(0)

        await broadcast(payload)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(telemetry_loop())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="antarctic-edge-server", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/state")
async def get_state():
    async with lock:
        return snapshot()


@app.get("/energy/history")
async def get_energy_history():
    return fuel_history


@app.post("/fault/inject")
async def fault_inject(body: FaultInjectBody):
    async with lock:
        if body.component.startswith("room-") and not find_room(body.component):
            raise HTTPException(status_code=404, detail="Unknown room")
        inject_fault_component(body.component, body.severity)
        payload = snapshot()
    await broadcast(payload)
    return payload


@app.post("/fault/clear/{component_id}")
async def fault_clear(component_id: str):
    if component_id not in VALID_COMPONENTS:
        raise HTTPException(status_code=404, detail="Unknown component")
    async with lock:
        restore_component(component_id)
        active_faults.pop(component_id, None)
        payload = snapshot()
    await broadcast(payload)
    return payload


@app.websocket("/ws/telemetry")
async def telemetry_ws(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    async with lock:
        payload = snapshot()
    try:
        await websocket.send_text(json.dumps(payload))
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(websocket)


# ---------------------------------------------------------------------------
# Inventory / logistics
# ---------------------------------------------------------------------------
class InventoryItem(BaseModel):
    id: str
    name: str
    category: Literal["food", "medical", "spare_parts"]
    quantity: float
    unit: str
    low_stock_threshold: float


inventory: list[dict] = [
    {"id": "food-1", "name": "Freeze-dried rations", "category": "food", "quantity": 340, "unit": "kg", "low_stock_threshold": 100},
    {"id": "food-2", "name": "Drinking water reserves", "category": "food", "quantity": 2200, "unit": "L", "low_stock_threshold": 500},
    {"id": "med-1", "name": "Antibiotics", "category": "medical", "quantity": 45, "unit": "units", "low_stock_threshold": 20},
    {"id": "med-2", "name": "Trauma kits", "category": "medical", "quantity": 8, "unit": "kits", "low_stock_threshold": 3},
    {"id": "part-1", "name": "Generator fuel filters", "category": "spare_parts", "quantity": 12, "unit": "units", "low_stock_threshold": 5},
    {"id": "part-2", "name": "Pipeline seal kits", "category": "spare_parts", "quantity": 6, "unit": "units", "low_stock_threshold": 4},
]

tickets: list[dict] = []
ticket_counter = 0


def check_low_stock() -> None:
    global ticket_counter
    existing_ticket_items = {t["item_id"] for t in tickets if t["status"] == "open"}
    for item in inventory:
        if item["quantity"] <= item["low_stock_threshold"] and item["id"] not in existing_ticket_items:
            ticket_counter += 1
            tickets.append({
                "id": f"TICKET-{ticket_counter}",
                "item_id": item["id"],
                "item_name": item["name"],
                "message": f"Low stock: {item['name']} at {item['quantity']}{item['unit']} (threshold {item['low_stock_threshold']}{item['unit']})",
                "status": "open",
                "created_at": iso_now(),
            })


@app.get("/inventory")
async def get_inventory():
    return inventory


@app.post("/inventory/{item_id}/consume")
async def consume_inventory(item_id: str, amount: float):
    item = next((i for i in inventory if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item["quantity"] = max(0, item["quantity"] - amount)
    check_low_stock()
    return item


@app.get("/tickets")
async def get_tickets():
    return tickets


@app.post("/tickets/{ticket_id}/resolve")
async def resolve_ticket(ticket_id: str):
    ticket = next((t for t in tickets if t["id"] == ticket_id), None)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket["status"] = "resolved"
    return ticket


# ---------------------------------------------------------------------------
# RAG — offline station manual assistant
# ---------------------------------------------------------------------------
_chroma_client = chromadb.PersistentClient(path="./chroma_db")
_collection = _chroma_client.get_collection("manuals")
_embedder = SentenceTransformer("all-MiniLM-L6-v2")
OLLAMA_MODEL = "llama3.2:3b"


class AskManualBody(BaseModel):
    question: str


def retrieve_chunks(question: str, top_k: int = 3) -> list[str]:
    query_embedding = _embedder.encode([question]).tolist()
    results = _collection.query(query_embeddings=query_embedding, n_results=top_k)
    return results["documents"][0] if results["documents"] else []


@app.post("/ask-manual")
async def ask_manual(body: AskManualBody):
    chunks = retrieve_chunks(body.question)
    if not chunks:
        return {"answer": "No relevant information found in the station manuals.", "sources": []}

    context = "\n\n---\n\n".join(chunks)
    prompt = f"""You are an offline technical assistant for an Antarctic research station. Answer the operator's question using ONLY the manual excerpts below. If the excerpts don't contain the answer, say so clearly — do not guess or make up information.

Manual excerpts:
{context}

Operator question: {body.question}

Answer concisely and practically:"""

    response = ollama.generate(model=OLLAMA_MODEL, prompt=prompt)
    return {"answer": response["response"], "sources": chunks}


# ---------------------------------------------------------------------------
# Predictive maintenance
# ---------------------------------------------------------------------------
_maintenance_model = joblib.load("maintenance_model.pkl")


def risk_score(fuel: float, output: float, pressure: float, vibration: float, room_temp: float) -> float:
    X = np.array([[fuel, output, pressure, vibration, room_temp]])
    raw_score = _maintenance_model.decision_function(X)[0]
    risk = max(0.0, min(100.0, (0.5 - raw_score) * 100))
    return round(risk, 1)


@app.get("/predict-maintenance")
async def predict_maintenance():
    gen = state["generator"]
    pipe = state["pipeline"]
    avg_room_temp = sum(r["temperature"] for r in state["rooms"]) / len(state["rooms"])
    simulated_vibration = round(0.03 + max(0, (50 - gen["output"]) / 500), 3)

    risk = risk_score(
        fuel=gen["fuelLevel"], output=gen["output"], pressure=pipe["pressure"],
        vibration=simulated_vibration, room_temp=avg_room_temp,
    )
    level = "critical" if risk >= 70 else "elevated" if risk >= 35 else "nominal"
    return {"riskPercent": risk, "level": level, "timestamp": iso_now()}

# --- Offline/sync simulation ---
satellite_online: bool = True
pending_sync_log: list[dict] = []
sync_history: list[dict] = []


class ConnectivityBody(BaseModel):
    online: bool


@app.post("/connectivity/set")
async def set_connectivity(body: ConnectivityBody):
    global satellite_online
    was_offline = not satellite_online
    satellite_online = body.online

    if satellite_online and was_offline and pending_sync_log:
        synced_count = len(pending_sync_log)
        sync_history.append({
            "timestamp": iso_now(),
            "changes_synced": synced_count,
        })
        pending_sync_log.clear()
        return {"online": True, "synced": synced_count, "message": f"Sync complete: {synced_count} changes pushed to NCPOR cloud"}

    return {"online": satellite_online, "synced": 0, "message": "Satellite link down — operating in offline edge mode" if not satellite_online else "Already online"}


@app.get("/connectivity/status")
async def get_connectivity_status():
    return {
        "online": satellite_online,
        "pendingChanges": len(pending_sync_log),
        "lastSync": sync_history[-1] if sync_history else None,
    }


# --- Zero-waste / carbon tracking (derived from existing state, no new sensors) ---
CARBON_KG_PER_KWH = 0.82  # rough diesel-generator emission factor for demo purposes
waste_accumulated_kg: float = 12.4  # starting baseline, drifts up over time
station_start_time = utcnow()


@app.get("/sustainability")
async def get_sustainability():
    global waste_accumulated_kg
    output_kw = state["generator"]["output"]
    hours_running = (utcnow() - station_start_time).total_seconds() / 3600

    estimated_carbon_kg = round(output_kw * hours_running * CARBON_KG_PER_KWH, 1)
    waste_accumulated_kg += random.uniform(0.0, 0.03)  # slow organic drift

    treaty_limit_kg = 200.0  # fictional Antarctic Treaty waste-storage threshold for this demo
    waste_pct = round((waste_accumulated_kg / treaty_limit_kg) * 100, 1)

    return {
        "estimatedCarbonKg": estimated_carbon_kg,
        "wasteAccumulatedKg": round(waste_accumulated_kg, 2),
        "wasteCapacityPercent": min(100.0, waste_pct),
        "treatyLimitKg": treaty_limit_kg,
        "hoursRunning": round(hours_running, 2),
    }