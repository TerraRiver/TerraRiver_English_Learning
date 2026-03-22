'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SpeakButton from '@/app/components/SpeakButton'

interface Word {
  id: number
  term: string
  phonetic?: string
  definition: string
  tags?: string
  examples: Array<{
    id: number
    sentenceEn: string
    sentenceCn?: string
    source?: string
  }>
  progress?: {
    nextReview: string
    interval: number
    repetitions: number
  }
}

export default function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [word, setWord] = useState<Word | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (resolvedParams) {
      fetchWord()
    }
  }, [resolvedParams])

  const fetchWord = async () => {
    if (!resolvedParams) return

    const response = await fetch(`/api/words/${resolvedParams.id}`)
    if (response.ok) {
      const data = await response.json()
      setWord(data)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个词条吗？')) return
    if (!resolvedParams) return

    setDeleting(true)
    const response = await fetch(`/api/words/${resolvedParams.id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      router.push('/dictionary')
    } else {
      alert('删除失败')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!word) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">词条不存在</div>
        <button
          onClick={() => router.push('/dictionary')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          返回词典
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          ← 返回
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md border border-red-200 disabled:opacity-50"
          >
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>

      {/* 词条主体 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* 单词和音标 */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl font-bold text-gray-900">{word.term}</h1>
          <SpeakButton text={word.term} className="text-blue-600" />
        </div>

        {word.phonetic && (
          <div className="text-lg text-gray-600 mb-4">{word.phonetic}</div>
        )}

        {/* 标签 */}
        {word.tags && (
          <div className="flex flex-wrap gap-2 mb-6">
            {word.tags.split(',').map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* 释义 */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            释义 (Definition)
          </h2>
          <p className="text-lg text-gray-800 leading-relaxed">{word.definition}</p>
        </div>

        {/* 例句 */}
        {word.examples.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              例句 (Examples)
            </h2>
            <div className="space-y-4">
              {word.examples.map((example) => (
                <div
                  key={example.id}
                  className="pl-4 border-l-4 border-blue-200 py-2"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <p className="text-gray-800 flex-1 italic">{example.sentenceEn}</p>
                    <SpeakButton
                      text={example.sentenceEn}
                      className="text-gray-400 hover:text-blue-600 flex-shrink-0"
                    />
                  </div>
                  {example.sentenceCn && (
                    <p className="text-gray-600 text-sm">{example.sentenceCn}</p>
                  )}
                  {example.source && (
                    <p className="text-gray-400 text-xs mt-1">
                      来源: {example.source}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 复习进度 */}
        {word.progress && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              复习进度
            </h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">下次复习</div>
                <div className="font-medium text-gray-900">
                  {new Date(word.progress.nextReview).toLocaleDateString('zh-CN')}
                </div>
              </div>
              <div>
                <div className="text-gray-600">间隔天数</div>
                <div className="font-medium text-gray-900">
                  {word.progress.interval} 天
                </div>
              </div>
              <div>
                <div className="text-gray-600">复习次数</div>
                <div className="font-medium text-gray-900">
                  {word.progress.repetitions} 次
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
