import { useState } from 'react';

export function LoginStudent({ onSuccess }) {
  const [username, setUsername] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) { alert('Введите логин ученика'); return; }
    onSuccess(username.trim());
  };
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem', border: '1px solid #eee', borderRadius: '8px', background: '#fafafa' }}>
      <h2>Вход ученика</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Логин ученика"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px' }}>Войти</button>
      </form>
      <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>Нет аккаунта? <a href="#" onClick={() => alert('Перейдите на главную и нажмите "Регистрация ученика"')} style={{ color: '#2ecc71' }}>Зарегистрироваться</a></p>
    </div>
  );
}
