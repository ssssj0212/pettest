import { PrismaClient } from '@prisma/client'

// PrismaClient는 싱글톤으로 관리
// Next.js 개발 모드에서 Hot Reload 시 여러 인스턴스가 생성되는 것을 방지

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
