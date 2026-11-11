from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.dashboard_service import DashboardService
from app.infrastructure.database.database import get_db
from app.infrastructure.repositories.dashboard_repository import DashboardRepository


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(DashboardRepository(db))
