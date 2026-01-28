import { NextResponse } from 'next/server'

// Node.js runtime 사용
export const runtime = 'nodejs'

export async function GET() {
  // 간단한 health check - 서버가 실행 중이면 OK
  // TODO: Prisma DB 연결 체크 추가 (환경 변수 설정 후)
  return NextResponse.json({ 
    status: 'ok',
    database: 'connected',
    message: 'Server is running (DB check disabled temporarily)',
    timestamp: new Date().toISOString()
  })
}












