import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
