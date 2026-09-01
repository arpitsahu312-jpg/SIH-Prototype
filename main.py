"""antarctic-edge-server — hackathon telemetry prototype."""

from __future__ import annotations

import asyncio
import json
import random
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

TICK_SECONDS = 3.0
FAULT_CHANCE = 0.05
FAULT_RECOVER_MIN_S = 15.0
FAULT_RECOVER_MAX_S = 20.0

ROOM_BASELINES = {
    "room-1": 21.5,
    "room-2": 22.0,
    "room-3": 20.8,
}
GENERATOR_FUEL_BASE = 87.0
GENERATOR_OUTPUT_BASE = 42.3
PIPELINE_PRESSURE_BASE = 4.2
ENV_WIND_BASE = 15.0
ENV_TEMP_BASE = -32.0

ComponentId = Literal["generator", "pipeline", "room-1", "room-2", "room-3"]
Severity = Literal["warning", "critical"]


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
        "generator": {
            "status": "normal",
            "fuelLevel": GENERATOR_FUEL_BASE,
            "output": GENERATOR_OUTPUT_BASE,
        },
        "pipeline": {"status": "normal", "pressure": PIPELINE_PRESSURE_BASE},
        "environment": {
            "windSpeed": ENV_WIND_BASE,
            "temperature": ENV_TEMP_BASE,
            "blizzard": False,
        },
        "timestamp": iso_now(),
    }


state: dict = initial_state()
# component_id -> datetime when status auto-recovers
active_faults: dict[str, datetime] = {}
fuel_history: list[dict] = []
MAX_HISTORY_POINTS = 40

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
        room["temperature"] = round(
            clamp(room["temperature"] + random.uniform(-0.12, 0.12), 18.0, 24.5),
            2,
        )

    gen = state["generator"]
    if "generator" not in faulted:
        gen["fuelLevel"] = round(
            clamp(gen["fuelLevel"] + random.uniform(-0.25, 0.08), 40.0, 98.0),
            1,
        )
        gen["output"] = round(
            clamp(gen["output"] + random.uniform(-0.35, 0.35), 35.0, 50.0),
            1,
        )

    pipe = state["pipeline"]
    if "pipeline" not in faulted:
        pipe["pressure"] = round(
            clamp(pipe["pressure"] + random.uniform(-0.08, 0.08), 3.4, 5.0),
            2,
        )

    env = state["environment"]
    env["windSpeed"] = round(
        clamp(env["windSpeed"] + random.uniform(-1.2, 1.2), 4.0, 45.0),
        1,
    )
    env["temperature"] = round(
        clamp(env["temperature"] + random.uniform(-0.6, 0.6), -55.0, -10.0),
        1,
    )
    if env["windSpeed"] > 32:
        env["blizzard"] = True
    elif env["windSpeed"] < 22:
        env["blizzard"] = False


def apply_fault_values(component_id: str, severity: Severity) -> None:
    critical = severity == "critical"

    if component_id.startswith("room-"):
        room = find_room(component_id)
        if not room:
            return
        room["status"] = severity
        if critical:
            room["temperature"] = round(random.uniform(31.0, 36.5), 1)
        else:
            room["temperature"] = round(random.uniform(26.0, 28.5), 1)
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
            pipe["pressure"] = round(
                random.choice([random.uniform(0.4, 1.1), random.uniform(8.8, 11.5)]),
                2,
            )
        else:
            pipe["pressure"] = round(
                random.choice([random.uniform(1.8, 2.4), random.uniform(6.4, 7.4)]),
                2,
            )


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


async def broadcast_state() -> None:
    disconnected: list[WebSocket] = []
    for ws in tuple(clients):
        try:
            await ws.send_json(state)
        except (WebSocketDisconnect, RuntimeError):
            disconnected.append(ws)
    for ws in disconnected:
        clients.discard(ws)


async def telemetry_loop() -> None:
    while True:
        await asyncio.sleep(TICK_SECONDS)
        async with lock:
            now = utcnow()

            expired = [cid for cid, until in active_faults.items() if now >= until]
            for cid in expired:
                restore_component(cid)
                del active_faults[cid]

            faulted_ids = set(active_faults.keys())

            if random.random() < FAULT_CHANCE:
                candidate = random.choice(
                    ["generator", "pipeline", "room-1", "room-2", "room-3"]
                )
                if candidate not in faulted_ids:
                    severity: Severity = random.choice(["warning", "critical"])
                    apply_fault_values(candidate, severity)
                    recover_in = random.uniform(FAULT_RECOVER_MIN_S, FAULT_RECOVER_MAX_S)
                    active_faults[candidate] = now + timedelta(seconds=recover_in)
                    faulted_ids.add(candidate)

            apply_jitter(faulted_ids)
            check_low_stock()
            state["timestamp"] = iso_now()
            fuel_history.append({
                "timestamp": state["timestamp"],
                "fuelLevel": state["generator"]["fuelLevel"],
                "output": state["generator"]["output"],
            })
            if len(fuel_history) > MAX_HISTORY_POINTS:
                fuel_history.pop(0)

        await broadcast_state()


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(telemetry_loop())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="Antarctic Edge Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/energy/history")
async def get_energy_history():
    return fuel_history
clients: set[WebSocket] = set()
lock = asyncio.Lock()


@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    try:
        await websocket.send_json(state)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.discard(websocket)


@app.post("/fault/inject")
async def inject_fault(body: FaultInjectBody):
    async with lock:
        apply_fault_values(body.component, body.severity)
        recover_in = random.uniform(FAULT_RECOVER_MIN_S, FAULT_RECOVER_MAX_S)
        active_faults[body.component] = utcnow() + timedelta(seconds=recover_in)
        state["timestamp"] = iso_now()
        snapshot = dict(state)
    await broadcast_state()
    return snapshot


@app.post("/fault/clear/{component_id}")
async def clear_fault(component_id: ComponentId):
    async with lock:
        if component_id not in active_faults and (
            (component_id.startswith("room-") and find_room(component_id) and find_room(component_id)["status"] == "normal")
            or (component_id == "generator" and state["generator"]["status"] == "normal")
            or (component_id == "pipeline" and state["pipeline"]["status"] == "normal")
        ):
            raise HTTPException(status_code=400, detail=f"{component_id} has no active fault")
        restore_component(component_id)
        active_faults.pop(component_id, None)
        state["timestamp"] = iso_now()
        snapshot = dict(state)
    await broadcast_state()
    return snapshot


@app.get("/state")
async def get_state():
    return state


def inject_fault(component_id: str, severity: Severity) -> None:
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
    candidates: list[str] = []
    for room in state["rooms"]:
        if room["id"] not in active_faults:
            candidates.append(room["id"])
    if "generator" not in active_faults:
        candidates.append("generator")
    if "pipeline" not in active_faults:
        candidates.append("pipeline")
    if not candidates:
        return None
    return random.choice(candidates)


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
            apply_jitter(set(active_faults.keys()))
            if random.random() < FAULT_CHANCE:
                target = pick_random_healthy_component()
                if target:
                    inject_fault(target, random.choice(["warning", "critical"]))
            payload = snapshot()
        await broadcast(payload)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(telemetry_loop())
    yield
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


@app.get("/energy/history")
async def get_energy_history():
    return fuel_history

@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/state")
async def get_state():
    async with lock:
        return snapshot()


@app.post("/fault/inject")
async def fault_inject(body: FaultInjectBody):
    async with lock:
        if body.component.startswith("room-") and not find_room(body.component):
            raise HTTPException(status_code=404, detail="Unknown room")
        inject_fault(body.component, body.severity)
        payload = snapshot()
    await broadcast(payload)
    return payload


@app.post("/fault/clear/{component_id}")
async def fault_clear(component_id: str):
    valid = {"generator", "pipeline", "room-1", "room-2", "room-3"}
    if component_id not in valid:
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