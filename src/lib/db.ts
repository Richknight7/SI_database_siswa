import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Jika ada DATABASE_AUTH_TOKEN, berarti pakai Turso (cloud)
  if (process.env.DATABASE_AUTH_TOKEN) {
    const libsql = createClient({
      url: process.env.DATABASE_URL!,
      authToken: process.env.DATABASE_AUTH_TOKEN!,
    })

    const adapter = new PrismaLibSQL(libsql)

    return new PrismaClient({
      adapter,
    })
  }

  // Jika tidak ada token, pakai SQLite lokal (development)
  return new PrismaClient({
    log: ['query'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
