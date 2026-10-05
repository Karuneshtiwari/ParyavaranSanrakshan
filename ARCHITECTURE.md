# ParyavaranSanrakshan — System Architecture

```
                                  [ Citizen Device / Web Browser ]
                                                  │
                                                  ▼
                        [ Vercel CDN - React 18 + Vite + Tailwind CSS ]
                                                  │
                                       (HTTPS RESTful JSON)
                                                  │
                                                  ▼
                        [ Railway Cloud - FastAPI Asynchronous Backend ]
                                     │                     │
                     ┌───────────────┴────────┐            │
                     ▼                        ▼            ▼
             [ PyTorch Vision ]       [ Scikit-Learn ] [ Neon PostgreSQL ]
             • MobileNetV3-Small      • Multi-Output   • Bins & Readings
             • Waste Classification     Regressor      • Prediction Logs
             • 224x224 RGB Pipeline   • Overflow Clf   • Collection Audits
                                                       • JWT User Accounts
```

## System Components

### 1. Presentation Tier (React 18 + Vite)
- Built with React Router v6, Tailwind CSS, Leaflet, and Recharts.
- Deployed on **Vercel** serverless edge infrastructure.
- Interacts exclusively with the FastAPI REST API; **never touches database directly**.

### 2. Application & Inference Tier (FastAPI)
- Python 3.11/3.12 asynchronous runtime deployed on **Railway**.
- Hosts transfer-learning computer vision models and Random Forest regressors in memory for low-latency ($<120$ ms) inference.
- Enforces role-based access control (RBAC): `CITIZEN`, `COLLECTOR`, `ADMIN`.

### 3. Data Tier (Neon Serverless PostgreSQL)
- Connection managed through SQLAlchemy connection pool with SSL requirement.
- Relational tables: `users`, `waste_scans`, `bins`, `sensor_readings`, `predictions`, `collections`.
