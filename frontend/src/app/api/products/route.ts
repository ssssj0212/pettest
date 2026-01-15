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

    const res = await fetch(`${BACKEND_URL}/products`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: `Backend error: ${res.status}` }))
      return NextResponse.json(
        { error: error.detail || 'Failed to fetch products' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 }
    )
  }
}












