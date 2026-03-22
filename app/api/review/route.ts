import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isDueForReview } from '@/lib/sm2'

// GET /api/review - 获取今日待复习的单词
export async function GET(request: NextRequest) {
  try {
    const allWords = await prisma.word.findMany({
      include: {
        examples: true,
        progress: true,
      },
    })

    // 筛选出今天需要复习的单词
    const dueWords = allWords.filter((word) => {
      if (!word.progress) return true // 没有复习记录的单词也需要复习
      return isDueForReview(word.progress.nextReview)
    })

    return NextResponse.json({
      total: dueWords.length,
      words: dueWords,
    })
  } catch (error) {
    console.error('获取复习列表失败:', error)
    return NextResponse.json(
      { error: '获取复习列表失败' },
      { status: 500 }
    )
  }
}
