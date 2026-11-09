from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db

router = APIRouter(prefix="/cabinets", tags=["cabinets"])

@router.get("/list")
async def list_cabinets(db: Session = Depends(get_db)):
    # Заглушка: в реальном проекте тут будут кабинеты из БД
    return [
        {"id": 1, "name": "Кабинет математики", "type": "math"},
        {"id": 2, "name": "Кабинет физики", "type": "physics"},
        {"id": 3, "name": "Кабинет информатики", "type": "informatics"}
    ]
