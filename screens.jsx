import { useState } from 'react';
import { s } from './styles';

export function MainScreen({ setScreen, loading, error, getUniqueOptions }) {
  return (
    <div style={s.container}>
      <h1>Idea-Fix 2026</h1>
      {loading && <p>Загрузка data.csv...</p>}
      {error && <p style={{ color: 'red' }}>Ошибка: {error}</p>}
      {!loading && !error && (
        <>
          <div style={{ margin: '30px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
            <h3>Для учителя</h3>
            <button onClick={() => setScreen('teacher-login')} style={s.btn}>🧑‍🏫 Вход учителя (демо)</button>
            <br /><br />
            <button onClick={() => setScreen('register-teacher')} style={{ ...s.btn, background: '#95a5a6' }}>🧑‍🏫 Регистрация учителя</button>
          </div>
          <div style={{ margin: '30px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
            <h3>Для ученика</h3>
            <button onClick={() => setScreen('student-login')} style={s.btn}>🎓 Вход ученика (демо)</button>
            <br /><br />
            <button onClick={() => setScreen('register-student')} style={{ ...s.btn, background: '#2ecc71' }}>🎓 Регистрация ученика</button>
          </div>
        </>
      )}
    </div>
  );
}

export function RegisterTeacherScreen({ setScreen, getUniqueOptions, getDistrictsForRegion, getSchoolsForDistrict }) {
  const [state, setState] = useState({ region: '', district: '', school: '', name: '' });
  const handleChange = (field, value) => setState(p => ({ ...p, [field]: value }));
  const handleSubmit = () => {
    if (!state.region || !state.district || !state.school || !state.name) {
      alert('Заполните все поля');
      return;
    }
    alert('Учитель зарегистрирован (демо). Теперь можно войти в кабинет.');
    setScreen('main');
  };
  return (
    <div style={s.card}>
      <h2>Регистрация учителя</h2>
      <select style={s.select} value={state.region} onChange={e => handleChange('region', e.target.value)}>
        <option value="">Выберите регион</option>
        {getUniqueOptions('region').map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      {state.region && (
        <select style={s.select} value={state.district} onChange={e => handleChange('district', e.target.value)}>
          <option value="">Выберите район</option>
          {getDistrictsForRegion(state.region).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}
      {state.district && (
        <select style={s.select} value={state.school} onChange={e => handleChange('school', e.target.value)}>
          <option value="">Выберите школу</option>
          {getSchoolsForDistrict(state.region, state.district).map(sch => <option key={sch} value={sch}>{sch}</option>)}
        </select>
      )}
      <input type="text" placeholder="Ваше ФИО" value={state.name} onChange={e => handleChange('name', e.target.value)} style={s.input} />
      <button onClick={handleSubmit} style={s.btn}>Зарегистрироваться</button>
      <div onClick={() => setScreen('main')} style={s.backLink}>← Назад</div>
    </div>
  );
}

export function TeacherLoginScreen({ setScreen }) {
  return (
    <div style={s.card}>
      <h2>Вход учителя (демо)</h2>
      <p style={{ color: '#666' }}>Пароль не нужен. Нажмите «Войти».</p>
      <button onClick={() => setScreen('teacher-cabinet')} style={s.btn}>Войти в кабинет</button>
      <div onClick={() => setScreen('main')} style={s.backLink}>← Назад</div>
    </div>
  );
}

export function TeacherCabinetScreen({ teacher, students, setStudents, setScreen }) {
  if (!teacher) return (
    <div style={s.container}><p>Сначала зарегистрируйте учителя.</p><button onClick={() => setScreen('main')} style={s.btn}>На главную</button></div>
  );

  const teacherStudents = students.filter(s =>
    s.school === teacher.school && s.district === teacher.district && s.region === teacher.region
  );

  return (
    <div style={s.container}>
      <h2 style={{ textAlign: 'left' }}>Кабинет учителя: {teacher.name}</h2>
      <h3 style={{ textAlign: 'left' }}>Ваши ученики</h3>
      {teacherStudents.length === 0 ? (
        <p>У вас пока нет учеников.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Имя</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Класс</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Звёзды</th>
            </tr>
          </thead>
          <tbody>
            {teacherStudents.map(s => (
              <tr key={s.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{s.name}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{s.klass}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee', color: '#f39c12', fontWeight: 'bold' }}>{s.stars}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: '20px' }}><button onClick={() => setScreen('main')} style={s.btn}>← На главную</button></div>
    </div>
  );
}
