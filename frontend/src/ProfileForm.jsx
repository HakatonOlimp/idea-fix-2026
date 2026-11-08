import { useState } from 'react';
import { sharedState } from './sharedState';

export const ProfileForm = ({ username, onComplete }) => {
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [locality, setLocality] = useState('');
  const [school, setSchool] = useState('');
  const [klass, setKlass] = useState('');

  const CLASSES = ['5А', '5Б', '6А', '6Б', '7А', '7Б', '8А', '8Б', '9А', '9Б'];

  const getDistricts = () =>
    [...new Set(sharedState.schoolsData.filter(r => r.region === region).map(r => r.district))];

  const getLocalities = () =>
    [...new Set(sharedState.schoolsData.filter(r => r.district === district).map(r => r.locality))];

  const getSchools = () =>
    [...new Set(sharedState.schoolsData.filter(r => r.locality === locality).map(r => r.school))];

  const handleSubmit = (e) => {
    e.preventDefault(); // обязательно, иначе страница перезагрузится

    if (!region || !district || !locality || !school || !klass) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }

    sharedState.setProfile(username, {
      name: username,
      region,
      district,
      locality,
      school,
      klass,
    });

    console.log('Профиль сохранён:', sharedState.getProfile(username));
    onComplete(); // закрываем форму → попадаем в кабинет
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <select
        value={region}
        onChange={(e) => { setRegion(e.target.value); setDistrict(''); setLocality(''); setSchool(''); }}
        style={{ padding: '0.5rem' }}
        required
      >
        <option value="">Выберите регион</option>
        {[...new Set(sharedState.schoolsData.map(s => s.region))].map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      {region && (
        <select
          value={district}
          onChange={(e) => { setDistrict(e.target.value); setLocality(''); setSchool(''); }}
          style={{ padding: '0.5rem' }}
          required
        >
          <option value="">Район</option>
          {getDistricts().map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}

      {district && (
        <select
          value={locality}
          onChange={(e) => { setLocality(e.target.value); setSchool(''); }}
          style={{ padding: '0.5rem' }}
          required
        >
          <option value="">Населённый пункт</option>
          {getLocalities().map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      )}

      {locality && (
        <select
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          style={{ padding: '0.5rem' }}
          required
        >
          <option value="">Школа</option>
          {getSchools().map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}

      <select
        value={klass}
        onChange={(e) => setKlass(e.target.value)}
        style={{ padding: '0.5rem' }}
        required
      >
        <option value="">Класс</option>
        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <button
        type="submit"
        style={{
          padding: '0.7rem',
          background: '#28a745',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        Сохранить профиль и войти в кабинет
      </button>
    </form>
  );
};
