import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isDueForReview } from '@/lib/sm2'

// Prisma client not yet regenerated after migration — augment the type locally
type Progress = Awaited<ReturnType<typeof prisma.reviewProgress.findUnique>> & { lapses: number }

export async function GET() {
  try {
    const words = await prisma.word.findMany({
      include: { progress: true },
      orderBy: { createdAt: 'asc' },
    }) as (Awaited<ReturnType<typeof prisma.word.findMany>>[number] & { progress: Progress | null })[]

    const totalWords = words.length
    let neverReviewed = 0, learning = 0, reviewing = 0, mastered = 0
    let efSum = 0, efCount = 0, dueToday = 0, totalLapses = 0

    for (const word of words) {
      if (!word.progress) {
        neverReviewed++
        dueToday++
        continue
      }
      const p = word.progress
      efSum += p.easeFactor
      efCount++
      totalLapses += p.lapses
      if (isDueForReview(p.nextReview)) dueToday++

      if (p.repetitions <= 2) learning++
      else if (p.interval <= 21) reviewing++
      else mastered++
    }

    // 复习状态分布（用于 PieChart）
    const statusDistribution = [
      { name: '新词',   value: neverReviewed, color: '#9ca3af' },
      { name: '学习中', value: learning,      color: '#60a5fa' },
      { name: '复习中', value: reviewing,     color: '#34d399' },
      { name: '已掌握', value: mastered,      color: '#059669' },
    ].filter(s => s.value > 0)

    // 复习间隔分布（用于 BarChart）
    const buckets = [
      { label: '1天',     min: 0,  max: 1   },
      { label: '2-7天',   min: 2,  max: 7   },
      { label: '8-30天',  min: 8,  max: 30  },
      { label: '31-90天', min: 31, max: 90  },
      { label: '90天+',   min: 91, max: Infinity },
    ]
    const intervalDistribution = buckets.map(b => ({
      label: b.label,
      count: words.filter(w => w.progress && w.progress.interval >= b.min && w.progress.interval <= b.max).length,
    }))

    // 标签分布（用于水平 BarChart）
    const tagCounts: Record<string, number> = {}
    for (const word of words) {
      if (!word.tags) continue
      word.tags.split(',').forEach(t => {
        const tag = t.trim()
        if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    }
    const tagDistribution = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)

    // 月度增长（用于 AreaChart）
    const monthMap: Record<string, number> = {}
    for (const word of words) {
      const month = word.createdAt.toISOString().slice(0, 7)
      monthMap[month] = (monthMap[month] || 0) + 1
    }
    let cumulative = 0
    const monthlyGrowth = Object.keys(monthMap).sort().map(month => {
      cumulative += monthMap[month]
      return { month, added: monthMap[month], cumulative }
    })

    // 遗忘次数排行（lapses > 0，降序取前 8）
    const hardestWords = words
      .filter(w => w.progress && w.progress.lapses > 0)
      .sort((a, b) => b.progress!.lapses - a.progress!.lapses)
      .slice(0, 8)
      .map(w => ({
        id: w.id,
        term: w.term,
        lapses: w.progress!.lapses,
        interval: w.progress!.interval,
        easeFactor: Math.round(w.progress!.easeFactor * 100) / 100,
        repetitions: w.progress!.repetitions,
      }))

    return NextResponse.json({
      overview: {
        totalWords,
        dueToday,
        mastered,
        totalLapses,
        avgEaseFactor: efCount > 0 ? Math.round(efSum / efCount * 100) / 100 : 0,
      },
      statusDistribution,
      intervalDistribution,
      tagDistribution,
      monthlyGrowth,
      hardestWords,
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 })
  }
}
