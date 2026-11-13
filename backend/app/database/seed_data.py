import uuid
from datetime import datetime, timedelta
from app.database.base import sync_engine, Session, Base
from app.database.guid import GUID
from app.models.user import User, UserRole
from app.models.mission import Mission, MissionStatus, RiskLevel
from app.models.hazard import Hazard, HazardSeverity, HazardSource
from app.models.observation import Observation, ObservationCategory, ObservationType, DataSource
from app.models.route import Route, RouteCandidate
from app.models.experiment import Experiment, ExperimentClass, ExperimentStatus, ExperimentPriority, InterventionClass
from app.models.historical_incident import HistoricalIncident
from app.models.dataset_metadata import DatasetMetadata
from app.models.mission_event import MissionEvent
from app.geospatial.nasa_layers import NASALayerCatalog
from app.history_intelligence.historical_rag import HistoricalExperienceEngine
from app.route_engine.route_optimizer import RouteOptimizer
from app.geospatial.mars_gis import MarsGIS


def seed_database():
    """Seeds the SQLite database with full Jezero demonstration mission,
    NASA datasets, historical incidents, and demo scientific experiments.
    """
    Base.metadata.create_all(bind=sync_engine)
    session = Session(sync_engine)

    try:
        # Check if already seeded
        if session.query(User).first():
            print("Database already contains seed data. Skipping re-seed.")
            return

        print("Seeding MARS-GUARD demonstration data...")

        # 1. Users
        commander = User(
            id=uuid.uuid4(),
            email="commander.chen@mars-guard.org",
            hashed_password="demo_hashed_password",
            full_name="Sarah Chen (Mission Commander)",
            role=UserRole.COMMANDER,
            is_active=True
        )
        astronaut = User(
            id=uuid.uuid4(),
            email="astronaut.thorne@mars-guard.org",
            hashed_password="demo_hashed_password",
            full_name="Dr. Mark Thorne (EVA Specialist)",
            role=UserRole.ASTRONAUT,
            is_active=True
        )
        researcher = User(
            id=uuid.uuid4(),
            email="scientist.rostova@mars-guard.org",
            hashed_password="demo_hashed_password",
            full_name="Dr. Elena Rostova (Lead Planetary Geologist)",
            role=UserRole.RESEARCHER,
            is_active=True
        )
        session.add_all([commander, astronaut, researcher])
        session.flush()

        # 2. Demonstration Mission: EVA-07 Jezero Crater
        mission_id = uuid.uuid4()
        mission = Mission(
            id=mission_id,
            name="EVA-07: Scientific Exploration and Safety Assessment Near Jezero Crater",
            description="Two-person astronaut exploration sortie to assess delta front sediment strata, collect clay core samples, and evaluate traversing safety over ancient delta deposits.",
            status=MissionStatus.ACTIVE,
            commander_id=commander.id,
            crew_ids=[str(commander.id), str(astronaut.id)],
            start_lat=18.3800,
            start_lon=77.5800,
            start_elevation_m=-2530.0,
            dest_lat=18.4200,
            dest_lon=77.5200,
            dest_elevation_m=-2480.0,
            planned_start_time=datetime.utcnow() - timedelta(hours=1),
            planned_duration_hours=4.5,
            actual_start_time=datetime.utcnow() - timedelta(minutes=45),
            risk_level=RiskLevel.MEDIUM,
            tags=["Jezero", "Delta Front", "Smectite", "EVA-07", "SpaceApps"],
            notes="Primary focus on safety constraints: maintain > 15m clearance from scree slopes."
        )
        session.add(mission)
        session.flush()

        # 3. Active Hazards
        h1 = Hazard(
            id=uuid.uuid4(),
            mission_id=mission_id,
            name="Delta Scarp Unconsolidated Scree",
            description="Unstable talus slope along delta front escarpment; risk of rock slide under astronaut foot pressure.",
            severity=HazardSeverity.HIGH,
            category="ROCK_FALL",
            lat=18.4120,
            lon=77.5280,
            elevation_m=-2495.0,
            affected_radius_m=85.0,
            confidence=0.92,
            source=HazardSource.OBSERVED,
            mitigation_steps=["Maintain minimum 25m standoff from cliff base", "Traverse along southern bench only"]
        )
        h2 = Hazard(
            id=uuid.uuid4(),
            mission_id=mission_id,
            name="Séítah Basaltic Dune Sand Trap",
            description="Deep unconsolidated windblown basalt sand ripple corridor with severe rover wheel sinkage risk.",
            severity=HazardSeverity.MEDIUM,
            category="DUST_TRAP",
            lat=18.3910,
            lon=77.6180,
            elevation_m=-2560.0,
            affected_radius_m=120.0,
            confidence=0.88,
            source=HazardSource.DERIVED,
            mitigation_steps=["Engage Autonomous Traction Control", "Maintain heading perp to dune crests"]
        )
        session.add_all([h1, h2])
        session.flush()

        # 4. Route with Candidate Paths
        hazards_list = [
            {"lat": 18.4120, "lon": 77.5280, "affected_radius_m": 85.0, "severity": "HIGH", "name": "Delta Scarp Scree"},
            {"lat": 18.3910, "lon": 77.6180, "affected_radius_m": 120.0, "severity": "MEDIUM", "name": "Séítah Sand Trap"}
        ]
        route_plan = RouteOptimizer.plan_routes(
            start_lat=18.3800,
            start_lon=77.5800,
            dest_lat=18.4200,
            dest_lon=77.5200,
            hazards=hazards_list,
            alpha=0.5, beta=0.3, gamma=0.2
        )

        route = Route(
            id=uuid.uuid4(),
            mission_id=mission_id,
            constraints={"max_slope_deg": 18.0, "max_eva_hours": 6.0, "max_radiation_usv": 160.0}
        )
        session.add(route)
        session.flush()

        for cand in route_plan["candidates"]:
            cand_id = uuid.UUID(cand["id"]) if isinstance(cand["id"], str) else uuid.uuid4()
            rc = RouteCandidate(
                id=cand_id,
                route_id=route.id,
                name=cand["name"],
                description=cand["description"],
                waypoints=cand["waypoints"],
                geometry_geojson=cand["geometry_geojson"],
                total_distance_km=cand["total_distance_km"],
                estimated_duration_hours=cand["estimated_duration_hours"],
                risk_score=cand["risk_score"],
                comfort_score=cand["comfort_score"],
                energy_cost_estimate=cand["energy_cost_kcal"],
                hazard_count=len(cand["hazard_intersections"]),
                is_selected=cand["is_selected"],
                hard_constraints_met=cand["hard_constraints_met"],
                rejection_reason=cand.get("rejection_reason"),
                selection_rationale=cand.get("selection_rationale")
            )
            session.add(rc)
            if cand["is_selected"]:
                route.selected_candidate_id = cand_id
                mission.active_route_candidate_id = cand_id

        # 5. Scientific Experiments
        exp1 = Experiment(
            id=uuid.uuid4(),
            mission_id=mission_id,
            name="Jezero Delta Front Fe/Mg-Smectite Core Drilling",
            description="Rotary percussive core acquisition into bottomset lacustrine mudstone strata to extract ancient biosignature samples.",
            experiment_class=ExperimentClass.GEOLOGICAL_SAMPLING,
            lat=18.4210,
            lon=77.5190,
            elevation_m=-2482.0,
            planned_start_time=datetime.utcnow() + timedelta(hours=1),
            planned_duration_minutes=45,
            status=ExperimentStatus.PLANNED,
            priority=ExperimentPriority.CRITICAL,
            intervention_class=InterventionClass.CLASS_C,
            risk_score=52.0,
            classification_explanation="Classified as CLASS_C (Human Approval Required). Rotary drilling on 9° slope poses vibration hazard and sample container integrity risks.",
            contributing_factors=["Rotary percussive vibration", "Fine airborne silica regolith fines", "Slope incline (9°)"],
            recommended_precautions=["Confirm tool tether latch", "Deploy particulate extraction shroud", "Mission Commander sign-off required"],
            requires_human_approval=True,
            is_approved=True,
            approved_by="Commander Sarah Chen",
            approved_at=datetime.utcnow() - timedelta(minutes=20),
            equipment_required=["Corer Drill Assembly", "Hermetic Sample Tube #14", "PIXL Target Calibration Tool"]
        )
        exp2 = Experiment(
            id=uuid.uuid4(),
            mission_id=mission_id,
            name="Atmospheric Methane & Carbon Isotope Spectrometry",
            description="Deploy passive non-destructive optical spectrometer to measure localized trace gas emissions from delta fractures.",
            experiment_class=ExperimentClass.ATMOSPHERIC_ANALYSIS,
            lat=18.3950,
            lon=77.5620,
            elevation_m=-2520.0,
            planned_start_time=datetime.utcnow() + timedelta(minutes=30),
            planned_duration_minutes=25,
            status=ExperimentStatus.IN_PROGRESS,
            priority=ExperimentPriority.HIGH,
            intervention_class=InterventionClass.CLASS_A,
            risk_score=14.0,
            classification_explanation="Classified as CLASS_A (Autonomous Execution). Passive sensor reading on level terrain (< 2° slope). No astronaut handling required.",
            contributing_factors=["Low-power sensor telemetry", "Flat plain deployment corridor"],
            recommended_precautions=["Verify solar panel illumination angle"],
            requires_human_approval=False,
            is_approved=True,
            equipment_required=["Mini-TLS Spectrometer Head", "Tripod Deployment Arm"]
        )
        session.add_all([exp1, exp2])

        # 6. Historical Incidents
        for inc in HistoricalExperienceEngine.NASA_INCIDENT_ARCHIVE:
            hist_item = HistoricalIncident(
                id=uuid.uuid4(),
                incident_code=inc["incident_code"],
                mission=inc["mission"],
                date_occurred=inc["date_occurred"],
                subsystem=inc["subsystem"],
                category=inc["category"],
                title=inc["title"],
                description=inc["description"],
                root_cause=inc["root_cause"],
                consequences=inc["consequences"],
                corrective_action=inc["corrective_action"],
                preventive_lesson=inc["preventive_lesson"],
                source_document=inc["source_document"],
                source_citation=inc["source_citation"],
                source_url=inc["source_url"],
                lesson_type=inc["lesson_type"],
                transferability_limitations=inc["transferability_limitations"],
                applicable_conditions=inc["keywords"]
            )
            session.add(hist_item)

        # 7. NASA Data Catalog Metadata
        for layer in NASALayerCatalog.get_all_layers():
            dmeta = DatasetMetadata(
                id=uuid.uuid4(),
                name=layer["name"],
                category=layer["category"],
                source_agency=layer["agency"],
                instrument=layer["instrument"],
                mission=layer["spacecraft"],
                acquisition_date=layer["acquisition_date"],
                spatial_coverage=layer["spatial_coverage"],
                resolution=layer["resolution"],
                units=layer["units"],
                processing_method=layer["processing_method"],
                data_limitations=layer["data_limitations"],
                provenance_type=layer["provenance"],
                is_available=layer["is_available"],
                layer_config=layer
            )
            session.add(dmeta)

        # 8. Initial Observations
        obs1 = Observation(
            id=uuid.uuid4(),
            mission_id=mission_id,
            observer_id=astronaut.id,
            category=ObservationCategory.TEMPERATURE,
            observation_type=ObservationType.POINT,
            data_source=DataSource.OBSERVED,
            value_numeric=-42.5,
            unit="°C",
            confidence=0.98,
            lat=18.3840,
            lon=77.5750,
            elevation_m=-2532.0,
            timestamp=datetime.utcnow() - timedelta(minutes=30),
            notes="Surface regolith thermometer reading at Rover Mast baseline."
        )
        obs2 = Observation(
            id=uuid.uuid4(),
            mission_id=mission_id,
            observer_id=astronaut.id,
            category=ObservationCategory.RADIATION,
            observation_type=ObservationType.POINT,
            data_source=DataSource.OBSERVED,
            value_numeric=26.5,
            unit="uSv/hr",
            confidence=0.96,
            lat=18.3840,
            lon=77.5750,
            elevation_m=-2532.0,
            timestamp=datetime.utcnow() - timedelta(minutes=25),
            notes="Curiosity-analog RAD dosimeter continuous surface flux."
        )
        session.add_all([obs1, obs2])

        # 9. Mission Events
        evt1 = MissionEvent(
            id=uuid.uuid4(),
            mission_id=mission_id,
            event_type="MISSION_INITIATION",
            severity="INFO",
            title="Mission EVA-07 Initialized",
            description="EVA-07 Jezero Crater sortie configured with Aegis SafePath selected as primary traverse corridor.",
            lat=18.3800,
            lon=77.5800,
            timestamp=datetime.utcnow() - timedelta(hours=1)
        )
        session.add(evt1)

        session.commit()
        print("Database seeded successfully with all Jezero Crater demo mission assets!")
    except Exception as e:
        session.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()

