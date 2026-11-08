import { useState } from 'react';
import { sharedState } from './sharedState';

export function LoginPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (role) => {
    if (!name.trim()) {
      setError('Введите имя');
      return;
    }

    // Создаём или находим профиль
    const user = {
      id: role + '_' + name.replace(/\s+/g, '_').toLowerCase(),
      name: name,
      role: role, // 'teacher' или 'student'
    };

    sharedState.setCurrentUser(user);
    setError('');
    window.location.href = '/cabinet';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h2 style={{ textAlign: 'center' }}>Idea-Fix 2026</h2>
      <p style={{ textAlign: 'center', color: '#666' }}>
        Выберите роль и введите имя, чтобы войти в личный кабинет.
      </p>

      {error && (
        <div style={{ background: '#ffe6e6', color: '#b00020', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h3>Войти как УЧИТЕЛЬ</h3>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Имя учителя (например, Иванова)"
          style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button
          onClick={() => handleLogin('teacher')}
          style={{
            marginTop: '0.5rem',
            width: '100%',
            padding: '0.7rem',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Войти как учитель
        </button>
      </div>

      <div>
        <h3>Войти как УЧЕНИК</h3>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Имя ученика (например, Алексей)"
          style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button
          onClick={() => handleLogin('student')}
          style={{
            marginTop: '0.5rem',
            width: '100%',
            padding: '0.7rem',
            background: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Войти как ученик
        </button>
      </div>
    </div>
  );
}
