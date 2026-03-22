'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
    >
      退出
    </button>
  )
}
