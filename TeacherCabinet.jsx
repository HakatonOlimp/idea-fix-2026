import { useState, useEffect } from 'react';
import { sharedState } from './sharedState';

export function TeacherCabinet() {
  // Состояние для формы добавления
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    klass: ''
  });
  
  // Локальные ученики (те, что добавил учитель в этой сессии)
  const [localStudents, setLocalStudents] = useState([]);
  
  // Звёзды для учеников (хранятся пока в памяти, сбрасываются при обновлении, 
  // но можно тоже сохранять в localStorage, если нужно)
  const [stars, setStars] = useState({});

  // 1. При загрузке пытаемся восстановить учеников, которых добавляли раньше в этом браузере
  useEffect(() => {
    const saved = localStorage.getItem('idea_fix_students_local');
    if (saved) {
      setLocalStudents(JSON.parse(saved));
    }
  }, []);

  // --- ЛОГИКА АВТОПРИВЯЗКИ И ДОБАВЛЕНИЯ ---
  const handleAddStudent = (e) => {
    e.preventDefault();
    
    // ВАЖНО: Здесь мы должны знать, какую школу выбрал учитель. 
    // В реальном проекте это приходит из профиля учителя. 
    // Пока сделаем так: берём ПЕРВУЮ школу из списка школ как "текущую школу учителя" 
    // ИЛИ (лучше) пусть учитель выберет её в форме.
    
    const currentSchool = sharedState.schoolsData[0]; // <-- ВРЕМЕННАЯ ЗАГОТОВКА: берём первую школу
    // Если у тебя есть способ получить школу учителя (например, из URL или другого стейта), замени эту строку!
    // Например: const currentSchool = teacherProfile.school;

    if (!currentSchool) {
      alert('Сначала загрузите data.csv с перечнем школ!');
      return;
    }

    const { firstName, lastName, klass } = formData;
    
    // Генерируем логин: Фамилия + Инициал имени + случайное число (чтобы не повторялось)
    const random = Math.floor(Math.random() * 1000);
    const username = `${lastName.toLowerCase()}${firstName.charAt(0).toLowerCase()}${random}`;

    const newStudent = {
      username,
      firstName,
      lastName,
      region: currentSchool.region,
      district: currentSchool.district,
      locality: currentSchool.locality,
      school: currentSchool.school,
      klass,
      stars: 0,
      isLocal: true // флаг, что это новый ученик
    };

    // Добавляем в локальный список
    const updatedList = [...localStudents, newStudent];
    setLocalStudents(updatedList);
    
    // Сохраняем в браузер, чтобы не пропали при прокрутке
    localStorage.setItem('idea_fix_students_local', JSON.stringify(updatedList));
    
    // Очищаем форму
    setFormData({ firstName: '', lastName: '', klass: '' });
    alert(`Ученик ${lastName} ${firstName} добавлен в школу "${currentSchool.school}"!`);
  };

  // Объединяем учеников из файла (students.csv) и локальных (тех, что добавил учитель)
  // Фильтруем: показываем только тех, кто из школы текущего учителя
  const currentTeacherSchool = sharedState.schoolsData[0]?.school || ''; 
  
  const allStudents = [
    ...sharedState.studentsData.filter(s => s.school === currentTeacherSchool),
    ...localStudents.filter(s => s.school === currentTeacherSchool)
  ];

  // Функция начисления звёзд
  const giveStars = (username, count) => {
    if (!count || count <= 0) return;
    setStars(prev => ({
      ...prev,
      [username]: (prev[username] || 0) + count
    }));
    console.log(`Начислено ${count} звёзд ученику ${username}`);
  };

  // Функция скачивания итогового CSV (для фиксации результатов)
  const downloadCSV = () => {
    const rows = [['username', 'region', 'district', 'locality', 'school', 'klass', 'stars']];
    
    allStudents.forEach(s => {
      rows.push([
        s.username, 
        s.region, 
        s.district, 
        s.locality, 
        s.school, 
        s.klass, 
        (stars[s.username] || s.stars || 0)
      ]);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'students_final.csv';
    link.click();
  };

  if (sharedState.loading) {
    return <div style={{ padding: '2rem' }}>Загрузка данных...</div>;
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h2>Кабинет учителя</h2>
      
      {/* БЛОК СТАТУСА: Какая школа сейчас активна */}
      <div style={{ background: '#e8f4fd', border: '1px solid #b0d7f0', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>🏫 Текущая школа учителя:</h3>
        <p style={{ fontWeight: 'bold', color: '#2c3e50' }}>
          {sharedState.schoolsData.length > 0 
            ? `${sharedState.schoolsData[0].region}, ${sharedState.schoolsData[0].school}` 
            : 'Школы не загружены (проверьте data.csv)'}
        </p>
        <small style={{ color: '#666' }}>Все ученики будут автоматически привязаны к этой школе.</small>
      </div>

      {/* ФОРМА ДОБАВЛЕНИЯ (Только имя, фамилия, класс) */}
      <div style={{ border: '2px dashed #3498db', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>➕ Добавить нового ученика</h3>
        <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input 
            name="lastName" 
            placeholder="Фамилия" 
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            required 
            style={{ padding: '8px', width: '140px' }} 
          />
          <input 
            name="firstName" 
            placeholder="Имя" 
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            required 
            style={{ padding: '8px', width: '120px' }} 
          />
          <input 
            name="klass" 
            placeholder="Класс (7А)" 
            value={formData.klass}
            onChange={(e) => setFormData({...formData, klass: e.target.value})}
            required 
            style={{ padding: '8px', width: '80px' }} 
          />
          
          <button type="submit" style={{ 
            padding: '8px 20px', 
            background: '#2ecc71', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            Добавить ученика
          </button>
        </form>
        <p style={{ fontSize: '0.85em', color: '#555', marginTop: '8px' }}>
          Регион, район и школа подставятся автоматически из настроек кабинета учителя.
        </p>
      </div>

      {/* ТАБЛИЦА УЧЕНИКОВ И НАЧИСЛЕНИЕ ЗВЁЗД */}
      <h3>⭐ Ученики и начисление звёзд</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>ФИО</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Школа / Класс</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Текущие звёзды</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Начислить</th>
          </tr>
        </thead>
        <tbody>
          {allStudents.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#777' }}>
                Пока нет учеников. Добавьте первого через форму выше.
              </td>
            </tr>
          ) : (
            allStudents.map((student, idx) => {
              const currentStars = (stars[student.username] || student.stars || 0);
              return (
                <tr key={student.username || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                    <strong>{student.lastName} {student.firstName}</strong> <br/>
                    <small style={{ color: '#888' }}>(Логин: {student.username})</small>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                    {student.school}<br/>
                    <span style={{ color: '#333', fontWeight: 'bold' }}>{student.klass}</span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontSize: '1.2em' }}>
                    ⭐ {currentStars}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    <input
                      type="number"
                      min="1"
                      placeholder="Кол-во"
                      style={{ width: '60px', padding: '4px', textAlign: 'center' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') giveStars(student.username, parseInt(e.target.value) || 1);
                      }}
                    />
                    <button
                      onClick={() => giveStars(student.username, 1)}
                      style={{ 
                        marginLeft: '5px', 
                        padding: '4px 12px', 
                        background: '#f39c12', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer' 
                      }}
                    >
                      +1 ⭐
                    </button>
                    <button
                      onClick={() => giveStars(student.username, 5)}
                      style={{ 
                        marginLeft: '5px', 
                        padding: '4px 12px', 
                        background: '#e74c3c', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer' 
                      }}
                    >
                      +5 ⭐
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <button 
          onClick={downloadCSV} 
          style={{ 
            padding: '10px 20px', 
            background: '#9b59b6', 
            color: 'white', 
            border: 'none', 
            fontSize: '1rem', 
            cursor: 'pointer' 
          }}
        >
          💾 Скачать итоговый students.csv
        </button>
      </div>
    </div>
  );
}
