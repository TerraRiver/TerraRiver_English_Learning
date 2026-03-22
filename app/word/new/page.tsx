'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ExampleListEditable, { ExampleItem } from '@/app/components/ExampleListEditable'

export default function NewWordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    term: '',
    phonetic: '',
    definition: '',
    tags: '',
  })

  const [examples, setExamples] = useState<ExampleItem[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          examples: examples.filter((ex) => ex.sentenceEn.trim() !== ''),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建失败')
      }

      router.push(`/word/${data.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">添加新词条</h1>
        <p className="mt-1 text-sm text-gray-600">
          填写单词信息和相关例句
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 单词 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              单词/短语 *
            </label>
            <input
              type="text"
              value={formData.term}
              onChange={(e) => setFormData({ ...formData, term: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., hegemony"
              required
            />
          </div>

          {/* 音标 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音标 (Phonetic)
            </label>
            <input
              type="text"
              value={formData.phonetic}
              onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., /hɪˈɡeməni/"
            />
          </div>

          {/* 释义 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              释义 *
            </label>
            <textarea
              value={formData.definition}
              onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="输入单词的主要释义..."
              required
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签 (Tags)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="用逗号分隔，如: IR,Realism,Politics"
            />
            <p className="mt-1 text-xs text-gray-500">
              使用逗号分隔多个标签
            </p>
          </div>

          {/* 例句 */}
          <ExampleListEditable examples={examples} onChange={setExamples} />
        </div>

        {/* 按钮 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '创建中...' : '创建词条'}
          </button>
        </div>
      </form>
    </div>
  )
}
