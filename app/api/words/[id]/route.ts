import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/words/[id] - 获取单个词条详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const word = await prisma.word.findUnique({
      where: { id: parseInt(id) },
      include: {
        examples: true,
        progress: true,
      },
    })

    if (!word) {
      return NextResponse.json(
        { error: '词条不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(word)
  } catch (error) {
    console.error('获取词条失败:', error)
    return NextResponse.json(
      { error: '获取词条失败' },
      { status: 500 }
    )
  }
}

// PUT /api/words/[id] - 更新词条
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { term, phonetic, partOfSpeech, definition, variants, tags, examples } = body

    // 先删除旧例句，再创建新例句
    await prisma.example.deleteMany({
      where: { wordId: parseInt(id) },
    })

    const word = await prisma.word.update({
      where: { id: parseInt(id) },
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
      } as Parameters<typeof prisma.word.update>[0]['data'],
      include: {
        examples: true,
        progress: true,
      },
    })

    return NextResponse.json(word)
  } catch (error: any) {
    console.error('更新词条失败:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '词条不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: '更新词条失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/words/[id] - 删除词条
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.word.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error: any) {
    console.error('删除词条失败:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '词条不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: '删除词条失败' },
      { status: 500 }
    )
  }
}
