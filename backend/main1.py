from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional

# --- Модели данных (схемы) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    password: str

class UserRead(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    class_id: int

# --- Инициализация ---
app = FastAPI(
    title="Личный кабинет учащегося",
    description="API для хакатона Идея фикс 2026",
    version="1.0.0"
)

# --- Настройки безопасности (для примера, в .env будут реальные) ---
SECRET_KEY = "your_super_secret_key_which_must_be_very_long_and_random"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # Токен на 7 дней

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# --- Фейковые данные (вместо БД на старте) ---
# В реальном проекте здесь будет запрос к PostgreSQL
fake_users_db = {
    "student1": {
        "username": "student1",
        "full_name": "Иван Иванов",
        "email": "ivan@example.com",
        "hashed_password": "fakehashedsecret",
        "class_id": 1
    }
}

def fake_hash_password(password: str):
    return "fakehashed" + password

# --- Логика авторизации ---
def authenticate_user(username: str, password: str):
    user = fake_users_db.get(username)
    if not user or not (user["hashed_password"] == fake_hash_password(password)):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = fake_users_db.get(username)
    if user is None:
        raise credentials_exception
    return UserRead(**user)

# --- Эндпоинты (маршруты) ---
@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/profile", response_model=UserRead)
async def read_profile(current_user: UserRead = Depends(get_current_user)):
    return current_user

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "personal-cabinet-backend"}
