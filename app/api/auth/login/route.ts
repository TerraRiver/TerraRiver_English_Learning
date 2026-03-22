import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({}))

  const expected = process.env.ACCESS_PASSWORD
  if (!expected || !password || password !== expected) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 })
  }

  // 与 middleware 相同的哈希算法
  const token = crypto.createHash('sha256').update('lexicon:' + password).digest('hex')

  const response = NextResponse.json({ ok: true })
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 天
    path: '/',
  })
  return response
}
