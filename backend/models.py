from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base  # <-- оставь только эту строку, удали from .base import Base

class CabinetType(Base):
    __tablename__ = "cabinet_types"

    id = Column(Integer, primary_key=True)
    code = Column(String(50), unique=True, nullable=False)  # student, teacher, admin, olympiad
    title = Column(String(100), nullable=False)
    description = Column(String(255))

    # Обратная связь: все доступы к этому типу кабинета
    accesses = relationship("UserCabinetAccess", back_populates="cabinet_type")


class UserCabinetAccess(Base):
    __tablename__ = "user_cabinet_access"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    cabinet_type_id = Column(Integer, ForeignKey("cabinet_types.id"), primary_key=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="cabinets_access")
    cabinet_type = relationship("CabinetType", back_populates="accesses")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="student")  # student, teacher, admin
    class_grade = Column(String, nullable=True)  # например, "5А"

    participations = relationship("Participation", back_populates="user")
    cabinets_access = relationship("UserCabinetAccess", back_populates="user")


class Olympiad(Base):
    __tablename__ = "olympiads"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)      # "Олимпиада по математике"
    subject = Column(String, nullable=False)    # "math"
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)

    participations = relationship("Participation", back_populates="olympiad")


class Participation(Base):
    __tablename__ = "participations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    olympiad_id = Column(Integer, ForeignKey("olympiads.id"), nullable=False)
    score = Column(Float, default=0.0)
    status = Column(String, default="registered")  # registered, completed, disqualified

    user = relationship("User", back_populates="participations")
    olympiad = relationship("Olympiad", back_populates="participations")
