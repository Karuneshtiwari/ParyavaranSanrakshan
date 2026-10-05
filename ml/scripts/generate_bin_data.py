"""
Synthetic Smart-Bin Telemetry Dataset Generator
Dataset Label: "Synthetic Smart-Bin Telemetry Dataset for Prototype Demonstration"
Generates >= 10,000 realistic hourly records for 20 virtual smart bins with domain-specific accumulation patterns.
"""

import os
import math
import random
import datetime
import sys
import numpy as np
import pandas as pd

# Define 20 virtual smart bins
VIRTUAL_BINS = [
    {"bin_id": "B001", "location": "Main Gate", "latitude": 13.0489, "longitude": 80.2412, "capacity": 100, "waste_type": "Mixed / General", "pattern": "transit"},
    {"bin_id": "B002", "location": "Food Court", "latitude": 13.0512, "longitude": 80.2435, "capacity": 120, "waste_type": "Organic / Food", "pattern": "dining"},
    {"bin_id": "B003", "location": "Hostel A", "latitude": 13.0534, "longitude": 80.2458, "capacity": 100, "waste_type": "Dry / Recyclable", "pattern": "hostel"},
    {"bin_id": "B004", "location": "Hostel B", "latitude": 13.0545, "longitude": 80.2462, "capacity": 100, "waste_type": "Mixed / General", "pattern": "hostel"},
    {"bin_id": "B005", "location": "Library", "latitude": 13.0498, "longitude": 80.2428, "capacity": 80,  "waste_type": "Paper / Recyclable", "pattern": "quiet"},
    {"bin_id": "B006", "location": "Parking Area", "latitude": 13.0475, "longitude": 80.2395, "capacity": 90,  "waste_type": "Plastic / Dry", "pattern": "parking"},
    {"bin_id": "B007", "location": "Market Area", "latitude": 13.0556, "longitude": 80.2480, "capacity": 150, "waste_type": "Mixed / General", "pattern": "market"},
    {"bin_id": "B008", "location": "Residential Area", "latitude": 13.0568, "longitude": 80.2495, "capacity": 110, "waste_type": "Domestic / Dry", "pattern": "residential"},
    {"bin_id": "B009", "location": "Commercial Area", "latitude": 13.0520, "longitude": 80.2440, "capacity": 120, "waste_type": "Packaging / Cardboard", "pattern": "commercial"},
    {"bin_id": "B010", "location": "Bus Stop", "latitude": 13.0468, "longitude": 80.2382, "capacity": 90,  "waste_type": "Plastic / Bottles", "pattern": "transit"},
    {"bin_id": "B011", "location": "Academic Block", "latitude": 13.0505, "longitude": 80.2420, "capacity": 100, "waste_type": "Paper / Dry", "pattern": "academic"},
    {"bin_id": "B012", "location": "Sports Complex", "latitude": 13.0575, "longitude": 80.2510, "capacity": 110, "waste_type": "Plastic / Beverage", "pattern": "sports"},
    {"bin_id": "B013", "location": "Cafeteria", "latitude": 13.0515, "longitude": 80.2430, "capacity": 100, "waste_type": "Organic / Food", "pattern": "dining"},
    {"bin_id": "B014", "location": "Auditorium", "latitude": 13.0490, "longitude": 80.2410, "capacity": 130, "waste_type": "Mixed / Dry", "pattern": "events"},
    {"bin_id": "B015", "location": "Shopping Area", "latitude": 13.0540, "longitude": 80.2470, "capacity": 120, "waste_type": "Packaging / Plastic", "pattern": "market"},
    {"bin_id": "B016", "location": "Community Center", "latitude": 13.0550, "longitude": 80.2485, "capacity": 100, "waste_type": "Mixed / General", "pattern": "residential"},
    {"bin_id": "B017", "location": "Park", "latitude": 13.0480, "longitude": 80.2400, "capacity": 80,  "waste_type": "Dry / Organic", "pattern": "park"},
    {"bin_id": "B018", "location": "Railway/Transit Area", "latitude": 13.0460, "longitude": 80.2370, "capacity": 140, "waste_type": "Mixed / Plastic", "pattern": "transit"},
    {"bin_id": "B019", "location": "Hospital Area", "latitude": 13.0585, "longitude": 80.2525, "capacity": 100, "waste_type": "General / Non-Biohazard", "pattern": "hospital"},
    {"bin_id": "B020", "location": "Public Square", "latitude": 13.0528, "longitude": 80.2450, "capacity": 120, "waste_type": "Mixed / Recyclable", "pattern": "market"},
]


def get_base_rate(pattern: str, hour: int, is_weekend: bool) -> float:
    """Returns realistic hourly fill accumulation rate based on location pattern and temporal factors."""
    if pattern == "dining":
        # Peaks around lunch (12-15) and dinner (19-22)
        if 12 <= hour <= 14:
            rate = 9.0 + (3.0 if is_weekend else 2.0)
        elif 19 <= hour <= 21:
            rate = 8.5 + (3.5 if is_weekend else 1.5)
        elif 8 <= hour <= 10:
            rate = 4.0
        elif 0 <= hour <= 6:
            rate = 0.3
        else:
            rate = 2.5
    elif pattern == "market":
        # Peaks in evenings and much heavier on weekends
        multiplier = 1.6 if is_weekend else 1.0
        if 16 <= hour <= 21:
            rate = 7.5 * multiplier
        elif 10 <= hour <= 15:
            rate = 4.5 * multiplier
        elif 0 <= hour <= 7:
            rate = 0.2
        else:
            rate = 2.0
    elif pattern == "hostel":
        # Peaks morning (7-9) and late evening (20-23)
        if 7 <= hour <= 9 or 20 <= hour <= 23:
            rate = 6.0
        elif 12 <= hour <= 14:
            rate = 4.0
        elif 1 <= hour <= 6:
            rate = 0.4
        else:
            rate = 2.2
    elif pattern == "quiet":
        # Library: lower and stable waste, very low at night
        if 9 <= hour <= 18:
            rate = 2.2 if not is_weekend else 1.4
        else:
            rate = 0.2
    elif pattern == "transit":
        # Commuter peaks 8-10 AM and 5-8 PM
        if 8 <= hour <= 10 or 17 <= hour <= 20:
            rate = 7.0 if not is_weekend else 4.0
        elif 11 <= hour <= 16:
            rate = 3.5
        elif 0 <= hour <= 5:
            rate = 0.5
        else:
            rate = 2.0
    elif pattern == "academic":
        if 9 <= hour <= 17 and not is_weekend:
            rate = 5.5
        elif 17 <= hour <= 20 and not is_weekend:
            rate = 2.5
        else:
            rate = 0.3
    elif pattern == "sports":
        if (6 <= hour <= 9 or 16 <= hour <= 20):
            rate = 6.0 * (1.4 if is_weekend else 1.0)
        else:
            rate = 0.8
    elif pattern == "hospital":
        if 8 <= hour <= 18:
            rate = 4.5
        else:
            rate = 1.8
    else:  # residential, park, events
        if 17 <= hour <= 21:
            rate = 4.5 * (1.3 if is_weekend else 1.0)
        elif 9 <= hour <= 16:
            rate = 2.8
        else:
            rate = 0.5

    # Add realistic controlled noise
    noise = np.random.normal(0, 0.4)
    return max(0.1, rate + noise)


def get_ambient_temperature(hour: int, month: int) -> float:
    """Simulates realistic tropical/subtropical temperature curve in Celsius."""
    base_temp = 28.0 + 3.0 * math.sin((month / 12.0) * 2 * math.pi)
    diurnal = 5.5 * math.sin(((hour - 9) / 24.0) * 2 * math.pi)
    noise = np.random.normal(0, 0.5)
    return round(base_temp + diurnal + noise, 1)


def generate_dataset(num_days: int = 40) -> pd.DataFrame:
    """Simulates multi-week sensor readings for all 20 bins."""
    np.random.seed(42)
    random.seed(42)

    start_date = datetime.datetime(2026, 8, 1, 0, 0, 0)
    records = []
    record_id = 1

    print(f"Generating realistic telemetry for {len(VIRTUAL_BINS)} bins over {num_days} days...")

    for bin_info in VIRTUAL_BINS:
        bin_id = bin_info["bin_id"]
        location = bin_info["location"]
        pattern = bin_info["pattern"]
        waste_type = bin_info["waste_type"]

        # Initial conditions
        current_fill = round(random.uniform(5.0, 25.0), 1)
        hours_since_collection = random.randint(1, 8)

        total_hours = num_days * 24

        for step in range(total_hours):
            current_time = start_date + datetime.timedelta(hours=step)
            hour = current_time.hour
            day_of_week = current_time.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            temp = get_ambient_temperature(hour, current_time.month)

            previous_fill = current_fill
            rate = get_base_rate(pattern, hour, is_weekend)

            # Check collection trigger if bin is full (> 85%) or schedule
            collection_status = "NORMAL"
            if current_fill >= 88.0 and (hour in [6, 14, 22] or current_fill >= 94.0):
                # Collection event happened!
                collection_status = "COLLECTED"
                current_fill = round(random.uniform(4.0, 12.0), 1)
                hours_since_collection = 0
                fill_change_rate = round(current_fill - previous_fill, 2)
            else:
                current_fill = min(100.0, round(current_fill + rate, 1))
                hours_since_collection += 1
                fill_change_rate = round(current_fill - previous_fill, 2)

            records.append({
                "id": record_id,
                "bin_id": bin_id,
                "location": location,
                "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                "fill_level": current_fill,
                "previous_fill_level": previous_fill,
                "fill_change_rate": fill_change_rate,
                "day_of_week": day_of_week,
                "hour": hour,
                "is_weekend": is_weekend,
                "waste_type": waste_type,
                "temperature": temp,
                "hours_since_collection": hours_since_collection,
                "collection_status": collection_status
            })
            record_id += 1

    df = pd.DataFrame(records)

    # Calculate future fill horizons (6 hours and 12 hours) and overflow labels for training
    print("Calculating multi-horizon target variables (6h, 12h) and overflow risk labels...")
    
    # Sort for time-series operations
    df = df.sort_values(by=["bin_id", "timestamp"]).reset_index(drop=True)
    
    # Group by bin_id to calculate future targets
    df["future_fill_6h"] = df.groupby("bin_id")["fill_level"].shift(-6)
    df["future_fill_12h"] = df.groupby("bin_id")["fill_level"].shift(-12)

    # Fill tail horizon with realistic extrapolation
    df["future_fill_6h"] = df["future_fill_6h"].fillna(df["fill_level"] + df["fill_change_rate"] * 6).clip(0, 100)
    df["future_fill_12h"] = df["future_fill_12h"].fillna(df["fill_level"] + df["fill_change_rate"] * 12).clip(0, 100)

    # Overflow risk label definition:
    # HIGH: Current fill >= 80% OR predicted 6h >= 85%
    # MEDIUM: Current fill >= 60% OR predicted 6h >= 65%
    # LOW: Otherwise
    def assign_overflow_risk(row):
        cur = row["fill_level"]
        fut6 = row["future_fill_6h"]
        if cur >= 80.0 or fut6 >= 85.0:
            return "HIGH"
        elif cur >= 55.0 or fut6 >= 65.0:
            return "MEDIUM"
        else:
            return "LOW"

    df["overflow_risk"] = df.apply(assign_overflow_risk, axis=1)

    return df


def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    out_dir_ml = os.path.join(base_dir, "ml", "data")
    out_dir_data = os.path.join(base_dir, "data")
    os.makedirs(out_dir_ml, exist_ok=True)
    os.makedirs(out_dir_data, exist_ok=True)

    df = generate_dataset(num_days=40)
    print(f"\n[✓] Generated {len(df):,} synthetic telemetry records (Target was >= 10,000).")
    print(f"Columns: {list(df.columns)}")
    print("\nOverflow Risk Distribution:")
    print(df["overflow_risk"].value_counts(normalize=True).round(3))

    out_file_ml = os.path.join(out_dir_ml, "synthetic_bin_telemetry.csv")
    out_file_data = os.path.join(out_dir_data, "synthetic_bin_telemetry.csv")

    df.to_csv(out_file_ml, index=False)
    df.to_csv(out_file_data, index=False)
    print(f"\nDataset saved successfully to:\n  -> {out_file_ml}\n  -> {out_file_data}")
    print("\nDataset Label:")
    print("'Synthetic Smart-Bin Telemetry Dataset for Prototype Demonstration'")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    main()
