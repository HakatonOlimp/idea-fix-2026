import { useState } from 'react';
import { sharedState } from './sharedState';

export function ProfileFormTeacher({ onSave, currentUser }) {
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [locality, setLocality] = useState('');
  const [school, setSchool] = useState('');

  const schools = sharedState.schoolsData;

  const regions = [...new Set(schools.map(s => s.region))];
  const districts = [...new Set(schools.filter(s => s.region === region).map(s => s.district))];
  const localities = [...new Set(schools.filter(s => s.region === region && s.district === district).map(s => s.locality))];
  const schoolsInLocality = schools.filter(s => s.region === region && s.district === district && s.locality === locality);

  const handleSave = () => {
    sharedState.setProfile(currentUser, {
      name: currentUser,
      region,
      district,
      locality,
      school,
    });
    onSave();
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h3>Профиль учителя</h3>
      <p style={{ color: '#666' }}>Выберите регион, район, город и школу. Класс указывать не нужно.</p>

      <select value={region} onChange={e => setRegion(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem' }} required>
        <option value="">Выберите регион</option>
        {regions.map(r => <option key={r} value={r}>{r}</option>)}
      </select>

      {region && (
        <select value={district} onChange={e => setDistrict(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem' }} required>
          <option value="">Выберите район</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}

      {district && (
        <select value={locality} onChange={e => setLocality(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem' }} required>
          <option value="">Выберите город/пункт</option>
          {localities.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      )}

      {locality && (
        <select value={school} onChange={e => setSchool(e.target.value)} style={{ width: '100%', marginBottom: '1rem' }} required>
          <option value="">Выберите школу</option>
          {schoolsInLocality.map(s => <option key={s.school} value={s.school}>{s.school}</option>)}
        </select>
      )}

      <button onClick={handleSave} disabled={!region || !district || !locality || !school} style={{ width: '100%', padding: '0.7rem', background: '#28a745', color: '#fff', border: 'none' }}>
        Сохранить профиль и войти
      </button>
    </div>
  );
}
