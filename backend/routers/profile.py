from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User

router = APIRouter(prefix="/profile", tags=["profile"])

class ProfileUpdate(BaseModel):
    class_grade: str | None = None

@router.post("/save")
async def save_profile(data: ProfileUpdate, db: Session = Depends(get_db)):
    # Для теста берём первого студента
    user = db.query(User).filter(User.role == "student").first()
    if not user:
        return {"status": "error", "message": "No student found"}
    
    if data.class_grade:
        user.class_grade = data.class_grade
        db.commit()
        db.refresh(user)
    
    # Возвращаем команду для фронтенда: куда перейти после сохранения
    return {
        "status": "success",
        "message": "Profile saved",
        "redirect_to": "/cabinet/student"  # Это фронтендовый путь, не обрабатывается бэкендом
    }
