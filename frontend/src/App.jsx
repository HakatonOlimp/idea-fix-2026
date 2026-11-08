import { useState, useEffect } from 'react';
import { TeacherCabinet } from './TeacherCabinet';
import { StudentCabinet } from './StudentCabinet';
import { ProfileFormTeacher } from './ProfileFormTeacher';
import { ProfileFormStudent } from './ProfileFormStudent';
import { sharedState } from './sharedState';

export default function App() {
  const [screen, setScreen] = useState('main');
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkData = () => {
      if (sharedState.schoolsData && sharedState.schoolsData.length > 0) {
        setLoading(false);
        return;
      }
      setTimeout(checkData, 200);
    };
    checkData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial' }}>
        <h3>Загрузка справочников...</h3>
        <p>Пожалуйста, подождите 1–2 секунды.</p>
      </div>
    );
  }

  const handleLogin = (username, roleType) => {
    localStorage.setItem('access_token', 'demo-token-123');
    setRole(roleType);
    setCurrentUser(username);

    // Теперь передаём роль, чтобы sharedState знал, где искать
    const profile = sharedState.getProfile(username, roleType);

    if (!profile || !profile.region) {
      setScreen(roleType === 'teacher' ? 'teacher-register' : 'student-register');
    } else {
      setScreen(roleType === 'teacher' ? 'teacher-cabinet' : 'student-cabinet');
    }
  };

  const handleRegisterSave = (profile, roleType) => {
    // Передаём роль, чтобы профиль сохранился в правильном массиве
    sharedState.setProfile(currentUser, profile, roleType);
    setScreen(roleType === 'teacher' ? 'teacher-cabinet' : 'student-cabinet');
  };

  const handleLogout = () => {
    setScreen('main');
    setCurrentUser(null);
    setRole('');
  };

  if (screen === 'main') {
    return (
      <div style={{
        padding: '3rem',
        maxWidth: '600px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '1.5rem' }}>Idea-Fix 2026</h1>
        <p style={{ color: '#666', marginBottom: '2.5rem' }}>Выберите действие:</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <button
            onClick={() => {
              setCurrentUser('teacher_demo');
              handleLogin('teacher_demo', 'teacher');
            }}
            style={{ padding: '16px', fontSize: '1rem', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            🧑‍🏫 Вход учителя
          </button>

          <button
            onClick={() => {
              setCurrentUser('teacher_new');
              setScreen('teacher-register');
            }}
            style={{ padding: '16px', fontSize: '1rem', backgroundColor: '#95a5a6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            📝 Регистрация учителя
          </button>

          <button
            onClick={() => {
              setCurrentUser('student_demo');
              handleLogin('student_demo', 'student');
            }}
            style={{ padding: '16px', fontSize: '1rem', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            🎓 Вход ученика
          </button>

          <button
            onClick={() => {
              setCurrentUser('student_new');
              setScreen('student-register');
            }}
            style={{ padding: '16px', fontSize: '1rem', backgroundColor: '#f39c12', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            📝 Регистрация ученика
          </button>
        </div>

        <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#777' }}>
          Демо-режим: любой логин работает, профиль сохраняется в браузере.
        </p>
      </div>
    );
  }

  if (screen === 'teacher-register') {
    return (
      <ProfileFormTeacher
        onSave={(profile) => handleRegisterSave(profile, 'teacher')}
        currentUser={currentUser}
        onCancel={() => setScreen('main')}
      />
    );
  }

  if (screen === 'student-register') {
    return (
      <ProfileFormStudent
        onSave={(profile) => handleRegisterSave(profile, 'student')}
        currentUser={currentUser}
        onCancel={() => setScreen('main')}
      />
    );
  }

  if (screen === 'teacher-cabinet') {
    return (
      <TeacherCabinet
        onLogout={handleLogout}
        currentUser={currentUser}
      />
    );
  }

  if (screen === 'student-cabinet') {
    return (
      <StudentCabinet
        onLogout={handleLogout}
        currentUser={currentUser}
      />
    );
  }

  return null;
}
