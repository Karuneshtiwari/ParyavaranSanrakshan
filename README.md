# ParyavaranSanrakshan

> **AI-Powered Smart Waste Segregation and Collection Prediction Platform**  
> *"Caring for the earth, as one cares for a mother."*  
> **|| माता भूमि: पुत्रों अहम् पृथिव्या: ||**  
> *Designed by Karunesh Kumar Tiwari*  
> *Supporting Sustainable Cities and Communities*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/Deep%20Learning-PyTorch-EE4C2C?logo=pytorch)](https://pytorch.org)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Neon](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599)](https://neon.tech)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5)](https://cloudinary.com)

---

## Project Overview

**ParyavaranSanrakshan** is a full-stack applied AI platform demonstrating how Computer Vision and Machine Learning optimize solid waste management across urban communities, municipal zones, and smart campus environments.

### Core Architecture Highlights
- **Computer Vision Waste Classifier**: Fine-tuned MobileNetV3-Small deep learning model trained on local multi-class waste dataset (2,527 images) classifying Cardboard, Glass, Metal, Paper, Plastic, and Trash.
- **Cloudinary Storage**: High-speed cloud image persistence for all live scanner captures, uploaded waste images, and user/collector profile avatars.
- **Neon PostgreSQL Database**: Cloud-hosted PostgreSQL managing users, scans, virtual bins, telemetry records, community drives, contact messages, and verified Razorpay donations with automatic schema migrations.
- **Bilingual Interface**: Single unified toggle between English and Hindi (`अ / A`) across all public and protected portals.
- **Tripartite Architecture**: Dedicated role-based portals for Conscious Citizens, Municipality Collectors, and Urban Administrators.
- **Full In-Dashboard Encapsulation**: Once logged in, Citizens and Collectors navigate entirely within their respective dashboard portals (AI Scanner, Events, Donate, History, Profile) without public navbar/footer redirects.
- **Mandatory 2FA OTP Verification**: High-security 6-digit email OTP required for both registration AND login across all roles (Citizen, Collector, Admin).

---

## Key Functional Modules

### 1. Conscious Citizen Portal (Encapsulated Dashboard)
- **Top Brand Bar**: Quick session exit to Home (securely clearing session to prevent unauthorized kiosk reuse) and one-click logout.
- **Overview Tab**: Live telemetry KPI cards, environmental badges, carbon offset tracker, and recent activity logs.
- **Embedded AI Waste Scanner**:
  - Live Device Camera Stream with targeting viewfinder and instant capture.
  - File / Gallery Upload supporting JPG, JPEG, and PNG.
  - Real-time Deep Learning inference with confidence scores and segregation instructions.
  - Scan History fetched directly from Cloudinary with full image previews and "Clear History" button.
- **Events & Community Drives Tab**:
  - Browse ongoing, upcoming, and completed municipal drives.
  - Official Event Enrollment modal requiring a **strict 10-digit Indian mobile number** (`^[6-9]\d{9}$`).
  - Auto-fills citizen name & email while disallowing duplicate enrollments.
  - Dispatches an official email pass directly to the citizen's inbox.
  - "My Registered Events" sub-panel displaying active registrations with dates, venue, and status.
- **Embedded Donate Tab**: Preset contribution cards (₹250 Tree Plantation, ₹500 Worker Kit, ₹1500 Smart IoT Sensor) and custom donation modal connected to Razorpay.
- **Profile Customization Tab**: Update full name, 10-digit mobile number, and upload high-resolution profile photos directly to Cloudinary cloud storage.

### 2. Municipality Collector Portal (Matches Sample Image 2)
- **Dark Emerald Left Sidebar (`#072617`)**:
  - Brand header with project emblem, "ParyavaranSanrakshan", and "AI for Cleaner Communities".
  - Dedicated tabs: `Dashboard`, `My Collections`, `Priority Bins`, `Bin Map`, `Collection History`, `Donate`, `Profile`, and `Settings`.
  - Botanical leaf artwork with sacred motto: *"Collect Today for a Cleaner Tomorrow"*.
  - Red-accented secure Logout button.
- **Top Header**: Live notification bell with unread badge count, Collector profile avatar, and "Waste Collector" role identifier.
- **4 Operational KPI Cards**:
  - `Critical Bins` (light rose background, red alert triangle).
  - `High Priority Bins` (light amber background, warning circle).
  - `Assigned Bins` (light green background, municipal truck icon).
  - `Collected Today` (light mint background, checkmark circle).
- **Interactive Leaflet Bin Map**: Real-time Bengaluru ward map with custom SVG bin icons replacing generic plus marks, dynamic pulse animations, and automatic fly-to centering on bin selection.
- **Bins to Collect Action Table**: Real-time fill levels, 6-hour prediction regression, risk score, distance, and 1-click `Collect` action button.
- **Bin Details Panel**:
  - Real bin photograph and bin code badge.
  - Circular radial fill gauge showing current liters (e.g. `480 / 500 L`) and percentage.
  - 6h and 12h predicted fill levels and overflow risk assessment.
  - Big Dark Green `🚚 Mark As Collected` button that updates fill level to 10% and notifies Central Admin.
  - **Recent Fill Trend Area Chart**: SVG timeline graph displaying historical fill levels across the previous 7 days with gradient shading.
  - Precise GPS coordinates (Latitude, Longitude) and last collection timestamps.
- **Real-Time Live Device Clock**: Rotating, real-time live device clock displaying day, date, and ticking hours/minutes/seconds.
- **Collector Events & Drives Tab**: Dedicated section for field collectors to discover, filter, and register for municipal cleanliness drives and workshops.
- **Embedded Donate & Profile Tabs**: Allows collectors to contribute to safety initiatives and manage their profile details.
- **Zero Citizen References**: Fully customized for field municipal collection without citizen-specific tags or rank systems.

### 3. Urban Administrator Command Center
- **Smart Bin Telemetry Operations**: Live bin simulation, threshold alerts, and dynamic priority dispatch scoring.
- **Dedicated Users Management Portal (`/admin/users`)**: Comprehensive directory filtering across Citizens, Collectors, Donors, and Newsletter Subscribers. Displays profile avatars, contact details, attended event counts, collector bin/route assignment, direct individual email dispatch modal, and secure account deletion.
- **In-Dashboard AI Scanner (`/admin/scanner`)**: Seamless access to the AI Waste Scanner directly within the Admin command center.
- **Live Logs & Refresh**: Real-time audit logs with instant manual refresh button and live spinning indicator.
- **Broadcast Email Dispatcher**: Rich-text bulletin email composer converting Markdown (`**bold**`, `*italic*`, `<u>underline</u>`, bullet lists, headers) into inline-styled responsive HTML sent via non-blocking Gmail SMTP.
- **CMS & Publishing**: Direct management of Featured Articles, Community Bulletins, and Newsletter subscribers.
- **Community Contributions**: Verified audit log of Razorpay contributions and contact form telemetry.

### 4. Multi-Tier Authentication & Security (2FA OTP)
- **Universal 2-Factor Authentication**: Every login and registration generates a secure, cryptographically random 6-digit OTP dispatched to the user's email address.
- **Role Isolation**: Direct redirection to `/admin/dashboard`, `/collector/dashboard`, or `/citizen/dashboard` upon OTP verification.
- **Google OAuth Integration**: Role-aware Google single sign-on supporting both Citizen and Collector roles without defaulting.
- **Forgot Password Flow**: Secure 6-digit OTP dispatched to registered email with 1-click password reset.

---

## Machine Learning Models & Metrics

Zero hard-coded metrics are used in this application. All values are loaded from saved test-set evaluation artifacts generated during training.

| System | Model | Dataset | Primary Metrics | Performance |
| :--- | :--- | :--- | :--- | :--- |
| **Waste Scanner** | MobileNetV3-Small | TrashNet (2,527 images) | Accuracy, Precision, Recall, F1 | **Validation Accuracy: 82.1%** |
| **Fill Regressor** | Multi-Output RandomForest | Synthetic Telemetry (19,200 records) | MAE, RMSE, $R^2$ (6h & 12h) | **6h MAE: 6.26% ($R^2=0.75$)**<br>12h MAE: 9.97% ($R^2=0.53$) |
| **Overflow Classifier** | RandomForest Classifier | Synthetic Telemetry (19,200 records) | Accuracy, Precision, Recall, F1 | **Accuracy: 99.79%**<br>F1: 99.80% |

---

## Technology Stack

- **Backend**: FastAPI (Python 3.10+), SQLAlchemy, Pydantic, aiosmtplib, bcrypt, PyJWT, Cloudinary Python SDK.
- **ML / DL**: PyTorch (MobileNetV3 transfer learning), Scikit-learn, Joblib, Pillow.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide SVG Icons, Leaflet (OpenStreetMap).
- **Database**: Neon Serverless PostgreSQL.
- **Storage**: Cloudinary Media Assets.
- **Email Service**: Non-blocking Gmail SMTP dispatch with responsive HTML templates.

---

## How to Run the Project Locally

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- Active Neon PostgreSQL `DATABASE_URL` in `backend/.env`
- Active Cloudinary credentials in `backend/.env`

### 2. Backend Setup
```bash
# Navigate to project root
cd ParyavaranSanrakshan

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt
pip install aiosmtplib jinja2 cloudinary

# Run FastAPI backend with auto-reload
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API will be live at `http://127.0.0.1:8000`.  
Interactive Swagger docs: `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd ParyavaranSanrakshan/frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```
The React frontend will be accessible at `http://localhost:5173`.

---

## Credentials & Quick Demo Profiles

| Role | Email | Password | Access Type |
| :--- | :--- | :--- | :--- |
| **Administrator** | `karunesh128@gmail.com` | `AdminOfParyavaranSanrakshan@@789` | Direct Login + Email OTP Verification |
| **Field Collector** | `collector@paryavaran.org` | `collector123` | Direct / Pre-verified Demo |
| **Eco Citizen** | `citizen@paryavaran.org` | `citizen123` | Direct / Pre-verified Demo |

---

## Social & Community Contacts

- **Facebook**: [Karunesh Kumar Tiwari](https://www.facebook.com/karuneshkumar.tiwari.1)
- **LinkedIn**: [Karunesh Kumar Tiwari](https://www.linkedin.com/in/karunesh-kumar-tiwari-72474a330)
- **WhatsApp**: [+91 7991541531](https://wa.me/+917991541531)
- **X (Twitter)**: [@karunesh108](https://x.com/karunesh108)
- **Email**: `info.karuneshtiwari@gmail.com`

---

*Designed and Developed by Karunesh Kumar Tiwari for ParyavaranSanrakshan.*
