import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

export async function GET() {
  try {
    // FastAPI 백엔드로 health check 프록시
    const res = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`Backend health check failed: ${res.status}`)
    }

    const data = await res.json()
    
    return NextResponse.json({ 
      status: 'ok',
      database: 'connected',
      backend: data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}












