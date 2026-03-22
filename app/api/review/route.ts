import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isDueForReview } from '@/lib/sm2'

// GET /api/review - 按紧迫度排序返回全部词（最过期的在前，未到期的在后）
export async function GET() {
  try {
    const allWords = await prisma.word.findMany({
      include: {
        examples: true,
        progress: true,
      },
    })

    // 排序：无复习记录（新词）优先，之后按 nextReview 升序（最过期→最晚到期）
    allWords.sort((a, b) => {
      if (!a.progress && !b.progress) return 0
      if (!a.progress) return -1
      if (!b.progress) return 1
      return new Date(a.progress.nextReview).getTime() - new Date(b.progress.nextReview).getTime()
    })

    const dueCount = allWords.filter(
      (w) => !w.progress || isDueForReview(w.progress.nextReview)
    ).length

    return NextResponse.json({ total: allWords.length, dueCount, words: allWords })
  } catch (error) {
    console.error('获取复习列表失败:', error)
    return NextResponse.json({ error: '获取复习列表失败' }, { status: 500 })
  }
}


