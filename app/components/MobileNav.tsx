'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: '首页' },
  { href: '/dictionary', label: '词典' },
  { href: '/review', label: '复习' },
  { href: '/stats', label: '统计' },
  { href: '/word/new', label: '添加词条' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
        aria-label="菜单"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-100 shadow-sm z-50">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-4 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="block w-full text-left px-6 py-4 text-sm text-gray-400 hover:bg-gray-50 active:bg-gray-100"
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}
