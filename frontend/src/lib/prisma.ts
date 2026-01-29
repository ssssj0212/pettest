import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// PrismaClient는 싱글톤으로 관리
// Next.js 개발 모드에서 Hot Reload 시 여러 인스턴스가 생성되는 것을 방지

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  // ✅ Pool 인스턴스를 만들지 말고
  // ✅ PrismaNeon에 config 객체를 바로 전달
  const adapter = new PrismaNeon({
    connectionString: databaseUrl,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
