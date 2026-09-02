"""Generates synthetic historical sensor data for predictive maintenance training."""
import csv
import random

random.seed(42)

ROWS = 2000
OUTPUT_FILE = "historical_sensor_data.csv"

def generate_row(is_anomaly: bool) -> dict:
    if is_anomaly:
        return {
            "fuelLevel": round(random.uniform(5, 35), 1),
            "generatorOutput": round(random.uniform(8, 25), 1),
            "pipelinePressure": round(random.choice([random.uniform(0.4, 1.8), random.uniform(7.5, 11)]), 2),
            "vibration": round(random.uniform(0.12, 0.3), 3),
            "roomTemp": round(random.uniform(27, 37), 1),
        }
    return {
        "fuelLevel": round(random.uniform(60, 98), 1),
        "generatorOutput": round(random.uniform(35, 50), 1),
        "pipelinePressure": round(random.uniform(3.4, 5.0), 2),
        "vibration": round(random.uniform(0.01, 0.08), 3),
        "roomTemp": round(random.uniform(19, 24), 1),
    }

def main():
    rows = []
    for _ in range(ROWS):
        is_anomaly = random.random() < 0.08  # ~8% anomalous, realistic for equipment history
        rows.append(generate_row(is_anomaly))

    with open(OUTPUT_FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} rows -> {OUTPUT_FILE}")

if __name__ == "__main__":
    main()