import { useState } from 'react';

export function LoginTeacher({ onSuccess }) {
  const [login, setLogin] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!login.trim()) { alert('Введите логин'); return; }
    onSuccess();
  };
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem', border: '1px solid #eee', borderRadius: '8px', background: '#fafafa' }}>
      <h2>Вход учителя</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={e => setLogin(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px' }}>Войти</button>
      </form>
      <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>Нет аккаунта? <a href="#" onClick={() => alert('Перейдите на главную и нажмите "Регистрация учителя"')} style={{ color: '#3498db' }}>Зарегистрироваться</a></p>
    </div>
  );
}
