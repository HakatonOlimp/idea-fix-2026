import { useState, useEffect } from 'react';
import { sharedState } from './sharedState';

export function ProfileFormStudent({ onSave, currentUser }) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [locality, setLocality] = useState('');
  const [school, setSchool] = useState('');
  const [klass, setKlass] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // Локальный стейт для данных школ — он заставляет форму перерисовываться при изменении данных
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = sharedState.schoolsData || [];
    
    if (data.length > 0) {
      setSchools(data);
      setIsLoading(false);
      
      // ЛОГ: сразу видно, что реально пришло из CSV — пригодится, если что-то не сработает
      console.log('[ProfileForm] Данные загружены в форму:', data.length, 'строк');
      console.log('[ProfileForm] Первая школа:', data[0]);
    }
  }, [sharedState.schoolsData]);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial' }}>
        <p style={{ fontSize: '1.1rem' }}>Загрузка списка школ и регионов…</p>
        <div style={{ border: '1px dashed #ccc', padding: '1rem', display: 'inline-block', color: '#666' }}>
          Данные загружаются из CSV. Пожалуйста, подождите пару секунд.
        </div>
      </div>
    );
  }

  // --- УНИВЕРСАЛЬНЫЙ ПОИСК НАЗВАНИЙ КОЛОНОК ---
  // Находим, как реально называется поле с регионом (region / область / регион)
  const firstSchool = schools[0];
  const regionKey = firstSchool
    ? Object.keys(firstSchool).find(k =>
        ['region', 'область', 'регион'].includes(k.toLowerCase())
      )
    : null;

  // Находим поле с районом (district / район)
  const districtKey = firstSchool
    ? Object.keys(firstSchool).find(k =>
        ['district', 'район'].includes(k.toLowerCase())
      )
    : null;

  // Находим поле с населённым пунктом (locality / населённый пункт)
  const localityKey = firstSchool
    ? Object.keys(firstSchool).find(k =>
        ['locality', 'населённый пункт', 'населенный пункт'].includes(k.toLowerCase())
      )
    : null;

  // Находим поле со школой
  const schoolKey = firstSchool
    ? Object.keys(firstSchool).find(k =>
        ['school', 'школа'].includes(k.toLowerCase())
      )
    : null;

  // --- ФОРМИРОВАНИЕ СПИСКОВ ---
  let regions = [];
  let districts = [];
  let localities = [];
  let schoolsInLocality = [];

  if (regionKey) {
    regions = [...new Set(schools.map(s => s[regionKey]))].filter(Boolean);
  }

  if (regionKey && districtKey) {
    districts = [
      ...new Set(
        schools
          .filter(s => s[regionKey] === region)
          .map(s => s[districtKey])
      )
    ].filter(Boolean);
  }

  if (regionKey && districtKey && localityKey) {
    localities = [
      ...new Set(
        schools
          .filter(
            s =>
              s[regionKey] === region &&
              s[districtKey] === district
          )
          .map(s => s[localityKey])
      )
    ].filter(Boolean);
  }

  if (regionKey && districtKey && localityKey && schoolKey) {
    schoolsInLocality = schools.filter(
      s =>
        s[regionKey] === region &&
        s[districtKey] === district &&
        s[localityKey] === locality
    );
  }

  const handleSave = () => {
    // Сохраняем профиль в sharedState
    sharedState.setProfile(currentUser, {
      name,
      region,
      district,
      locality,
      school,
      klass,
      birthDate,
      stars: 0,
      completedOlympiads: [],
      availableOlympiads: []
    });

    onSave();
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h3>Профиль ученика</h3>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Заполните профиль, чтобы видеть олимпиады, рейтинг и полезные ссылки.
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem' }}>Полное имя ученика *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Например: Алексей Иванов"
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
          required
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem' }}>Дата рождения *</label>
        <input
          type="date"
          value={birthDate}
          onChange={e => setBirthDate(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
          required
        />
      </div>

      {/* Выпадающий список регионов */}
      <select
        value={region}
        onChange={e => {
          setRegion(e.target.value);
          setDistrict('');
          setLocality('');
          setSchool('');
        }}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '0.7rem' }}
        required
      >
        <option value="">Выберите регион</option>
        {regions.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      {/* Выпадающий список районов */}
      {region && (
        <select
          value={district}
          onChange={e => {
            setDistrict(e.target.value);
            setLocality('');
            setSchool('');
          }}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.7rem' }}
          required
        >
          <option value="">Выберите район</option>
          {districts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}

      {/* Выпадающий список населённых пунктов */}
      {district && (
        <select
          value={locality}
          onChange={e => {
            setLocality(e.target.value);
            setSchool('');
          }}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.7rem' }}
          required
        >
          <option value="">Выберите город/населённый пункт</option>
          {localities.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      )}

      {/* Выпадающий список школ */}
      {locality && (
        <select
          value={school}
          onChange={e => setSchool(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.7rem' }}
          required
        >
          <option value="">Выберите школу</option>
          {schoolsInLocality.map(s => (
            <option key={s[schoolKey] || s.school} value={s[schoolKey] || s.school}>{s[schoolKey] || s.school}</option>
          ))}
        </select>
      )}

      {/* Поле для класса */}
      {school && (
        <>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold' }}>Класс *</label>
          <input
            type="text"
            value={klass}
            onChange={e => setKlass(e.target.value.trim())}
            placeholder="Например, 7А"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            required
          />
        </>
      )}

      <button
        onClick={handleSave}
        disabled={!name || !region || !district || !locality || !school || !klass || !birthDate}
        style={{
          width: '100%',
          padding: '0.8rem',
          marginTop: '1rem',
          background: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          cursor: !name ? 'not-allowed' : 'pointer'
        }}
      >
        Сохранить профиль и войти
      </button>
    </div>
  );
}
