export type Job = {
  company: string
  companyUrl?: string
  logo?: string
  title: string
  period: string
  current?: boolean
  location: string
  summary: string
  highlights: string[]
  tech: string[]
}

export const jobs: Job[] = [
  {
    company: 'PT Yasatech Sinergi Inspirasi',
    companyUrl: 'https://yasatech.co.id/',
    logo: '/images/logos/logo-yasatech.png',
    title: 'Technical Consultant Database',
    period: 'Apr 2025 — Present',
    current: true,
    location: 'Jakarta, Indonesia',
    summary:
      'Consulting on database architecture, performance, and reliability for enterprise customers across banking, government, and logistics.',
    highlights: [
      'Lead database design and migration engagements for enterprise clients',
      'Drive performance tuning, HA/DR strategy, and security hardening',
      'Mentor junior DBAs on Oracle, PostgreSQL, and cloud-native data services',
    ],
    tech: ['Oracle', 'PostgreSQL', 'Data Guard', 'RAC', 'Linux'],
  },
  {
    company: 'PT Prima Integrasi Network',
    companyUrl: 'https://prima-integrasi.co.id/',
    logo: '/images/logos/logo-pinet.png',
    title: 'Database Administrator',
    period: 'Jun 2022 — Mar 2025',
    location: 'Jakarta, Indonesia',
    summary:
      'Owned end-to-end database operations for clients including Jakarta Smart City, JNE, Askrindo, BSS, BPKD DKI Jakarta, and BRI.',
    highlights: [
      'Implemented Oracle RAC 2-node and Data Guard for production workloads',
      'Led data center relocation and 11g → 19c upgrade migrations',
      'Built Spark/Hive ETL pipelines for BRI Anti Money Laundry program',
      'Established backup, recovery, and patching procedures with documented SLAs',
    ],
    tech: ['Oracle 11g/19c', 'RAC', 'Data Guard', 'Data Pump', 'Hive', 'Spark', 'Python'],
  },
  {
    company: 'PT Securindo Packatama Indonesia',
    companyUrl: 'https://securaparking.com/',
    logo: '/images/logos/logo-spi.png',
    title: 'IT System Support',
    period: 'Nov 2017 — Jun 2022',
    location: 'Jakarta, Indonesia',
    summary:
      'Supported core operational systems and infrastructure for nationwide parking operations.',
    highlights: [
      'Troubleshot production incidents across servers, networks, and POS endpoints',
      'Drafted and maintained operational runbooks',
      'Coordinated rollouts and onsite support with regional teams',
    ],
    tech: ['Windows Server', 'Linux', 'MSSQL', 'Networking'],
  },
]

export type SkillGroup = {
  category: string
  items: { name: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert'; icon?: string }[]
}

export const skills: SkillGroup[] = [
  {
    category: 'Databases',
    items: [
      { name: 'Oracle', level: 'expert', icon: 'i-simple-icons-oracle' },
      { name: 'PostgreSQL', level: 'advanced', icon: 'i-simple-icons-postgresql' },
      { name: 'MySQL', level: 'advanced', icon: 'i-simple-icons-mysql' },
      { name: 'MariaDB', level: 'intermediate', icon: 'i-simple-icons-mariadb' },
      { name: 'MS SQL Server', level: 'intermediate', icon: 'i-simple-icons-microsoftsqlserver' },
      { name: 'MongoDB', level: 'intermediate', icon: 'i-simple-icons-mongodb' },
      { name: 'SingleStore', level: 'beginner', icon: 'i-simple-icons-singlestore' },
    ],
  },
  {
    category: 'Operations & HA',
    items: [
      { name: 'Oracle RAC', level: 'expert' },
      { name: 'Data Guard', level: 'expert' },
      { name: 'Backup & Recovery', level: 'expert' },
      { name: 'Performance Tuning', level: 'advanced' },
      { name: 'Patching & Upgrade', level: 'advanced' },
    ],
  },
  {
    category: 'Data Engineering',
    items: [
      { name: 'Apache Spark', level: 'intermediate', icon: 'i-simple-icons-apachespark' },
      { name: 'Hive', level: 'intermediate', icon: 'i-simple-icons-apachehive' },
      { name: 'Python', level: 'intermediate', icon: 'i-simple-icons-python' },
    ],
  },
  {
    category: 'OS & Tools',
    items: [
      { name: 'Linux (RHEL/OL/CentOS)', level: 'advanced', icon: 'i-simple-icons-linux' },
      { name: 'Bash', level: 'advanced', icon: 'i-simple-icons-gnubash' },
      { name: 'Git', level: 'advanced', icon: 'i-simple-icons-git' },
      { name: 'Docker', level: 'intermediate', icon: 'i-simple-icons-docker' },
    ],
  },
]
