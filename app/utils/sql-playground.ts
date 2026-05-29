export type SqlTableSchema = {
  name: string
  columns: { name: string, type: string, key?: 'PK' | 'FK' }[]
  description: string
}

export const PLAYGROUND_SCHEMA: SqlTableSchema[] = [
  {
    name: 'employees',
    description: 'Daftar karyawan',
    columns: [
      { name: 'employee_id', type: 'INT', key: 'PK' },
      { name: 'employee_name', type: 'STRING' },
      { name: 'department_id', type: 'INT', key: 'FK' },
      { name: 'hire_date', type: 'DATE' },
      { name: 'email', type: 'STRING' },
      { name: 'status', type: 'STRING' },
    ],
  },
  {
    name: 'departments',
    description: 'Master departemen',
    columns: [
      { name: 'department_id', type: 'INT', key: 'PK' },
      { name: 'department_name', type: 'STRING' },
      { name: 'manager_name', type: 'STRING' },
    ],
  },
  {
    name: 'salaries',
    description: 'Histori gaji per karyawan',
    columns: [
      { name: 'salary_id', type: 'INT', key: 'PK' },
      { name: 'employee_id', type: 'INT', key: 'FK' },
      { name: 'salary_amount', type: 'INT' },
      { name: 'bonus', type: 'INT' },
      { name: 'effective_date', type: 'DATE' },
    ],
  },
  {
    name: 'projects',
    description: 'Project per departemen',
    columns: [
      { name: 'project_id', type: 'INT', key: 'PK' },
      { name: 'project_name', type: 'STRING' },
      { name: 'department_id', type: 'INT', key: 'FK' },
      { name: 'budget', type: 'INT' },
      { name: 'status', type: 'STRING' },
    ],
  },
  {
    name: 'attendance',
    description: 'Absensi harian',
    columns: [
      { name: 'attendance_id', type: 'INT', key: 'PK' },
      { name: 'employee_id', type: 'INT', key: 'FK' },
      { name: 'attendance_date', type: 'DATE' },
      { name: 'check_in', type: 'STRING' },
      { name: 'check_out', type: 'STRING' },
      { name: 'work_type', type: 'STRING' },
    ],
  },
]

export const SEED_SQL = `
CREATE TABLE departments (
  department_id INT,
  department_name STRING,
  manager_name STRING
);
INSERT INTO departments VALUES
  (10, 'Engineering', 'Andi Saputra'),
  (20, 'Database', 'Budi Pratama'),
  (30, 'Finance', 'Citra Lestari'),
  (40, 'HR', 'Dewi Anggraini'),
  (50, 'Operations', 'Eko Wijaya');

CREATE TABLE employees (
  employee_id INT,
  employee_name STRING,
  department_id INT,
  hire_date DATE,
  email STRING,
  status STRING
);
INSERT INTO employees VALUES
  (1001, 'Teguh Prasetyo',  20, '2018-03-12', 'teguh@example.com',   'active'),
  (1002, 'Ilham Rahmadi',   10, '2019-07-01', 'ilham@example.com',   'active'),
  (1003, 'Rizal Kurniawan', 10, '2020-01-15', 'rizal@example.com',   'active'),
  (1004, 'Fahrul Hidayat',  30, '2017-11-22', 'fahrul@example.com',  'active'),
  (1005, 'Sari Wulandari',  40, '2021-05-09', 'sari@example.com',    'active'),
  (1006, 'Joko Mulyono',    20, '2016-08-30', 'joko@example.com',    'active'),
  (1007, 'Nina Pertiwi',    30, '2022-02-14', 'nina@example.com',    'active'),
  (1008, 'Bayu Anggara',    10, '2015-04-03', 'bayu@example.com',    'inactive'),
  (1009, 'Linda Susanti',   50, '2019-12-20', 'linda@example.com',   'active'),
  (1010, 'Rendi Maulana',   20, '2023-06-11', 'rendi@example.com',   'active'),
  (1011, 'Mega Putri',      40, '2018-09-17', 'mega@example.com',    'active'),
  (1012, 'Hadi Suryanto',   50, '2014-01-25', 'hadi@example.com',    'active'),
  (1013, 'Tika Ramadhani',  30, '2020-10-08', 'tika@example.com',    'inactive'),
  (1014, 'Galang Pratomo',  10, '2021-03-19', 'galang@example.com',  'active'),
  (1015, 'Wulan Safitri',   20, '2022-07-27', 'wulan@example.com',   'active'),
  (1016, 'Reza Aditya',     50, '2023-11-02', 'reza@example.com',    'active'),
  (1017, 'Dewi Lestari',    40, '2019-05-13', 'dewi@example.com',    'active'),
  (1018, 'Anton Subagja',   30, '2016-02-28', 'anton@example.com',   'active'),
  (1019, 'Yulia Sari',      10, '2024-01-08', 'yulia@example.com',   'active'),
  (1020, 'Krisna Wibowo',   20, '2017-06-21', 'krisna@example.com',  'active');

CREATE TABLE salaries (
  salary_id INT,
  employee_id INT,
  salary_amount INT,
  bonus INT,
  effective_date DATE
);
INSERT INTO salaries VALUES
  (1, 1001, 18000000, 3000000, '2024-01-01'),
  (2, 1002, 15000000, 2000000, '2024-01-01'),
  (3, 1003, 13000000, 1500000, '2024-01-01'),
  (4, 1004, 22000000, 5000000, '2024-01-01'),
  (5, 1005,  9000000,  500000, '2024-01-01'),
  (6, 1006, 25000000, 6000000, '2024-01-01'),
  (7, 1007, 12000000, 1000000, '2024-01-01'),
  (8, 1008, 10000000,       0, '2023-06-01'),
  (9, 1009, 11000000, 1000000, '2024-01-01'),
  (10,1010,  8500000,  500000, '2024-01-01'),
  (11,1011, 14000000, 2000000, '2024-01-01'),
  (12,1012, 28000000, 8000000, '2024-01-01'),
  (13,1013, 11500000,  800000, '2023-08-01'),
  (14,1014, 13500000, 1200000, '2024-01-01'),
  (15,1015, 12500000, 1500000, '2024-01-01'),
  (16,1016,  9500000,  600000, '2024-01-01'),
  (17,1017, 14500000, 2500000, '2024-01-01'),
  (18,1018, 16000000, 3000000, '2024-01-01'),
  (19,1019, 11000000, 1000000, '2024-01-01'),
  (20,1020, 17500000, 3500000, '2024-01-01');

CREATE TABLE projects (
  project_id INT,
  project_name STRING,
  department_id INT,
  budget INT,
  status STRING
);
INSERT INTO projects VALUES
  (101, 'Migrasi Oracle 19c',      20, 350000000, 'in_progress'),
  (102, 'Implementasi RAC',        20, 500000000, 'planned'),
  (103, 'Dashboard Eksekutif',     10, 120000000, 'completed'),
  (104, 'Otomasi Closing',         30, 200000000, 'in_progress'),
  (105, 'Sistem Cuti Online',      40,  80000000, 'completed'),
  (106, 'Backup DR Site',          20, 280000000, 'in_progress'),
  (107, 'Mobile Time Sheet',       10,  95000000, 'on_hold'),
  (108, 'Audit Trail Compliance',  30, 150000000, 'in_progress'),
  (109, 'Onboarding Portal',       40,  60000000, 'planned'),
  (110, 'Network Upgrade',         50, 220000000, 'in_progress');

CREATE TABLE attendance (
  attendance_id INT,
  employee_id INT,
  attendance_date DATE,
  check_in STRING,
  check_out STRING,
  work_type STRING
);
INSERT INTO attendance VALUES
  (1, 1001, '2026-05-26', '08:05', '17:10', 'onsite'),
  (2, 1001, '2026-05-27', '08:00', '17:15', 'onsite'),
  (3, 1001, '2026-05-28', '08:10', '17:00', 'remote'),
  (4, 1002, '2026-05-26', '09:00', '18:05', 'remote'),
  (5, 1002, '2026-05-27', '08:55', '18:00', 'onsite'),
  (6, 1003, '2026-05-26', '08:30', '17:30', 'onsite'),
  (7, 1003, '2026-05-27', '08:25', '17:25', 'onsite'),
  (8, 1004, '2026-05-26', '07:45', '16:50', 'onsite'),
  (9, 1004, '2026-05-27', '07:50', '16:55', 'onsite'),
  (10,1005, '2026-05-26', '08:15', '17:20', 'onsite'),
  (11,1006, '2026-05-26', '08:00', '17:00', 'remote'),
  (12,1006, '2026-05-27', '08:00', '17:00', 'remote'),
  (13,1007, '2026-05-26', '09:10', '18:15', 'onsite'),
  (14,1009, '2026-05-26', '08:00', '17:00', 'onsite'),
  (15,1009, '2026-05-27', '08:00', '17:00', 'onsite'),
  (16,1010, '2026-05-26', '08:30', '17:30', 'remote'),
  (17,1011, '2026-05-26', '08:00', '17:00', 'onsite'),
  (18,1011, '2026-05-27', '08:05', '17:05', 'onsite'),
  (19,1012, '2026-05-26', '07:30', '16:30', 'onsite'),
  (20,1014, '2026-05-26', '08:20', '17:25', 'remote'),
  (21,1014, '2026-05-27', '08:15', '17:20', 'remote'),
  (22,1015, '2026-05-26', '09:00', '18:00', 'onsite'),
  (23,1015, '2026-05-27', '08:50', '17:55', 'onsite'),
  (24,1016, '2026-05-26', '08:00', '17:10', 'onsite'),
  (25,1017, '2026-05-26', '08:00', '17:00', 'onsite'),
  (26,1018, '2026-05-26', '07:55', '17:05', 'remote'),
  (27,1019, '2026-05-26', '09:15', '18:20', 'onsite'),
  (28,1020, '2026-05-26', '08:00', '17:00', 'remote'),
  (29,1020, '2026-05-27', '08:10', '17:10', 'onsite'),
  (30,1020, '2026-05-28', '08:00', '17:00', 'onsite');
`

export type SqlExample = {
  id: string
  category: 'select' | 'where' | 'order' | 'group' | 'join' | 'aggregate' | 'subquery'
  title: string
  sql: string
  explanation: string
}

export const SQL_EXAMPLES: SqlExample[] = [
  {
    id: 'select-all',
    category: 'select',
    title: 'SELECT semua kolom',
    sql: 'SELECT * FROM employees;',
    explanation: 'Mengambil semua baris dan semua kolom dari tabel employees. * = wildcard untuk semua kolom.',
  },
  {
    id: 'select-cols',
    category: 'select',
    title: 'Pilih kolom tertentu',
    sql: 'SELECT employee_name, email, status FROM employees;',
    explanation: 'Hanya mengambil 3 kolom yang disebutkan. Lebih efisien dibanding SELECT *.',
  },
  {
    id: 'where-equal',
    category: 'where',
    title: 'WHERE — filter aktif',
    sql: "SELECT employee_name, email\nFROM employees\nWHERE status = 'active';",
    explanation: 'WHERE memfilter baris berdasarkan kondisi. Gunakan tanda petik untuk nilai string.',
  },
  {
    id: 'where-and',
    category: 'where',
    title: 'WHERE — multi kondisi',
    sql: "SELECT * FROM employees\nWHERE department_id = 20 AND status = 'active';",
    explanation: 'AND menggabungkan dua kondisi (kedua harus benar). Untuk salah satu boleh benar gunakan OR.',
  },
  {
    id: 'order-by',
    category: 'order',
    title: 'ORDER BY',
    sql: 'SELECT employee_name, hire_date\nFROM employees\nORDER BY hire_date DESC;',
    explanation: 'ORDER BY mengurutkan hasil. DESC = descending (besar→kecil), ASC = ascending (default).',
  },
  {
    id: 'aggregate-count',
    category: 'aggregate',
    title: 'COUNT — hitung baris',
    sql: 'SELECT COUNT(*) AS total_employees FROM employees;',
    explanation: 'COUNT(*) menghitung jumlah baris. AS memberi alias nama kolom hasil.',
  },
  {
    id: 'aggregate-avg',
    category: 'aggregate',
    title: 'AVG, MIN, MAX, SUM',
    sql: 'SELECT MIN(salary_amount), MAX(salary_amount), AVG(salary_amount), SUM(salary_amount)\nFROM salaries;',
    explanation: 'Aggregate functions: MIN (terkecil), MAX (terbesar), AVG (rata-rata), SUM (jumlah). Bekerja di seluruh baris.',
  },
  {
    id: 'group-by',
    category: 'group',
    title: 'GROUP BY + COUNT',
    sql: 'SELECT department_id, COUNT(*) AS jumlah\nFROM employees\nGROUP BY department_id;',
    explanation: 'GROUP BY mengelompokkan baris dengan nilai sama, lalu aggregate dihitung per kelompok.',
  },
  {
    id: 'group-having',
    category: 'group',
    title: 'GROUP BY + HAVING',
    sql: 'SELECT department_id, COUNT(*) AS jumlah\nFROM employees\nGROUP BY department_id\nHAVING COUNT(*) > 3;',
    explanation: 'HAVING memfilter hasil setelah GROUP BY (gak bisa pakai WHERE untuk filter aggregate).',
  },
  {
    id: 'join-inner',
    category: 'join',
    title: 'INNER JOIN dua tabel',
    sql: 'SELECT e.employee_name, d.department_name\nFROM employees e\nINNER JOIN departments d ON e.department_id = d.department_id;',
    explanation: 'INNER JOIN ambil baris yang cocok di kedua tabel. Alias e/d untuk mempersingkat.',
  },
  {
    id: 'join-left',
    category: 'join',
    title: 'LEFT JOIN — semua dari kiri',
    sql: 'SELECT d.department_name, e.employee_name\nFROM departments d\nLEFT JOIN employees e ON d.department_id = e.department_id;',
    explanation: 'LEFT JOIN ambil semua dari tabel kiri, plus yang cocok dari kanan. Yang gak match jadi NULL.',
  },
  {
    id: 'join-multi',
    category: 'join',
    title: 'JOIN 3 tabel + GROUP BY',
    sql: 'SELECT d.department_name, COUNT(e.employee_id) AS jumlah_karyawan, SUM(s.salary_amount) AS total_gaji\nFROM departments d\nLEFT JOIN employees e ON e.department_id = d.department_id\nLEFT JOIN salaries s ON s.employee_id = e.employee_id\nGROUP BY d.department_name\nORDER BY total_gaji DESC;',
    explanation: 'Join tiga tabel, agregat per departemen, urutkan dari total gaji terbesar.',
  },
  {
    id: 'subquery',
    category: 'subquery',
    title: 'Subquery — gaji di atas rata-rata',
    sql: 'SELECT e.employee_name, s.salary_amount\nFROM employees e\nJOIN salaries s ON e.employee_id = s.employee_id\nWHERE s.salary_amount > (SELECT AVG(salary_amount) FROM salaries);',
    explanation: 'Subquery dalam WHERE: bandingkan dengan hasil query lain (rata-rata gaji semua karyawan).',
  },
]

export const SQL_EXAMPLE_CATEGORIES = [
  { value: 'all', label: 'Semua' },
  { value: 'select', label: 'SELECT' },
  { value: 'where', label: 'WHERE' },
  { value: 'order', label: 'ORDER BY' },
  { value: 'group', label: 'GROUP BY' },
  { value: 'aggregate', label: 'Aggregate' },
  { value: 'join', label: 'JOIN' },
  { value: 'subquery', label: 'Subquery' },
]

export type SqlChallenge = {
  id: string
  title: string
  hint: string
  expectedRows: number
  expectedColumns: string[]
  validate: (rows: Record<string, unknown>[]) => boolean
}

export const SQL_CHALLENGES: SqlChallenge[] = [
  {
    id: 'c1',
    title: 'Tampilkan semua karyawan yang status-nya active',
    hint: "SELECT … FROM employees WHERE status = 'active';",
    expectedRows: 18,
    expectedColumns: ['employee_id', 'employee_name'],
    validate: rows => rows.length === 18 && rows.every(r => Object.prototype.hasOwnProperty.call(r, 'employee_name')),
  },
  {
    id: 'c2',
    title: 'Cari karyawan dengan gaji lebih dari 15.000.000',
    hint: 'JOIN employees dan salaries, filter salary_amount > 15000000.',
    expectedRows: 7,
    expectedColumns: ['employee_name', 'salary_amount'],
    validate(rows) {
      return rows.length === 7
        && rows.every(r => typeof r.salary_amount === 'number' && (r.salary_amount as number) > 15_000_000)
    },
  },
  {
    id: 'c3',
    title: 'Hitung jumlah karyawan per departemen (department_name + jumlah)',
    hint: 'JOIN employees dan departments, GROUP BY department_name.',
    expectedRows: 5,
    expectedColumns: ['department_name'],
    validate(rows) {
      return rows.length === 5
        && rows.every(r => Object.prototype.hasOwnProperty.call(r, 'department_name'))
    },
  },
  {
    id: 'c4',
    title: 'Total budget project yang status-nya in_progress',
    hint: "SELECT SUM(budget) FROM projects WHERE status = 'in_progress';",
    expectedRows: 1,
    expectedColumns: [],
    validate(rows) {
      if (rows.length !== 1) return false
      const r = rows[0]!
      const total = Object.values(r).find(v => typeof v === 'number') as number | undefined
      return total === 1_300_000_000
    },
  },
  {
    id: 'c5',
    title: 'Daftar 5 karyawan dengan gaji tertinggi',
    hint: 'JOIN + ORDER BY salary_amount DESC + LIMIT 5 (atau FETCH FIRST 5 ROWS ONLY).',
    expectedRows: 5,
    expectedColumns: ['employee_name', 'salary_amount'],
    validate(rows) {
      if (rows.length !== 5) return false
      for (let i = 1; i < rows.length; i++) {
        const prev = rows[i - 1]!.salary_amount as number
        const cur = rows[i]!.salary_amount as number
        if (cur > prev) return false
      }
      return true
    },
  },
]
