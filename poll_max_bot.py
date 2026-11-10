import os
import sys
import inspect
import json
import time
import random
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

db_dir = None
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in (".venv", "node_modules", "__pycache__", ".git")]
    if "database.py" in files:
        db_dir = os.path.abspath(root)
        break

if db_dir is None:
    print("Файл database.py не найден в проекте.")
    sys.exit(1)

os.chdir(db_dir)
sys.path.insert(0, db_dir)
print("Папка бэкенда:", db_dir)

import database as db_mod
from models import User, Olympiad, Participation
from sqlalchemy import create_engine, text as sql_text, Column, String, inspect as sql_inspect, func
from sqlalchemy.orm import sessionmaker

try:
    new_url = db_mod.engine.url.set(host="127.0.0.1")
    db_mod.engine = create_engine(new_url)
    if hasattr(db_mod, "SessionLocal"):
        db_mod.SessionLocal = sessionmaker(bind=db_mod.engine, autoflush=False, autocommit=False)
    print("Хост базы перенаправлен: db -> 127.0.0.1")
except Exception as e:
    print("Не удалось переписать URL базы:", str(e)[:200])

NEW_COLS = ["first_name", "last_name", "region", "district", "city", "school", "stars"]
try:
    table = User.__table__
    insp = sql_inspect(db_mod.engine)
    if insp.has_table(table.name):
        cols_db = {c["name"] for c in insp.get_columns(table.name)}
        with db_mod.engine.begin() as conn:
            for col in NEW_COLS:
                if col not in cols_db:
                    conn.execute(sql_text(f'ALTER TABLE {table.name} ADD COLUMN {col} VARCHAR'))
                    print("Добавлена колонка:", col)
        for col in NEW_COLS:
            if col not in table.columns:
                c = Column(col, String)
                table.append_column(c)
                setattr(User, col, c)
        print("Колонки профиля готовы")
except Exception as e:
    print("Не удалось добавить колонки:", str(e)[:300])

def new_session():
    if hasattr(db_mod, "get_db") and inspect.isgeneratorfunction(db_mod.get_db):
        return next(db_mod.get_db())
    if hasattr(db_mod, "SessionLocal"):
        return db_mod.SessionLocal()
    raise RuntimeError("В database.py нет ни get_db-генератора, ни SessionLocal")

try:
    s = new_session()
    s.execute(sql_text("SELECT 1"))
    s.close()
    print("База данных: подключение ОК")
except Exception as e:
    print("База данных: НЕ подключается:", str(e)[:300])

TOKEN = "f9LHodD0cOLihypkUdrA8w-hF5HMSVsUgymMyKrZKNaobM7p-fuhRN75npDtnFYM6rHvKIsAKrfEPnZblmjW"
API = "https://platform-api2.max.ru"
HEADERS = {"Authorization": TOKEN}

SESSION_FILE = os.path.join(db_dir, "bot_sessions.json")

def load_sessions():
    try:
        with open(SESSION_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_sessions(data):
    with open(SESSION_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

sessions = load_sessions()
states = {}
pending = {}

REGIONS = ["Приморский край", "Хабаровский край", "Амурская область", "Московская область", "Санкт-Петербург"]
DISTRICTS = ["Ханкайский район", "Хорольский район", "Черниговский район", "Спасский район",
             "Уссурийский городской округ", "Надеждинский район", "Октябрьский район",
             "Пограничный район", "Яковлевский район", "Кировский район"]
SCHOOL_EXAMPLES = ["МБОУ СОШ с. Кремово", "МБОУ СОШ с. Хороль", "МБОУ СОШ №1 с. Астраханка", "МБОУ Гимназия №1 г. Уссурийска"]
LINKS = "Ссылки на олимпиады и платформы:\nУчи.ру: https://uchi.ru\nЯКласс: https://www.yaklass.ru\nСириус: https://siriusolymp.ru"


def btn(label, payload):
    return {"type": "callback", "text": label, "payload": payload}


def rows_of_buttons(items, prefix, extra_last=None):
    rows = []
    for i in range(0, len(items), 2):
        row = [btn(items[i], prefix + items[i])]
        if i + 1 < len(items):
            row.append(btn(items[i + 1], prefix + items[i + 1]))
        rows.append(row)
    if extra_last:
        rows.append([extra_last])
    return rows


def menu(sess):
    if sess and sess.get("role") == "teacher":
        return [
            [btn("Личный кабинет", "cabinet")],
            [btn("Все ученики", "t_students"), btn("Задать звёзды", "t_stars")],
            [btn("Рейтинг класса", "t_rating"), btn("Рейтинг школы", "t_school")],
            [btn("Загрузить результаты", "t_load")],
            [btn("Олимпиады", "olympiads"), btn("Выйти", "logout")],
        ]
    if sess and sess.get("role") == "student":
        return [
            [btn("Личный кабинет", "cabinet")],
            [btn("Рейтинг класса", "rating"), btn("Рейтинг школы", "school")],
            [btn("Олимпиады и ссылки", "links"), btn("Выйти", "logout")],
        ]
    return [
        [btn("Пройти регистрацию", "register"), btn("Войти", "login")],
        [btn("Список зарегистрированных почт", "emails")],
        [btn("Олимпиады", "olympiads")],
    ]


def send(chat_id, body_text, buttons=None):
    body = {"text": body_text}
    if buttons:
        body["attachments"] = [{"type": "inline_keyboard", "payload": {"buttons": buttons}}]
    for attempt in range(3):
        try:
            r = requests.post(f"{API}/messages", params={"chat_id": chat_id}, headers=HEADERS,
                              json=body, verify=False, timeout=30)
            if r.status_code == 200:
                return 200
        except Exception:
            time.sleep(3)
    print("Не удалось отправить сообщение", chat_id)
    return None


def answer_callback(callback_id, body_text):
    try:
        r = requests.post(f"{API}/answers", params={"callback_id": callback_id},
                          headers=HEADERS, json={"message": {"text": body_text}}, verify=False, timeout=30)
        return r.status_code
    except Exception:
        return None


def normalize_email(e):
    return (e or "").strip().lower()


def find_user_by_email(email):
    em = normalize_email(email)
    db = new_session()
    try:
        return db.query(User).filter(func.lower(User.email) == em).first()
    finally:
        db.close()


def list_emails_text():
    db = new_session()
    try:
        users = db.query(User).order_by(User.id).all()
    finally:
        db.close()
    if not users:
        return "Зарегистрированных почт пока нет."
    lines = []
    for u in users[:15]:
        role_name = "учитель" if u.role == "teacher" else "ученик"
        fio = f"{u.last_name or ''} {u.first_name or ''}".strip()
        who = f"{fio} ({role_name})" if fio else role_name
        lines.append(f"• {u.email} — {who}")
    more = f"\n…и ещё {len(users) - 15}" if len(users) > 15 else ""
    return "Зарегистрированные почты:\n" + "\n".join(lines) + more


def registered_emails():
    db = new_session()
    try:
        return [u.email for u in db.query(User).order_by(User.id).all()]
    finally:
        db.close()


def register_user(email, password, role, first_name, last_name):
    db = new_session()
    try:
        user = User(email=normalize_email(email), password_hash=password, role=role,
                    first_name=first_name, last_name=last_name)
        db.add(user)
        db.commit()
        db.refresh(user)
        print("Зарегистрирован:", user.email, "роль:", user.role)
        return user
    finally:
        db.close()


def update_user(email, **fields):
    db = new_session()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return
        for k, v in fields.items():
            setattr(user, k, v)
        db.commit()
    finally:
        db.close()


def get_schools():
    db = new_session()
    try:
        rows = db.query(User.school).filter(User.school != None, User.school != "").distinct().all()
        return sorted({r[0] for r in rows})
    finally:
        db.close()


def profile_complete(user):
    return bool(user.region and user.district and user.city and user.school)


def total_score(db, user_id):
    return sum(p.score or 0 for p in db.query(Participation).filter(
        Participation.user_id == user_id, Participation.status == "completed").all())


def stars_display(user, t):
    if getattr(user, "stars", None):
        return user.stars
    return round(t / 10.0, 1)


def cabinet_text(email):
    db = new_session()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return "Профиль не найден."
        fio = f"{user.last_name or ''} {user.first_name or ''}".strip() or "не указано"
        prof = (f"ФИО: {fio}\nРегион: {user.region or 'не заполнен'}\nРайон: {user.district or 'не заполнен'}\n"
                f"Населённый пункт: {user.city or 'не заполнен'}\nШкола: {user.school or 'не выбрана'}")
        if not profile_complete(user):
            prof += "\n\nПрофиль заполнен не полностью — нажми «Личный кабинет», продолжим заполнение."
        if user.role == "teacher":
            students_cnt = db.query(User).filter(User.role == "student").count()
            return f"Личный кабинет учителя\n\n{prof}\nУчеников в системе: {students_cnt}"
        t = total_score(db, user.id)
        rank_class, rank_school = None, None
        if user.class_grade:
            mates = db.query(User).filter(User.class_grade == user.class_grade, User.role == "student").all()
            sc = sorted(((total_score(db, c.id), c.id) for c in mates), reverse=True)
            for i, (sc_val, cid) in enumerate(sc, 1):
                if cid == user.id:
                    rank_class = i
                    break
        if user.school:
            mates = db.query(User).filter(User.school == user.school, User.role == "student").all()
            sc = sorted(((total_score(db, c.id), c.id) for c in mates), reverse=True)
            for i, (sc_val, cid) in enumerate(sc, 1):
                if cid == user.id:
                    rank_school = i
                    break
        return (f"Личный кабинет\n\n{prof}\nКласс: {user.class_grade or 'не указан'}\n"
                f"Звёзды: {stars_display(user, t)} \u2b50\nОбщий счёт: {t}\n"
                f"Рейтинг в классе: {rank_class if rank_class else '—'}\n"
                f"Рейтинг в школе: {rank_school if rank_school else '—'}\n\n{LINKS}")
    finally:
        db.close()


def olympiads_text():
    db = new_session()
    try:
        olymps = db.query(Olympiad).all()
    finally:
        db.close()
    if not olymps:
        return "Олимпиад пока нет."
    return "Олимпиады:\n" + "\n".join(f"• {o.title}" for o in olymps) + "\n\n" + LINKS


def rating_by(kind, value):
    if not value:
        return "Не указано значение."
    db = new_session()
    try:
        q = db.query(User).filter(User.role == "student")
        if kind == "class":
            q = q.filter(User.class_grade == value)
        else:
            q = q.filter(User.school == value)
        rows = [(total_score(db, s.id), s.email) for s in q.all()]
    finally:
        db.close()
    rows.sort(key=lambda x: x[0], reverse=True)
    if not rows:
        return f"Учеников не найдено."
    lines = [f"{i}. {mail} — {t} баллов" for i, (t, mail) in enumerate(rows[:10], 1)]
    return f"Топ ({kind}: {value}):\n" + "\n".join(lines)


def teacher_students_text():
    db = new_session()
    try:
        students = db.query(User).filter(User.role == "student").all()
        rows = []
        for s in students:
            t = total_score(db, s.id)
            fio = f"{s.last_name or ''} {s.first_name or ''}".strip() or s.email
            rows.append((t, fio, s.email, s.class_grade or "—", s.school or "—"))
    finally:
        db.close()
    rows.sort(key=lambda x: x[0], reverse=True)
    if not rows:
        return "Учеников пока нет."
    lines = [f"{i}. {fio} ({cls}, {sch}) — {t} б. | {mail}" for i, (t, fio, mail, cls, sch) in enumerate(rows[:12], 1)]
    more = f"\n…и ещё {len(rows) - 12}" if len(rows) > 12 else ""
    return "Все ученики:\n" + "\n".join(lines) + more


def teacher_load_results():
    db = new_session()
    try:
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
            existing = db.query(Participation).filter(
                Participation.user_id == student.id, Participation.olympiad_id == olymp_id).first()
            if not existing:
                score = random.randint(40, 100)
                db.add(Participation(user_id=student.id, olympiad_id=olymp_id, score=score,
                                     status="completed" if score >= 50 else "pending"))
                count_created += 1
        db.commit()
        return f"Результаты загружены для {count_created} учеников."
    finally:
        db.close()


def start_profile_fill(uid, chat_id, intro):
    states[uid] = "prof_region"
    regions = REGIONS[:4]
    rows = rows_of_buttons(regions, "region:", btn("Другой регион — напишу сам(а)", "region:_free"))
    send(chat_id, intro + "\n\nВыбери регион кнопкой или напиши свой:", rows)


def region_button(uid, chat_id, value):
    if value == "_free":
        states[uid] = "prof_region_text"
        send(chat_id, "Напиши название региона:")
        return
    finish_region(uid, chat_id, value)


def district_button(uid, chat_id, value):
    if value == "_free":
        states[uid] = "prof_district_text"
        send(chat_id, "Напиши название района:")
        return
    finish_district(uid, chat_id, value)


def school_button(uid, chat_id, value):
    if value == "_free":
        states[uid] = "prof_school_text"
        send(chat_id, "Напиши название школы:")
        return
    finish_school(uid, chat_id, value)


def finish_region(uid, chat_id, region):
    pending.setdefault(uid, {}).setdefault("profile", {})["region"] = region
    states[uid] = "prof_district"
    rows = rows_of_buttons(DISTRICTS, "district:", btn("Другой район — напишу сам(а)", "district:_free"))
    send(chat_id, f"Регион: {region}. Теперь выбери район или напиши свой:", rows)


def finish_district(uid, chat_id, district):
    pending[uid]["profile"]["district"] = district
    states[uid] = "prof_city"
    send(chat_id, f"Район: {district}. Напиши населённый пункт (например: село Кремово):")


def finish_school(uid, chat_id, school):
    prof = pending[uid]["profile"]
    prof["school"] = school
    if sessions.get(uid, {}).get("role") == "student":
        states[uid] = "prof_class"
        send(chat_id, f"Школа: {school}. Укажи свой класс (например: 9А):")
    else:
        finish_profile(uid, chat_id)


def finish_profile(uid, chat_id):
    prof = pending.get(uid, {}).get("profile", {})
    email = sessions[uid]["email"]
    update_user(email, **prof)
    db = new_session()
    try:
        user = db.query(User).filter(User.email == email).first()
        sessions[uid] = {"email": user.email, "role": user.role, "class_grade": user.class_grade,
                         "first_name": user.first_name, "last_name": user.last_name,
                         "region": user.region, "district": user.district,
                         "city": user.city, "school": user.school}
    finally:
        db.close()
    save_sessions(sessions)
    states.pop(uid, None)
    pending.pop(uid, None)
    send(chat_id, "Профиль сохранён! Вот твой личный кабинет:\n\n" + cabinet_text(email), menu(sessions[uid]))


def handle_text_step(uid, chat_id, value):
    step = states.get(uid)
    data_in = pending.get(uid, {})

    if step == "prof_region_text":
        finish_region(uid, chat_id, value)
        return
    if step == "prof_district_text":
        finish_district(uid, chat_id, value)
        return
    if step == "prof_city":
        prof = pending[uid]["profile"]
        prof["city"] = value
        schools = list(dict.fromkeys(get_schools() + SCHOOL_EXAMPLES))[:8]
        states[uid] = "prof_school"
        rows = rows_of_buttons(schools, "school:", btn("Другая школа — напишу сам(а)", "school:_free"))
        send(chat_id, f"Населённый пункт: {value}. Выбери школу или напиши свою:", rows)
        return
    if step == "prof_school_text":
        finish_school(uid, chat_id, value)
        return
    if step == "prof_class":
        prof = pending[uid]["profile"]
        prof["class_grade"] = value
        finish_profile(uid, chat_id)
        return
    if step == "ask_class":
        states.pop(uid, None)
        send(chat_id, rating_by("class", value), menu(sessions.get(uid)))
        return
    if step == "ask_school":
        states.pop(uid, None)
        send(chat_id, rating_by("school", value), menu(sessions.get(uid)))
        return
    if step == "stars_student":
        user = find_user_by_email(value)
        if not user or user.role != "student":
            send(chat_id, "Ученик с таким email не найден. Напиши email из списка.")
            return
        pending[uid]["stars_email"] = user.email
        states[uid] = "stars_value"
        send(chat_id, f"Ученик: {user.email}. Сколько звёзд поставить (число от 0 до 100)?")
        return
    if step == "stars_value":
        try:
            st = float(value.replace(",", "."))
        except Exception:
            send(chat_id, "Напиши число, например: 4.5")
            return
        st = max(0.0, min(100.0, st))
        update_user(pending[uid]["stars_email"], stars=str(st))
        email_st = pending[uid]["stars_email"]
        states.pop(uid, None)
        pending.pop(uid, None)
        db = new_session()
        try:
            u = db.query(User).filter(User.email == email_st).first()
            t = total_score(db, u.id)
        finally:
            db.close()
        send(chat_id, f"Готово! Ученику {email_st} установлено {st} звёзд (счёт: {t}).", menu(sessions.get(uid)))
        return

    if step == "email":
        role = data_in.get("role", "student")
        user = find_user_by_email(value)
        if user and user.role != role:
            who = "учитель" if user.role == "teacher" else "ученик"
            need = "учителя" if role == "teacher" else "ученика"
            send(chat_id, f"Эта почта зарегистрирована как {who}. Войди как {need}.", menu(None))
            states.pop(uid, None)
            return
        if not user:
            send(chat_id, "Такой почты нет среди зарегистрированных.\n\n" + list_emails_text() +
                 "\n\nЕсли это новый пользователь — нажми «Пройти регистрацию».", menu(None))
            states.pop(uid, None)
            return
        pending[uid] = {"email": user.email, "role": role}
        states[uid] = "password"
        send(chat_id, f"Почта найдена: {user.email}. Теперь напиши пароль.")
        return

    if step == "password":
        user = find_user_by_email(data_in.get("email", ""))
        if not user or user.password_hash != value:
            send(chat_id, "Неверный пароль. Напиши «отмена», чтобы вернуться в меню, или повтори пароль.")
            return
        sessions[uid] = {"email": user.email, "role": user.role, "class_grade": user.class_grade,
                         "first_name": user.first_name, "last_name": user.last_name,
                         "region": user.region, "district": user.district,
                         "city": user.city, "school": user.school}
        save_sessions(sessions)
        states.pop(uid, None)
        pending.pop(uid, None)
        if not profile_complete(user):
            start_profile_fill(uid, chat_id, f"С возвращением, {user.first_name or user.email}! Сначала заполним профиль.")
            return
        send(chat_id, f"С возвращением, {user.first_name or user.email}!\n\n" + cabinet_text(user.email), menu(sessions[uid]))
        return

    if step == "reg_email":
        em = normalize_email(value)
        if "@" not in em or "." not in em:
            send(chat_id, "Это не похоже на почту. Попробуй ещё раз (например: ivan@school.ru).")
            return
        if find_user_by_email(em):
            send(chat_id, "Эта почта уже зарегистрирована. Нажми «Войти».", menu(None))
            states.pop(uid, None)
            return
        pending[uid]["email"] = em
        states[uid] = "reg_name"
        send(chat_id, "Шаг 2 из 5: напиши имя.")
        return

    if step == "reg_name":
        pending[uid]["first_name"] = value
        states[uid] = "reg_surname"
        send(chat_id, f"Имя: {value}. Шаг 3 из 5: напиши фамилию.")
        return

    if step == "reg_surname":
        pending[uid]["last_name"] = value
        states[uid] = "reg_password"
        send(chat_id, f"Фамилия: {value}. Шаг 4 из 5: придумай пароль.")
        return

    if step == "reg_password":
        if len(value) < 4:
            send(chat_id, "Пароль коротковат — минимум 4 символа.")
            return
        pending[uid]["password"] = value
        states[uid] = "reg_password2"
        send(chat_id, "Шаг 5 из 5: напиши пароль ещё раз.")
        return

    if step == "reg_password2":
        if value != pending[uid].get("password"):
            send(chat_id, "Пароли не совпадают. Напиши пароль заново.")
            states[uid] = "reg_password"
            return
        who = "учитель" if data_in.get("role") == "teacher" else "ученик"
        states[uid] = "reg_confirm"
        send(chat_id,
             f"Проверь данные:\nПочта: {data_in['email']}\nИмя: {data_in['first_name']}\n"
             f"Фамилия: {data_in['last_name']}\nРоль: {who}",
             [[btn("Зарегистрироваться", "reg_confirm"), btn("Отмена", "reg_cancel")]])
        return

    states.pop(uid, None)


def reg_confirm(uid, chat_id):
    data_reg = pending.get(uid, {})
    if not data_reg.get("email"):
        states.pop(uid, None)
        return
    user = register_user(data_reg["email"], data_reg["password"], data_reg["role"],
                         data_reg.get("first_name", ""), data_reg.get("last_name", ""))
    sessions[uid] = {"email": user.email, "role": user.role, "class_grade": user.class_grade,
                     "first_name": user.first_name, "last_name": user.last_name}
    save_sessions(sessions)
    states[uid] = None
    start_profile_fill(uid, chat_id, f"Готово! Почта {user.email} добавлена в список зарегистрированных.\nТеперь заполни профиль.")


def handle_action(uid, chat_id, action):
    sess = sessions.get(uid)

    if action == "register":
        if sess:
            send(chat_id, f"Ты уже вошёл(ла) как {sess['email']}. Сначала нажми «Выйти».", menu(sess))
            return
        send(chat_id, "Выбери роль:", [[btn("Учитель", "reg_teacher"), btn("Ученик", "reg_student")]])
        return

    if action in ("reg_student", "reg_teacher"):
        if sess:
            send(chat_id, "Сначала нажми «Выйти».", menu(sess))
            return
        role = "teacher" if action == "reg_teacher" else "student"
        states[uid] = "reg_email"
        pending[uid] = {"role": role}
        send(chat_id, f"Регистрация {'учителя' if role == 'teacher' else 'ученика'}.\nШаг 1 из 5: напиши почту (например: ivan@school.ru).")
        return

    if action == "reg_confirm":
        reg_confirm(uid, chat_id)
        return

    if action == "reg_cancel":
        states.pop(uid, None)
        pending.pop(uid, None)
        send(chat_id, "Регистрация отменена.", menu(None))
        return

    if action == "login":
        if sess:
            send(chat_id, f"Ты уже вошёл(ла) как {sess['email']}. Сначала нажми «Выйти».", menu(sess))
            return
        send(chat_id, "Выбери роль:", [[btn("Ученик", "login_student"), btn("Учитель", "login_teacher")]])
        return

    if action in ("login_student", "login_teacher"):
        role = "teacher" if action == "login_teacher" else "student"
        states[uid] = "email"
        pending[uid] = {"role": role}
        send(chat_id, f"Вход как {'учитель' if role == 'teacher' else 'ученик'}. Напиши свою почту из списка.\n\n" + list_emails_text())
        return

    if action == "emails":
        send(chat_id, list_emails_text(), menu(sess))
        return

    if action == "logout":
        sessions.pop(uid, None)
        save_sessions(sessions)
        send(chat_id, "Выход выполнен.", menu(None))
        return

    if action == "cabinet":
        if not sess:
            send(chat_id, "Сначала войди или пройди регистрацию.", menu(None))
            return
        if not (sess.get("region") and sess.get("school")):
            start_profile_fill(uid, chat_id, "Профиль нужно заполнить.")
            return
        send(chat_id, cabinet_text(sess["email"]), menu(sess))
        return

    if action == "t_students":
        if not sess or sess.get("role") != "teacher":
            send(chat_id, "Раздел только для учителей.", menu(sess))
            return
        send(chat_id, teacher_students_text(), menu(sess))
        return

    if action == "t_stars":
        if not sess or sess.get("role") != "teacher":
            send(chat_id, "Раздел только для учителей.", menu(sess))
            return
        db = new_session()
        try:
            students = db.query(User).filter(User.role == "student").order_by(User.id).all()
            emails = [s.email for s in students[:10]]
        finally:
            db.close()
        if not emails:
            send(chat_id, "Учеников пока нет.", menu(sess))
            return
        rows = []
        for i in range(0, len(emails), 2):
            row = [btn(emails[i], "stuselect:" + emails[i])]
            if i + 1 < len(emails):
                row.append(btn(emails[i + 1], "stuselect:" + emails[i + 1]))
            rows.append(row)
        send(chat_id, "Выбери ученика, которому поставишь звёзды:", rows)
        return

    if action.startswith("stuselect:"):
        if not sess or sess.get("role") != "teacher":
            return
        pending[uid] = {"stars_email": action[10:]}
        states[uid] = "stars_value"
        send(chat_id, f"Ученик: {action[10:]}. Сколько звёзд поставить (число от 0 до 100)?")
        return

    if action == "t_rating":
        if not sess or sess.get("role") != "teacher":
            send(chat_id, "Раздел только для учителей.", menu(sess))
            return
        states[uid] = "ask_class"
        send(chat_id, "Напиши класс, например: 9А")
        return

    if action == "t_school":
        if not sess or sess.get("role") != "teacher":
            send(chat_id, "Раздел только для учителей.", menu(sess))
            return
        schools = get_schools()
        if not schools:
            send(chat_id, "Школ пока нет в системе.", menu(sess))
            return
        rows = rows_of_buttons(schools[:8], "schoolrate:")
        send(chat_id, "Выбери школу:", rows)
        return

    if action.startswith("schoolrate:"):
        if not sess:
            return
        send(chat_id, rating_by("school", action[11:]), menu(sess))
        return

    if action == "school":
        if not sess:
            send(chat_id, "Сначала войди.", menu(None))
            return
        send(chat_id, rating_by("school", sess.get("school")), menu(sess))
        return

    if action == "rating":
        if not sess or sess.get("role") != "student":
            send(chat_id, "Рейтинг доступен ученикам после входа.", menu(sess))
            return
        send(chat_id, rating_by("class", sess.get("class_grade")), menu(sess))
        return

    if action == "t_load":
        if not sess or sess.get("role") != "teacher":
            send(chat_id, "Раздел только для учителей.", menu(sess))
            return
        send(chat_id, teacher_load_results(), menu(sess))
        return

    if action == "olympiads" or action == "links":
        send(chat_id, olympiads_text(), menu(sess))
        return

    send(chat_id, "Неизвестное действие.", menu(sess))


print("Макс слушает... (Ctrl+C чтобы остановить)")

net_fail = 0
while True:
    try:
        params = {}
        try:
            with open(os.path.join(db_dir, "bot_marker.txt")) as f:
                marker = f.read().strip() or None
        except Exception:
            marker = None
        if marker:
            params["marker"] = marker
        r = requests.get(f"{API}/updates", headers=HEADERS, params=params, timeout=40, verify=False)
        net_fail = 0
        if r.status_code != 200:
            print("Ошибка опроса:", r.status_code, r.text[:300])
            time.sleep(5)
            continue
        data = r.json()
        new_marker = data.get("marker")
        if new_marker:
            with open(os.path.join(db_dir, "bot_marker.txt"), "w") as f:
                f.write(str(new_marker))

        for upd in data.get("updates", []):
            utype = upd.get("update_type")

            if utype == "bot_started":
                chat_id = upd.get("chat_id")
                uid = str(upd.get("user_id", ""))
                if uid in sessions:
                    send(chat_id, "С возвращением! Твой кабинет готов.", menu(sessions[uid]))
                else:
                    send(chat_id, "Добро пожаловать в «Школьный Олимп»!\nПройди регистрацию или войди.", menu(None))
                continue

            if utype == "message_callback":
                cb = upd.get("callback", {})
                cb_id = cb.get("callback_id")
                payload = cb.get("payload")
                chat_id = (cb.get("message") or {}).get("recipient", {}).get("chat_id")
                if chat_id is None:
                    chat_id = (upd.get("message") or {}).get("recipient", {}).get("chat_id")
                uid = str(((cb.get("user") or {}).get("user_id")) or ((upd.get("message") or {}).get("sender", {}).get("user_id", "")))
                print("Нажата кнопка:", payload)
                try:
                    if not isinstance(payload, str):
                        payload = ""
                    if payload.startswith("region:"):
                        region_button(uid, chat_id, payload[7:])
                    elif payload.startswith("district:"):
                        district_button(uid, chat_id, payload[7:])
                    elif payload.startswith("school:") and not payload.startswith("schoolrate:"):
                        school_button(uid, chat_id, payload[7:])
                    elif payload:
                        handle_action(uid, chat_id, payload)
                    if cb_id:
                        answer_callback(cb_id, "Обработано")
                except Exception as e:
                    import traceback
                    print(traceback.format_exc())
                    if chat_id:
                        send(chat_id, "Ошибка: " + str(e)[:300], menu(sessions.get(uid)))
                continue

            if utype != "message_created":
                continue

            msg = upd.get("message", {})
            chat_id = msg.get("recipient", {}).get("chat_id")
            uid = str(msg.get("sender", {}).get("user_id", ""))
            text_value = (msg.get("body", {}) or {}).get("text", "")
            sender = msg.get("sender", {}).get("name", "кто-то")
            print(f"{sender} написал: {text_value}")

            try:
                low = text_value.strip().lower()
                if low in ("отмена", "отменить", "меню"):
                    if uid in states:
                        states.pop(uid, None)
                        pending.pop(uid, None)
                        send(chat_id, "Действие отменено.", menu(sessions.get(uid)))
                    else:
                        send(chat_id, "Выбери действие:", menu(sessions.get(uid)))
                elif uid in states and states[uid]:
                    handle_text_step(uid, chat_id, text_value)
                elif low in ("старт", "начать", "привет", "помощь"):
                    send(chat_id, "Выбери действие кнопкой:", menu(sessions.get(uid)))
                elif low == "почты" or low == "аккаунты":
                    send(chat_id, list_emails_text(), menu(sessions.get(uid)))
                else:
                    send(chat_id, "Выбери действие кнопкой или напиши «меню».", menu(sessions.get(uid)))
            except Exception as e:
                import traceback
                print(traceback.format_exc())
                send(chat_id, "Ошибка: " + str(e)[:300], menu(sessions.get(uid)))
    except Exception as e:
        net_fail += 1
        if net_fail == 1 or net_fail % 20 == 0:
            print(f"Сеть недоступна (сбой #{net_fail}): {str(e)[:120]}")
        time.sleep(10)
