# Vizard AI Clone

A full-stack AI SaaS application that takes long-form videos, automatically extracts audio, transcribes it using OpenAI Whisper, detects the most viral segments using OpenAI GPT-4o-mini, and generates engaging 9:16 vertical clips using FFmpeg. 
It features a full Next.js App Router frontend with Tailwind CSS and a high-performance FastAPI backend with PostgreSQL, Celery, Redis, and Razorpay payment integration for a credit-based monetization system.

## 🚀 Tech Stack

**Frontend:** Next.js 14 (App Router), React, TailwindCSS, Axios
**Backend:** FastAPI, Python, SQLAlchemy, PostgreSQL, PassLib, JWT
**Background Jobs:** Celery, Redis
**AI:** OpenAI Whisper (Transcription), OpenAI GPT (Clip Detection)
**Video Processing:** FFmpeg
**Payments:** Razorpay

## 📂 Project Structure

```text
vizard-saas/
├── frontend/             # Next.js App
│   ├── app/              # Routes (landing, auth, dashboard, upload, pricing)
│   ├── components/       # Shared UI components
│   └── .env.local        # Frontend Env variables
└── backend/              # FastAPI Application
    ├── main.py           # Entry point
    ├── database.py       # SQLAlchemy setup
    ├── models.py         # DB Models (Users, Videos, Clips, Transactions)
    ├── schemas.py        # Pydantic validation schemas
    ├── worker.py         # Celery tasks
    ├── routers/          # API Route handlers
    ├── services/         # AI and Video processing logic
    └── .env              # Backend Env variables
```

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL server running locally or externally
- Redis server running locally or externally (for Celery)
- FFmpeg installed (`brew install ffmpeg` on macOS)

### 1. Database Setup
Create a local PostgreSQL database, for example named `vizard_saas`.

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi "uvicorn[standard]" sqlalchemy asyncpg psycopg2-binary "passlib[bcrypt]" "python-jose[cryptography]" python-multipart razorpay openai celery redis pydantic-settings alembic

# Set up environment variables
# Edit backend/.env and add your actual OPENAI_API_KEY and RAZORPAY API Keys.
# Ensure DATABASE_URL is uncommented and matches your Postgres DB credentials.

# Start the FastAPI Server
uvicorn main:app --reload

# In a separate terminal session, start the Celery Worker
cd backend
source venv/bin/activate
celery -A worker.celery_app worker --loglevel=info
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Edit frontend/.env.local and add your actual NEXT_PUBLIC_RAZORPAY_KEY_ID

# Start the Next.js Development Server
npm run dev
```

### 4. Running the App
Open your browser and navigate to `http://localhost:3000`. You can test the application by signing up (this instantly grants you 5 free testing credits). 
Upload an MP4 video (up to 2GB via the polished drag-and-drop UI), wait for the Celery background worker to process the clip using OpenAI and FFmpeg, and see the extracted 9:16 Shorts appear dynamically on your dashboard!
