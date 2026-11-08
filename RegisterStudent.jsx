// frontend/src/RegisterStudent.jsx
import { useState } from 'react';

export function RegisterStudent({ onSuccess }) {
  const [formData, setFormData] = useState({ name: '', klass: '', school: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.klass || !formData.school) {
      alert('Заполните все поля!');
      return;
    }
    alert('Регистрация ученика успешно отправлена (демо)!');
    onSuccess();
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
      <h2>Регистрация ученика</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ваше имя"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          style={inputStyle}
          required
        />
        <input
          type="text"
          placeholder="Класс (например, 7А)"
          value={formData.klass}
          onChange={(e) => setFormData({...formData, klass: e.target.value})}
          style={inputStyle}
          required
        />
        <input
          type="text"
          placeholder="Школа"
          value={formData.school}
          onChange={(e) => setFormData({...formData, school: e.target.value})}
          style={inputStyle}
          required
        />
        <button type="submit" style={{...btnStyle, background: '#27ae60', width: '100%' }}>Зарегистрироваться</button>
      </form>
      <button onClick={onSuccess} style={backBtnStyle}>← Назад</button>
    </div>
  );
}

const btnStyle = { padding: '12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
const backBtnStyle = { marginTop: '10px', padding: '8px', background: 'transparent', color: '#555', textDecoration: 'underline', cursor: 'pointer' };
