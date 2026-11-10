from fastapi.responses import FileResponse

import os
import random
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from database import get_db, Base, engine
from models import User, Olympiad, Participation
from routers import auth, cabinets, profile

class ProfileUpdate(BaseModel):
    class_grade: str | None = None

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "student"
    class_grade: Optional[str] = None

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Idea-Fix 2026")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(cabinets.router, prefix="/api/cabinets")
app.include_router(profile.router, prefix="/api")

@app.get("/geo/districts")
def get_districts():
    return [
        {"name": "Центральный"}, {"name": "Северный"}, {"name": "Южный"},
        {"name": "Западный"}, {"name": "Восточный"}, {"name": "Пригородный"},
        {"name": "Заречный"}, {"name": "Лесной"}, {"name": "Степной"}, {"name": "Горный"}
    ]

@app.post("/auth/register")
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=data.email,
        password_hash=data.password,
        role=data.role,
        class_grade=data.class_grade,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "status": "success",
        "message": "Registration successful",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "class_grade": new_user.class_grade
        }
    }

@app.post("/api/profile/save")
async def save_profile(data: ProfileUpdate, user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.class_grade is not None:
        user.class_grade = data.class_grade
        db.commit()
        db.refresh(user)

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "class_grade": user.class_grade,
        },
    }

@app.get("/profile/student")
async def student_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.role == "student").first()
    if not user:
        raise HTTPException(status_code=403, detail="Not a student or user not found")

    parts = db.query(Participation).filter(Participation.user_id == user.id).all()
    
    my_olympiads = []
    total_score = 0
    
    for p in parts:
        olymp = db.query(Olympiad).filter(Olympiad.id == p.olympiad_id).first()
        if olymp:
            my_olympiads.append({
                "title": olymp.title,
                "status": p.status,
                "score": p.score
            })
            if p.status == "completed":
                total_score += p.score

    calculated_stars = total_score / 10.0
    stars_display = round(calculated_stars, 1)

    rank_in_class = None
    students_in_class_count = 0

    if user.class_grade:
        classmates = db.query(User).filter(
            User.class_grade == user.class_grade, 
            User.role == "student"
        ).all()
        
        students_in_class_count = len(classmates)
        classmate_scores = []
        for c in classmates:
            c_parts = db.query(Participation).filter(
                Participation.user_id == c.id, 
                Participation.status == "completed"
            ).all()
            c_total = sum(p.score for p in c_parts)
            classmate_scores.append({"id": c.id, "score": c_total})
        
        classmate_scores.sort(key=lambda x: x['score'], reverse=True)
        
        for i, item in enumerate(classmate_scores):
            if item['id'] == user.id:
                rank_in_class = i + 1
                break

    return {
        "user": {
            "id": user.id, 
            "email": user.email, 
            "role": user.role, 
            "class_grade": user.class_grade or "Не указан",
            "stars": stars_display
        },
        "my_olympiads": my_olympiads,
        "rankings": {
            "total_score": total_score,
            "rank_in_class": rank_in_class,
            "students_in_class": students_in_class_count
        }
    }

@app.post("/teacher/load-results")
async def teacher_load_results(db: Session = Depends(get_db)):
    students = db.query(User).filter(User.role == "student").all()
    olympiads = db.query(Olympiad).all()

    if not olympiads:
        new_olymp = Olympiad(title="Тестовая олимпиада", subject="all")
        db.add(new_olymp)
        db.commit()
        olympiads = [new_olymp]

    olymp_id = olympiads[0].id
    count_created = 0

    for student in students:
        existing_part = db.query(Participation).filter(
            Participation.user_id == student.id, 
            Participation.olympiad_id == olymp_id
        ).first()

        if not existing_part:
            score = random.randint(40, 100)
            status = "completed" if score >= 50 else "pending"
            
            new_part = Participation(
                user_id=student.id,
                olympiad_id=olymp_id,
                score=score,
                status=status
            )
            db.add(new_part)
            count_created += 1

    db.commit()
    return {"status": "ok", "message": f"Результаты загружены для {count_created} учеников."}

@app.get("/demo/seed")
async def seed_demo_data(db: Session = Depends(get_db)):
    db.query(Participation).delete()
    db.query(Olympiad).delete()
    db.query(User).filter(User.email.like("%school.ru%")).delete()
    db.commit()

    olymps = [
        Olympiad(title="Олимпиада по математике", subject="math"),
        Olympiad(title="Олимпиада по физике", subject="physics"),
        Olympiad(title="Олимпиада по информатике", subject="informatics")
    ]
    db.bulk_save_objects(olymps)
    db.commit()
    olymp_ids = [o.id for o in db.query(Olympiad).all()]

    teacher = User(email="teacher@school.ru", password_hash="12345", role="teacher")
    db.add(teacher)
    db.commit()

    classes = ["9А", "9Б", "10А", "10Б"]
    for i in range(20):
        cls = classes[i % len(classes)]
        user = User(
            email=f"student{i}@school.ru",
            password_hash="12345",
            role="student",
            class_grade=cls,
        )
        db.add(user)
    
    db.commit()
    all_students = db.query(User).filter(User.role == "student").all()
    
    for student in all_students:
        for oid in olymp_ids:
            if random.random() > 0.3:
                score = random.randint(50, 100)
                participation = Participation(
                    user_id=student.id,
                    olympiad_id=oid,
                    score=score,
                    status="completed"
                )
                db.add(participation)
    
    db.commit()
    return {"status": "ok", "message": "Demo data created successfully", "users_count": len(all_students)}

@app.get("/")
async def serve_index():
    static_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "static")
    html_path = os.path.join(static_path, "index.html")
    return FileResponse(html_path)

@app.post("/webhook")
async def handle_webhook(request: Request):
    try:
        body = await request.json()
    except Exception:
        return {"messages": [{"text": "Бот получил запрос, но не смог прочитать тело."}]}

    message_text = body.get("message", {}).get("text", "")
    response_text = f"Бот получил сообщение: {message_text}"

    return {
        "messages": [
            {"text": response_text}
        ]
    }
@app.get("/demo/students")
async def list_demo_students(db: Session = Depends(get_db)):
    students = db.query(User).filter(User.role == "student").all()
    return [
        {
            "id": s.id,
            "email": s.email,
            "class_grade": s.class_grade
        }
        for s in students
    ]
