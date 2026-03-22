import { NextRequest, NextResponse } from 'next/server'

// 用 Web Crypto API（Edge runtime 兼容）计算 token
async function computeToken(password: string): Promise<string> {
  const data = new TextEncoder().encode('lexicon:' + password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 放行：登录页、认证 API、静态资源
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const password = process.env.ACCESS_PASSWORD
  if (!password) {
    // 未配置密码时放行（方便开发调试）
    return NextResponse.next()
  }

  const cookieToken = request.cookies.get('auth-token')?.value
  const expectedToken = await computeToken(password)

  if (!cookieToken || cookieToken !== expectedToken) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
