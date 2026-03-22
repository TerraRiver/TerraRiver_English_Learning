import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isDueForReview } from '@/lib/sm2'

// GET /api/dashboard - 获取仪表盘数据
export async function GET(request: NextRequest) {
  try {
    // 获取所有词条
    const allWords = await prisma.word.findMany({
      include: {
        progress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 计算今日待复习数量
    const dueForReview = allWords.filter((word) => {
      if (!word.progress) return true
      return isDueForReview(word.progress.nextReview)
    }).length

    // 获取最近添加的5个词条
    const recentWords = allWords.slice(0, 5)

    // 统计信息
    const stats = {
      totalWords: allWords.length,
      dueForReview,
      recentWords,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    return NextResponse.json(
      { error: '获取仪表盘数据失败' },
      { status: 500 }
    )
  }
}
