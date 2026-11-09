// frontend/src/sharedState.js
export class SharedState {
  constructor() {
    this.schoolsData = [];
    this.studentsData = [];
    this.teachersData = []; // <-- теперь есть отдельный массив для учителей
    this.currentUser = null;
  }

  async init() {
    // 1. Пытаемся загрузить реальный CSV
    try {
      const res = await fetch('/data.csv');
      if (!res.ok) throw new Error('Файл не найден');
      const text = await res.text();

      const lines = text.trim().split('\n');
      if (lines.length === 0) throw new Error('Пустой файл');

      const headers = lines[0]
        .split(',')
        .map(h => h.trim().toLowerCase());

      this.schoolsData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = values[i];
        });
        return obj;
      });

      console.log('[sharedState] CSV загружен:', this.schoolsData.length, 'строк');
    } catch (err) {
      console.warn('[sharedState]', err.message, '— используем тестовые данные');

      // 2. Резервные тестовые данные
      this.schoolsData = [
        { region: 'Приморский край', district: 'Владивостокский', locality: 'Владивосток', school: 'Школа №1' },
        { region: 'Приморский край', district: 'Надеждинский', locality: 'Вольно-Надеждинское', school: 'Школа №2' },
        { region: 'Хабаровский край', district: 'Хабаровский', locality: 'Хабаровск', school: 'Гимназия №1' },
        { region: 'Амурская область', district: 'Благовещенский', locality: 'Благовещенск', school: 'Лицей №1' }
      ];
    }

    // Тестовые ученики
    this.studentsData = [
      {
        username: 'student_demo',
        name: 'Алексей Иванов',
        klass: '7А',
        school: 'Школа №1, Владивосток',
        region: 'Приморский край',
        stars: 15,
        completedOlympiads: [{ title: 'Математика-2026', score: 10 }],
        availableOlympiads: [{ title: 'Информатика-2026' }]
      },
      {
        username: 'student_new',
        name: 'Мария Петрова',
        klass: '8Б',
        school: 'Гимназия №3, Хабаровск',
        region: 'Хабаровский край',
        stars: 8,
        completedOlympiads: [],
        availableOlympiads: [
          { title: 'Физика-2026' },
          { title: 'Химия-2026' }
        ]
      }
    ];

    // Восстановление текущего пользователя из localStorage
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
    }

    console.log('[sharedState] Инициализация завершена');
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  // Ищем профиль: если роль teacher — ищем в teachersData, иначе в studentsData
  getProfile(username, role) {
    if (role === 'teacher') {
      return this.teachersData.find(t => t.username === username);
    }
    return this.studentsData.find(s => s.username === username);
  }

  // Сохраняем профиль в нужный массив по роли
  setProfile(username, profile, role) {
    if (role === 'teacher') {
      const teacher = this.teachersData.find(t => t.username === username);
      if (teacher) {
        Object.assign(teacher, profile);
      } else {
        this.teachersData.push({ username, ...profile });
      }
    } else {
      const student = this.studentsData.find(s => s.username === username);
      if (student) {
        Object.assign(student, profile);
      } else {
        this.studentsData.push({ username, ...profile });
      }
    }
  }
}

export const sharedState = new SharedState();
