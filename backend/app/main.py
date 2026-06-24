from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.seed import seed_database
from app.routes import auth, users, tickets, assets, kb, notifications, analytics

import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database tables (if PostgreSQL/SQLite is up)
    if not os.getenv("TESTING"):
        Base.metadata.create_all(bind=engine)
        
        # Run seeding
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instrument Prometheus metrics
Instrumentator().instrument(app).expose(app)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(tickets.router, prefix=settings.API_V1_STR)
app.include_router(assets.router, prefix=settings.API_V1_STR)
app.include_router(kb.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/")
def root_endpoint():
    return {"message": "Welcome to SupportSphere Enterprise Service Desk API", "docs": f"{settings.API_V1_STR}/docs"}
