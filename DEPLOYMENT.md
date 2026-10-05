# ParyavaranSanrakshan — Deployment Guide

## Production Deployment Topology

- **Frontend**: [Vercel](https://vercel.com) (Static React 18 SPA with Edge CDN)
- **Backend**: [Railway](https://railway.app) (FastAPI Containerized Service)
- **Database**: [Neon](https://neon.tech) (Serverless PostgreSQL with SSL)

---

## 1. Database Provisioning (Neon PostgreSQL)

1. Create a free project at [https://neon.tech](https://neon.tech).
2. Create database `paryavaran`.
3. Copy the pooled connection string:
   `postgresql://username:password@ep-sample-123.us-east-2.aws.neon.tech/paryavaran?sslmode=require`
4. Use this connection string for `DATABASE_URL`.

---

## 2. Backend Deployment (Railway)

1. Link your GitHub repository to Railway.
2. Set the Root Directory to repository root or `backend`.
3. Add Environment Variables:
   ```env
   DATABASE_URL=postgresql://username:password@ep-sample-123.us-east-2.aws.neon.tech/paryavaran?sslmode=require
   JWT_SECRET=your_production_secret_key_here
   PORT=8000
   ENVIRONMENT=production
   ```
4. Railway will automatically build using `backend/Dockerfile` and start:
   `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
5. Verify health:
   `https://<railway-domain>/health` -> `{"status":"ok"}`

---

## 3. Frontend Deployment (Vercel)

1. In Vercel, click **Add New Project** and import the repository.
2. Set **Root Directory** to: `frontend`
3. Set **Framework Preset** to: `Vite`
4. Add Environment Variable:
   ```env
   VITE_API_BASE_URL=https://<railway-backend-domain>
   ```
5. Click **Deploy**. Vercel will build the SPA bundle with `npm run build` and deploy to global CDN edge nodes.
