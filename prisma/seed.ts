import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

function createPrismaClient() {
  if (process.env.DATABASE_AUTH_TOKEN) {
    const libsql = createClient({
      url: process.env.DATABASE_URL!,
      authToken: process.env.DATABASE_AUTH_TOKEN!,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter })
  }

  return new PrismaClient()
}

const prisma = createPrismaClient()

async function main() {
  console.log('Seeding database...')

  // Buat akun admin default
  await prisma.adminAccount.upsert({
    where: { id: 'admin' },
    update: {},
    create: {
      id: 'admin',
      username: 'admin',
      password: 'admin123',
      displayName: 'Administrator',
    },
  })
  console.log('✅ Admin account created')

  // Buat settings sekolah default
  await prisma.schoolSettings.upsert({
    where: { id: 'school' },
    update: {},
    create: {
      id: 'school',
      name: 'SMA Nusantara',
      npsn: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      accreditation: '',
      logo: '',
    },
  })
  console.log('✅ School settings created')

  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
