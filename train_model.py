import pandas as pd
from sklearn.ensemble import IsolationForest  # type: ignore[reportMissingModuleSource]
import importlib

try:
	joblib = importlib.import_module("joblib")
except ModuleNotFoundError as exc:
	raise ModuleNotFoundError(
		"The 'joblib' package is required. Install it with: pip install joblib"
	) from exc

df = pd.read_csv("historical_sensor_data.csv")
features = ["fuelLevel", "generatorOutput", "pipelinePressure", "vibration", "roomTemp"]

model = IsolationForest(n_estimators=150, contamination=0.08, random_state=42)
model.fit(df[features])

joblib.dump(model, "maintenance_model.pkl")
print("Model trained and saved to maintenance_model.pkl")