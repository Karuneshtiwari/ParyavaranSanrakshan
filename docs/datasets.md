# ParyavaranSanrakshan — Dataset Documentation & Attribution

This document details the datasets utilized in the **ParyavaranSanrakshan** platform, their scientific provenance, class distributions, preparation procedures, and synthetic telemetry formulations.

---

## 1. Primary Dataset: TrashNet

- **Authors**: Gary Thung and Mindy Yang
- **Repository Source**: [https://github.com/garythung/trashnet](https://github.com/garythung/trashnet)
- **Dataset Purpose**: Image classification of household solid waste into 6 canonical streams.
- **Total Image Count**: 2,527 photographic images (RGB).

### Class Distribution

| Class | Image Count | % of Total | Prototype Municipal Category |
| :--- | :--- | :--- | :--- |
| **Cardboard** | 403 | 15.9% | Dry / Recyclable (Blue) |
| **Glass** | 501 | 19.8% | Dry / Recyclable (Blue) |
| **Metal** | 410 | 16.2% | Dry / Recyclable (Blue) |
| **Paper** | 594 | 23.5% | Dry / Recyclable (Blue) |
| **Plastic** | 482 | 19.1% | Dry / Recyclable (Blue) |
| **Trash (Reject)** | 137 | 5.4% | General / Reject (Black) |
| **Total** | **2,527** | **100.0%** | |

### Splitting Protocol
We utilize a stratified splitting strategy implemented in `ml/scripts/prepare_dataset.py`:
- **Training Set (70%)**: 1,768 images
- **Validation Set (15%)**: 379 images
- **Hold-out Test Set (15%)**: 380 images

---

## 2. Synthetic Smart-Bin Telemetry Dataset

- **Official Label**: *"Synthetic Smart-Bin Telemetry Dataset for Prototype Demonstration"*
- **Record Count**: 19,200 hourly telemetry observations across 20 virtual smart bins.
- **Generation Script**: `ml/scripts/generate_bin_data.py`
- **Output Files**: `data/synthetic_bin_telemetry.csv` and `ml/data/synthetic_bin_telemetry.csv`

### Feature Fields Schema

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Auto-increment primary identifier |
| `bin_id` | String | Receptacle code (B001 to B020) |
| `location` | String | Fictional demo campus location name |
| `timestamp` | Datetime | ISO 8601 hourly reading timestamp |
| `fill_level` | Float | Current ultrasonic/optical volume fill percentage (0–100%) |
| `previous_fill_level`| Float | Prior hour fill percentage |
| `fill_change_rate` | Float | Hourly delta change rate (%/hour) |
| `day_of_week` | Integer | 0 (Monday) through 6 (Sunday) |
| `hour` | Integer | 0 through 23 (24-hour diurnal clock) |
| `is_weekend` | Integer | Binary flag (1 for Sat/Sun, 0 for weekdays) |
| `waste_type` | String | Dominant segregated waste stream |
| `temperature` | Float | Ambient sensor temperature (°C) |
| `hours_since_collection`| Integer | Elapsed hours since last complete clearance |
| `collection_status`| String | `NORMAL` or `COLLECTED` |
| `future_fill_6h` | Float | Multi-horizon forecast target at +6 hours |
| `future_fill_12h`| Float | Multi-horizon forecast target at +12 hours |
| `overflow_risk` | String | Classified risk tier: `LOW`, `MEDIUM`, or `HIGH` |

### Location Dynamics
- **Food Court & Cafeteria**: Heavy accumulation spikes during lunch (12:00–14:00) and dinner (19:00–21:00).
- **Market & Shopping Areas**: Evening and weekend surge multipliers (1.6x).
- **Library & Academic Blocks**: Moderate, highly stable daytime rates, nearly zero night accumulation.
- **Hostels**: Morning (07:00–09:00) and late evening (20:00–23:00) peaks.
- **Bus Stops & Transit**: Commuter spikes during 08:00–10:00 and 17:00–20:00.

---

## 3. Optional Dataset: TACO (Trash Annotations in Context)
- **Source**: [https://github.com/pedropro/TACO](https://github.com/pedropro/TACO)
- **Scope**: Documented as an optional advanced dataset for future bounding-box object detection. Not required for the core MVP classification and prediction pipelines.
