import { createClient } from '@libsql/client'

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    console.log('⏭️  TURSO_DATABASE_URL not set, skipping Turso seed')
    return
  }

  console.log('🔌 Connecting to Turso...')
  const client = createClient({ url, authToken: token || '' })

  // Create tables
  console.log('📦 Creating tables...')

  await client.execute(`
    CREATE TABLE IF NOT EXISTS AdminAccount (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      displayName TEXT NOT NULL
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS SchoolSettings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      npsn TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      accreditation TEXT NOT NULL DEFAULT '',
      logo TEXT NOT NULL DEFAULT ''
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS Angkatan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL UNIQUE
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS Kelas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS Mapel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      semester INTEGER NOT NULL
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS Siswa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nisn TEXT NOT NULL,
      kelasId INTEGER NOT NULL,
      jk TEXT NOT NULL DEFAULT 'L',
      angkatanId INTEGER NOT NULL,
      birthDate TEXT NOT NULL DEFAULT '',
      birthPlace TEXT NOT NULL DEFAULT '',
      cita TEXT NOT NULL DEFAULT '',
      kataMutiara TEXT NOT NULL DEFAULT '',
      foto TEXT NOT NULL DEFAULT ''
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS Nilai (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      siswaId INTEGER NOT NULL,
      mapelId INTEGER NOT NULL,
      value INTEGER NOT NULL DEFAULT 0
    )
  `)

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS Nilai_siswaId_mapelId_key ON Nilai(siswaId, mapelId)
  `)

  console.log('✅ Tables created')

  // Seed data
  console.log('🌱 Seeding data...')

  await client.execute({
    sql: "INSERT OR IGNORE INTO AdminAccount (id, username, password, displayName) VALUES (?, ?, ?, ?)",
    args: ['admin', 'admin', 'admin123', 'Administrator']
  })

  await client.execute({
    sql: "INSERT OR IGNORE INTO SchoolSettings (id, name, npsn, address, city, phone, email, accreditation, logo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: ['school', 'SMA Nusantara', '', '', '', '', '', '', '']
  })

  console.log('✅ Admin account seeded')
  console.log('✅ School settings seeded')
  console.log('🎉 Turso seed completed!')

  await client.close()
}

main().catch((e) => {
  console.error('❌ Seed error:', e)
  process.exit(1)
})
