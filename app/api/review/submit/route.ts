import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateSM2, ReviewQuality } from '@/lib/sm2'

// POST /api/review/submit - 提交复习反馈
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wordId, quality } = body

    if (!wordId || !quality) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    if (!['again', 'hard', 'good', 'easy'].includes(quality)) {
      return NextResponse.json({ error: '无效的质量评级' }, { status: 400 })
    }

    const progress = await prisma.reviewProgress.findUnique({
      where: { wordId: parseInt(wordId) },
    }) as (Awaited<ReturnType<typeof prisma.reviewProgress.findUnique>> & { lapses: number }) | null

    if (!progress) {
      return NextResponse.json({ error: '复习进度不存在' }, { status: 404 })
    }

    const sm2Result = calculateSM2(
      quality as ReviewQuality,
      progress.repetitions,
      progress.easeFactor,
      progress.interval,
      progress.lapses
    )

    const updatedProgress = await prisma.reviewProgress.update({
      where: { wordId: parseInt(wordId) },
      data: {
        nextReview: sm2Result.nextReview,
        interval: sm2Result.interval,
        easeFactor: sm2Result.easeFactor,
        repetitions: sm2Result.repetitions,
        lapses: sm2Result.lapses,
        lastReviewed: new Date(),
      } as Parameters<typeof prisma.reviewProgress.update>[0]['data'],
    })

    return NextResponse.json({
      message: '复习记录已保存',
      progress: updatedProgress,
      nextReviewDays: sm2Result.interval,
    })
  } catch (error) {
    console.error('提交复习失败:', error)
    return NextResponse.json({ error: '提交复习失败' }, { status: 500 })
  }
}
