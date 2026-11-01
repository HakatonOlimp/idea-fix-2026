// frontend/src/App.jsx
import React, { useState } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  // Функция входа в систему
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password })
      });

      if (!response.ok) {
        throw new Error('Неверный логин или пароль');
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token); // Сохраняем токен
      await loadProfile(); // Загружаем профиль после входа
    } catch (err) {
      setError(err.message);
    }
  };

  // Функция загрузки профиля
  const loadProfile = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;

    try {
      const response = await fetch('http://localhost:8000/api/profile', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        localStorage.removeItem('token');
        setToken('');
        setProfile(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Проверка токена при загрузке страницы
  React.useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = () => {
    setToken('');
    setProfile(null);
    localStorage.removeItem('token');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Личный кабинет учащегося</h1>
        {!token && !profile ? (
          <form onSubmit={handleLogin} className="login-form">
            <h2>Вход в систему</h2>
            {error && <div className="error">{error}</div>}
            <input 
              type="text" 
              placeholder="Логин" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
            <input 
              type="password" 
              placeholder="Пароль" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <button type="submit">Войти</button>
          </form>
        ) : (
          <div className="profile-card">
            <h2>Добро пожаловать, {profile?.full_name || 'ученик'}!</h2>
            <p><strong>Класс:</strong> {profile?.class_id}</p>
            <p><strong>Email:</strong> {profile?.email}</p>
            <button onClick={handleLogout} className="logout-btn">Выйти</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
