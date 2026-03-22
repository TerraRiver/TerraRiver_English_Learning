import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/words - 获取所有词条（支持搜索和筛选）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const letter = searchParams.get('letter') || ''
    const exact = searchParams.get('exact') || ''

    // 精确词名匹配（仅用于重复检测，返回轻量数据）
    if (exact) {
      const results = await prisma.$queryRaw<Array<{ id: number; term: string }>>`
        SELECT id, term FROM "Word" WHERE LOWER(term) = LOWER(${exact}) LIMIT 1
      `
      return NextResponse.json(results)
    }

    const where: any = {}

    // 搜索词条
    if (search) {
      where.OR = [
        { term: { contains: search, mode: 'insensitive' } },
        { definition: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 按首字母筛选
    if (letter) {
      where.term = { startsWith: letter, mode: 'insensitive' }
    }

    const words = await prisma.word.findMany({
      where,
      include: {
        examples: true,
        progress: true,
      },
      orderBy: {
        term: 'asc',
      },
    })

    return NextResponse.json(words)
  } catch (error) {
    console.error('获取词条失败:', error)
    return NextResponse.json(
      { error: '获取词条失败' },
      { status: 500 }
    )
  }
}

// POST /api/words - 创建新词条
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { term, phonetic, partOfSpeech, definition, variants, tags, examples } = body

    // 验证必填字段
    if (!term || !definition) {
      return NextResponse.json(
        { error: '单词和释义为必填项' },
        { status: 400 }
      )
    }

    // 创建词条及其例句
    const word = await prisma.word.create({
      data: {
        term,
        phonetic,
        partOfSpeech,
        definition,
        variants,
        tags,
        examples: {
          create: examples || [],
        },
        progress: {
          create: {
            nextReview: new Date(),
            interval: 0,
            easeFactor: 2.5,
            repetitions: 0,
          },
        },
      } as Parameters<typeof prisma.word.create>[0]['data'],
      include: {
        examples: true,
        progress: true,
      },
    })

    return NextResponse.json(word, { status: 201 })
  } catch (error: any) {
    console.error('创建词条失败:', error)

    // 处理唯一性约束错误
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '该单词已存在' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: '创建词条失败' },
      { status: 500 }
    )
  }
}
