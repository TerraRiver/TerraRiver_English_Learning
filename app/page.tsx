'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardData {
  totalWords: number
  dueForReview: number
  recentWords: Array<{
    id: number
    term: string
    definition: string
    createdAt: string
  }>
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => { setData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">单词本</h1>
        <p className="mt-2 text-gray-500">个人英语词汇知识库</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">总词条数</div>
          <div className="mt-2 text-4xl font-bold text-gray-900">{data?.totalWords || 0}</div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">今日待复习</div>
          <div className="mt-2 text-4xl font-bold text-gray-900">{data?.dueForReview || 0}</div>
          {(data?.dueForReview ?? 0) > 0 && (
            <Link href="/review" className="mt-3 inline-block text-sm text-gray-500 hover:text-gray-900 transition-colors">
              开始复习 →
            </Link>
          )}
        </div>

        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">快速操作</div>
          <div className="mt-3 space-y-2">
            <Link href="/word/new" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">
              + 添加新词条
            </Link>
            <Link href="/dictionary" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">
              浏览词典
            </Link>
          </div>
        </div>
      </div>

      {/* 最近添加的词条 */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">最近添加</h2>
        <div className="divide-y divide-gray-100">
          {data?.recentWords && data.recentWords.length > 0 ? (
            data.recentWords.map((word) => (
              <Link
                key={word.id}
                href={`/word/${word.id}`}
                className="flex justify-between items-start py-4 -mx-4 px-4 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">{word.term}</div>
                  <div className="mt-0.5 text-sm text-gray-500 line-clamp-1">{word.definition}</div>
                </div>
                <div className="text-xs text-gray-400 ml-4 shrink-0 pt-0.5">
                  {new Date(word.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </Link>
            ))
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">
              还没有词条，
              <Link href="/word/new" className="text-gray-600 hover:text-gray-900 underline">
                添加第一个词条
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
