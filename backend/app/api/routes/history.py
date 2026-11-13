from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.history_intelligence.historical_rag import HistoricalExperienceEngine

router = APIRouter(prefix="/history", tags=["Historical Safety Intelligence & RAG"])


class IncidentSearchSchema(BaseModel):
    query: str
    top_k: int = 4


@router.get("/incidents")
async def get_all_incidents():
    """Returns the full curated knowledge base of documented NASA spaceflight incidents,
    mishap reports, and EVA lessons learned with exact citations.
    """
    return HistoricalExperienceEngine.NASA_INCIDENT_ARCHIVE


@router.post("/search")
async def search_incidents(payload: IncidentSearchSchema):
    """Retrieval-Augmented Generation matching engine that maps current Martian mission conditions
    (e.g., steep slope fatigue, fine regolith dust in suit seals, cooling loop pressure drop)
    to historical spaceflight mishaps and actionable preventive precautions.
    """
    matches = HistoricalExperienceEngine.search_incidents(payload.query, top_k=payload.top_k)
    return {
        "query": payload.query,
        "matches_count": len(matches),
        "results": matches
    }


@router.get("/incidents/{code}")
async def get_incident(code: str):
    inc = HistoricalExperienceEngine.get_incident_by_code(code)
    if not inc:
        raise HTTPException(status_code=404, detail="Historical incident report not found")
    return inc
