export type OwnerInfo = {
  name: string
  role: string
  jobTitle: string
  company: string
  tagline: string
  intro: string
  email: string
  location: string
  /** Areas of expertise — used for Person schema knowsAbout. */
  expertise: string[]
  /** Canonical profile URLs for Person schema sameAs. Bare/placeholder links excluded. */
  sameAs: string[]
  socials: { label: string; href: string; icon: string }[]
}

export const useOwner = (): OwnerInfo => ({
  name: 'Teguh Prasetyo',
  role: 'Database Engineer & Enterprise Solutions Consultant',
  jobTitle: 'Technical Consultant — Database',
  company: 'PT Yasatech Sinergi Inspirasi',
  tagline: 'Turning data into reliable, scalable systems.',
  intro:
    "I've spent 7+ years keeping enterprise databases fast, safe, and recoverable — from Oracle RAC clusters to data center migrations and Spark-driven analytics pipelines.",
  email: 'teguhpraz715@gmail.com',
  location: 'Jakarta, Indonesia',
  expertise: [
    'Oracle Database',
    'Database Administration',
    'High Availability',
    'Oracle RAC',
    'Data Guard',
    'Database Migration',
    'Performance Tuning',
  ],
  sameAs: [
    'https://github.com/Praz-715',
  ],
  socials: [
    { label: 'GitHub', href: 'https://github.com/Praz-715', icon: 'i-simple-icons-github' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/', icon: 'i-simple-icons-linkedin' },
    { label: 'Email', href: 'mailto:teguhpraz715@gmail.com', icon: 'i-lucide-mail' },
  ],
})
