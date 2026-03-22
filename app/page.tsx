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
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('获取仪表盘数据失败:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          IR 英语学术知识库
        </h1>
        <p className="mt-2 text-gray-600">
          专注于国际关系领域的个人英语学习工具
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">总词条数</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {data?.totalWords || 0}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">今日待复习</div>
          <div className="mt-2 text-3xl font-bold text-orange-600">
            {data?.dueForReview || 0}
          </div>
          {(data?.dueForReview ?? 0) > 0 && (
            <Link
              href="/review"
              className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800"
            >
              开始复习 →
            </Link>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">快速操作</div>
          <div className="mt-3 space-y-2">
            <Link
              href="/word/new"
              className="block text-sm text-blue-600 hover:text-blue-800"
            >
              + 添加新词条
            </Link>
            <Link
              href="/dictionary"
              className="block text-sm text-blue-600 hover:text-blue-800"
            >
              浏览词典
            </Link>
          </div>
        </div>
      </div>

      {/* 最近添加的词条 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">最近添加</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {data?.recentWords && data.recentWords.length > 0 ? (
            data.recentWords.map((word) => (
              <Link
                key={word.id}
                href={`/word/${word.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{word.term}</div>
                    <div className="mt-1 text-sm text-gray-600 line-clamp-1">
                      {word.definition}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(word.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              还没有词条，
              <Link href="/word/new" className="text-blue-600 hover:text-blue-800">
                添加第一个词条
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
