from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from database import engine, Base
from routers import users, payments, videos

# Create database tables (For production, consider using Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Vizard AI Clone API",
    description="Backend API for the Vizard AI SaaS Clone",
    version="1.0.0"
)

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://contentwala.xyz",
        "https://vizard-saas.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(payments.router)
app.include_router(videos.router)

# Mount the uploads directory to serve media files
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Vizard AI SaaS Clone API"}
