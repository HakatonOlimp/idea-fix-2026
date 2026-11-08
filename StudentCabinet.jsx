import { useEffect, useState } from 'react';
import { sharedState } from './sharedState';

export function StudentCabinet({ currentUser, onLogout }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingInfo, setRatingInfo] = useState(null); // Тут будет «10-й по школе» и т.д.

  useEffect(() => {
    if (!currentUser) {
      setStudent(null);
      setLoading(false);
      return;
    }

    const allStudents = sharedState.studentsData || [];
    const found = allStudents.find(s => s.username === currentUser);

    if (found) {
      // Считаем рейтинг
      const schoolStudents = allStudents.filter(s => s.school === found.school);
      const classStudents = allStudents.filter(s => s.klass === found.klass && s.school === found.school);

      // Сортируем по звёздам (по убыванию)
      const sortByStars = (a, b) => (b.stars || 0) - (a.stars || 0);
      
      const rankedBySchool = [...schoolStudents].sort(sortByStars);
      const rankedByClass = [...classStudents].sort(sortByStars);

      // Находим позицию (индекс + 1)
      const positionInSchool = rankedBySchool.findIndex(s => s.username === found.username) + 1;
      const positionInClass = rankedByClass.findIndex(s => s.username === found.username) + 1;

      setRatingInfo({
        school: `${positionInSchool}-й по школе`,
        klass: `${positionInClass}-й в классе`,
        totalSchool: rankedBySchool.length,
        totalClass: rankedByClass.length
      });
    }

    setStudent(found || null);
    setLoading(false);
  }, [currentUser]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка кабинета...</div>;
  }

  if (!student) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial', padding: '3rem', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }}>
        <h2>Кабинет ученика</h2>
        <p>Не удалось найти профиль для пользователя <b>{currentUser || 'пустой логин'}</b>.</p>
        <button onClick={onLogout} style={{ padding: '10px 20px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}>Вернуться на вход</button>
      </div>
    );
  }

  const completedOlympiads = student.completedOlympiads || [];
  const availableOlympiads = student.availableOlympiads || [];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      {/* Верхняя панель: кнопки выхода и ссылки */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Кабинет ученика</h1>
        <div>
          <button onClick={onLogout} style={{ padding: '8px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Выйти</button>
        </div>
      </div>

      {/* Блок профиля и рейтинга */}
      <div style={{ background: '#f8f9fa', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e1e4e8' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{student.name || 'Ученик без имени'}</h2>
            <p style={{ color: '#666', margin: '8px 0 0' }}>
              <strong>Класс:</strong> {student.klass || '—'} | <strong>Школа:</strong> {student.school || '—'}
            </p>
            
            {/* БЛОК РЕЙТИНГА */}
            {ratingInfo ? (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '1.1rem', color: '#2c3e50', marginBottom: '4px' }}>🏆 Ваш рейтинг</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ color: '#3498db', fontWeight: 'bold' }}>{ratingInfo.school}</div>
                    <small style={{ color: '#7f8c8d' }}>из {ratingInfo.totalSchool} учеников</small>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ color: '#2ecc71', fontWeight: 'bold' }}>{ratingInfo.klass}</div>
                    <small style={{ color: '#7f8c8d' }}>из {ratingInfo.totalClass} в классе</small>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ marginTop: '16px', color: '#95a5a6', fontStyle: 'italic' }}>Рейтинг пока не рассчитан (нет данных по школе)</p>
            )}
          </div>

          {/* Блок со звёздами (теперь как доп. метрика) */}
          <div style={{ textAlign: 'right', minWidth: '140px' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#f39c12' }}>{student.stars || 0} ⭐</div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>баллов</div>
          </div>
        </div>
      </div>

      {/* Ссылки на внешние платформы */}
      <div style={{ marginBottom: '24px' }}>
        <h3>Полезные ресурсы</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <a
            href="https://uchi.ru"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#3498db',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(52, 152, 219, 0.3)',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#2980b9')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#3498db')}
          >
            🎓 Учи.ру
          </a>

          <a
            href="https://www.yaklass.ru"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#2ecc71',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(46, 204, 113, 0.3)',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#27ae60')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#2ecc71')}
          >
            📚 ЯКласс
          </a>
        </div>
      </div>

      {/* Олимпиады */}
      <h3>Мои олимпиады</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <h4 style={{ color: '#2c3e50' }}>Завершено</h4>
          {completedOlympiads.length > 0 ? (
            completedOlympiads.map((o, idx) => (
              <div
                key={idx}
                style={{ background: '#d5f5e3', padding: '10px', marginBottom: '8px', borderRadius: '6px', borderLeft: '4px solid #27ae60' }}
              >
                {o.title || 'Олимпиада без названия'}{' '}
                <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                  (+{o.score || 0} баллов)
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: '#999' }}>Пока нет завершённых олимпиад</p>
          )}
        </div>

        <div>
          <h4 style={{ color: '#2c3e50' }}>Доступно</h4>
          {availableOlympiads.length > 0 ? (
            availableOlympiads.map((o, idx) => (
              <div
                key={idx}
                style={{ background: '#eaf2f8', padding: '10px', marginBottom: '8px', borderRadius: '6px', borderLeft: '4px solid #3498db' }}
              >
                {o.title || 'Олимпиада без названия'}
              </div>
            ))
          ) : (
            <p style={{ color: '#999' }}>Нет доступных олимпиад</p>
          )}
        </div>
      </div>
    </div>
  );
}
