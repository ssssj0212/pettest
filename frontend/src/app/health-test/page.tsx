'use client'

import { useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { getSession } from 'next-auth/react'

export default function HealthTestPage() {
  useEffect(() => {
    getSession().then((s) => console.log('SESSION DEBUG:', s))

    apiFetch('/admin/dashboard')
      .then((res) => res.json())
      .then((data) => console.log('DASHBOARD:', data))
      .catch((err) => console.error('DASHBOARD ERROR:', err))
  }, [])

  return <div style={{ padding: 20 }}>ADMIN DASHBOARD TEST (check console)</div>
}
