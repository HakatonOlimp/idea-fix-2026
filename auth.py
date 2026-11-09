from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import User
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or user.password_hash != data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "status": "success",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "class_grade": user.class_grade
        },
        "token": "fake-jwt-token-for-demo"  # ⚠️ В продакшене тут будет реальный JWT
    }
