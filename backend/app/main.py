from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.database.base import create_tables
from app.database.seed_data import seed_database
from app.api.routes import missions, observations, routes, experiments, geospatial, history, simulation, digital_twin, ml, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and seed demo mission data
    create_tables()
    seed_database()
    yield


app = FastAPI(
    title="MARS-GUARD API",
    description="Martian Adaptive Risk, Safety & Guidance Using AI, Research and Digital-Twin Intelligence",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(missions.router, prefix="/api")
app.include_router(observations.router, prefix="/api")
app.include_router(routes.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")
app.include_router(geospatial.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")
app.include_router(digital_twin.router, prefix="/api")
app.include_router(ml.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "system": "MARS-GUARD Planetary Safety Platform",
        "version": "1.0.0",
        "challenge": "NASA Space Apps: Interplanetary Survival Guide — Martian Map",
        "modules_active": [
            "Module 1: Real-time Telemetry & Adaptive Intelligence",
            "Module 2: Interactive Martian Map & Navigation",
            "Module 3: Safety-First Route Optimization & Comfort",
            "Module 4: 8-Category Multimodal NASA Data Integration",
            "Module 5: AI Experiment Classification & Human Approval",
            "Module 6: Earth-Based Experiment Simulation Lab",
            "Module 7: Historical Astronaut Incident RAG Intelligence",
            "Module 8: Astronaut-Updated Digital Twin"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

