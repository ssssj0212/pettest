import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

// 토큰 가져오기 (서버 사이드)
function getTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export async function GET(request: Request) {
  try {
    const token = getTokenFromHeaders(request.headers)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // admin/users 엔드포인트 사용 (일반적으로 관리자 전용)
    const res = await fetch(`${BACKEND_URL}/admin/users`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: `Backend error: ${res.status}` }))
      return NextResponse.json(
        { error: error.detail || 'Failed to fetch users' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: 500 }
    )
  }
}












