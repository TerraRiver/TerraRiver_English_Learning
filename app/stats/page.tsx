'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

interface StatsData {
  overview: {
    totalWords: number
    dueToday: number
    mastered: number
    totalLapses: number
    avgEaseFactor: number
  }
  statusDistribution: { name: string; value: number; color: string }[]
  intervalDistribution: { label: string; count: number }[]
  tagDistribution: { tag: string; count: number }[]
  monthlyGrowth: { month: string; added: number; cumulative: number }[]
  hardestWords: {
    id: number
    term: string
    lapses: number
    interval: number
    easeFactor: number
    repetitions: number
  }[]
}

const EMPTY_PLACEHOLDER = (
  <div className="h-full flex items-center justify-center text-sm text-gray-400">
    暂无数据
  </div>
)

function SectionCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-50 rounded-2xl p-5 ${className}`}>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">加载失败，请刷新重试</div>
  }

  const { overview, statusDistribution, intervalDistribution, tagDistribution, monthlyGrowth, hardestWords } = data

  const efColor =
    overview.avgEaseFactor >= 2.5 ? 'text-emerald-600' :
    overview.avgEaseFactor >= 2.0 ? 'text-yellow-600' : 'text-red-600'

  const overviewCards = [
    { label: '总词条数',   value: overview.totalWords,                   color: 'text-blue-600',    sub: '已收录' },
    { label: '今日待复习', value: overview.dueToday,                     color: 'text-orange-500',  sub: '个单词' },
    { label: '已掌握',     value: overview.mastered,                     color: 'text-emerald-600', sub: `占 ${overview.totalWords > 0 ? Math.round(overview.mastered / overview.totalWords * 100) : 0}%` },
    { label: '累计遗忘',   value: overview.totalLapses,                  color: overview.totalLapses > 0 ? 'text-orange-500' : 'text-gray-400', sub: '次 Again' },
    { label: '平均难度系数', value: overview.avgEaseFactor.toFixed(2),   color: efColor,            sub: '范围 1.3–5.0' },
  ]

  // 月份标签格式化：2025-10 → 10月
  const formatMonth = (m: string) => m.slice(5) + '月'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">学习统计</h1>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {overviewCards.map((card, i) => (
          <div key={i} className="bg-gray-50 rounded-2xl p-5">
            <div className="text-xs font-medium text-gray-400">{card.label}</div>
            <div className={`text-3xl font-bold mt-1.5 text-gray-900`}>{card.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* 增长趋势 + 状态分布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="词条增长趋势">
          {monthlyGrowth.length === 0 ? EMPTY_PLACEHOLDER : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyGrowth} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v, name) => [v, name === 'cumulative' ? '累计' : '新增'] as [string | number, string]}
                  labelFormatter={(l) => String(l).replace('-', ' 年 ').replace(/-(\d+)$/, ' $1 月')}
                />
                <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2} fill="url(#areaGrad)" name="累计" />
                <Area type="monotone" dataKey="added" stroke="#93c5fd" strokeWidth={1.5} fill="none" strokeDasharray="4 2" name="新增" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="复习状态分布">
          {statusDistribution.length === 0 ? EMPTY_PLACEHOLDER : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [String(v) + " 个", String(name)] as [string, string]} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* 标签分布 */}
      {tagDistribution.length > 0 && (
        <SectionCard title="标签分布">
          <ResponsiveContainer width="100%" height={Math.max(tagDistribution.length * 32, 120)}>
            <BarChart
              data={tagDistribution.slice(0, 12)}
              layout="vertical"
              margin={{ top: 0, right: 40, bottom: 0, left: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="tag" tick={{ fontSize: 12 }} width={72} />
              <Tooltip formatter={(v) => [String(v) + " 个词", "数量"] as [string, string]} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#6b7280' }} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* 间隔分布 + 最难词条 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="复习间隔分布">
          {intervalDistribution.every(d => d.count === 0) ? EMPTY_PLACEHOLDER : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={intervalDistribution} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [String(v) + " 个词", "数量"] as [string, string]} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#6b7280' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="遗忘次数排行">
          {hardestWords.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">暂无遗忘记录</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {hardestWords.map((w, i) => (
                <Link
                  key={w.id}
                  href={`/word/${w.id}`}
                  className="flex items-center justify-between py-2 hover:bg-white rounded-lg px-1 -mx-1 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-400 w-4 shrink-0 text-right">{i + 1}</span>
                    <span className="text-sm font-medium text-gray-800 truncate">{w.term}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0 ml-2">
                    <span className="text-orange-600 font-semibold">遗忘 {w.lapses} 次</span>
                    <span className="text-gray-400">EF {w.easeFactor}</span>
                    <span className="text-gray-400">{w.interval}天</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
