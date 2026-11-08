import { useState } from 'react';
import { sharedState } from './sharedState';

export function RegisterTeacher({ onSuccess }) {
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !login.trim()) { alert('Заполните все поля'); return; }

    sharedState.teachersData.push({ name, login });
    alert('Учитель успешно зарегистрирован! Теперь можно войти.');
    onSuccess();
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem', border: '1px solid #eee', borderRadius: '8px', background: '#fafafa' }}>
      <h2>Регистрация учителя</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="ФИО учителя" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
        <input type="text" placeholder="Логин для входа" value={login} onChange={e => setLogin(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }} />
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#95a5a6', color: '#fff', border: 'none', borderRadius: '4px' }}>Зарегистрироваться</button>
      </form>
    </div>
  );
}
