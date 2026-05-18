'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPlanosRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/agenda/planos')
  }, [router])
  return null
}
