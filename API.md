# ParyavaranSanrakshan — RESTful API Specification

The API is served at `/api` with OpenAPI Swagger interactive documentation available at `/docs`.

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
- **Body**: `{ "name": "string", "email": "string", "password": "string", "role": "CITIZEN" }`
- **Response**: `{ "access_token": "string", "token_type": "bearer", "user": { ... } }`

### `POST /api/auth/login`
- **Body**: `{ "email": "string", "password": "string" }`
- **Response**: `{ "access_token": "string", "token_type": "bearer", "user": { ... } }`

### `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Current authenticated user profile object.

---

## 2. Waste Classification Endpoints

### `POST /api/waste/predict`
- **Content-Type**: `multipart/form-data`
- **Form Param**: `file` (Image binary: JPG, JPEG, PNG, max 10MB)
- **Response**:
```json
{
  "predicted_class": "plastic",
  "confidence": 0.946,
  "confidence_level": "HIGH",
  "category": "Dry / Recyclable Waste",
  "bin_color": "Blue",
  "recommendation": "Rinse empty bottles/containers, crush to save space, and place in recyclables.",
  "warning": null,
  "all_probabilities": {
    "cardboard": 0.012,
    "glass": 0.021,
    "metal": 0.015,
    "paper": 0.004,
    "plastic": 0.946,
    "trash": 0.002
  }
}
```

### `GET /api/waste/history`
- Returns audit logs of past scans for the authenticated citizen or system.

---

## 3. Smart Bin Endpoints

### `GET /api/bins`
- **Query Params**: `search`, `status` (`Normal`, `Warning`, `Critical`), `risk` (`LOW`, `MEDIUM`, `HIGH`), `waste_type`
- **Response**: Array of 20 virtual smart bins with latest readings, predictions, and priority scores.

### `GET /api/bins/{bin_id}`
- Returns specific bin record with telemetry readings and predictions.

### `POST /api/bins/simulate-update`
- **Role Required**: `ADMIN` or `COLLECTOR`
- **Action**: Generates realistic sensor readings, runs real ML prediction, updates bin status and priority scores.

---

## 4. Dashboard & Optimization Endpoints

### `GET /api/dashboard/summary`
- Returns `{ "total_bins": 20, "normal_count": 12, "warning_count": 5, "critical_count": 3, "average_fill": 62.4, "predicted_overflow_count": 4 }`

### `GET /api/dashboard/priority`
- Returns dynamically sorted today's collection priority list.

### `GET /api/dashboard/analytics`
- Returns waste category distribution, location fill levels, overflow risk breakdown, and weekly accumulation trends.

---

## 5. Collection Operations Endpoints

### `GET /api/collections`
- Returns collection audit logs.

### `POST /api/collections`
- **Body**: `{ "bin_id": 2, "after_fill": 10.0 }`
- **Action**: Resets bin fill to 10%, updates status to Normal, writes collection audit log, triggers new ML prediction.

---

## 6. Model Evaluation Endpoints

### `GET /api/models/metrics`
- Returns stored real ML evaluation metrics for all 3 models (Accuracy, Precision, Recall, F1, Confusion Matrix, MAE, RMSE, R²).

### `GET /health`
- Returns `{"status": "ok", "app": "ParyavaranSanrakshan", "version": "1.0.0"}`
