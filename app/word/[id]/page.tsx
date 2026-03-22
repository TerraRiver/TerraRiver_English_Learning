'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SpeakButton from '@/app/components/SpeakButton'

interface Word {
  id: number
  term: string
  phonetic?: string
  partOfSpeech?: string
  definition: string
  variants?: string
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
    lapses: number
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
    if (resolvedParams) fetchWord()
  }, [resolvedParams])

  const fetchWord = async () => {
    if (!resolvedParams) return
    const response = await fetch(`/api/words/${resolvedParams.id}`)
    if (response.ok) setWord(await response.json())
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个词条吗？')) return
    if (!resolvedParams) return
    setDeleting(true)
    const response = await fetch(`/api/words/${resolvedParams.id}`, { method: 'DELETE' })
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
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    )
  }

  if (!word) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">词条不存在</div>
        <button onClick={() => router.push('/dictionary')} className="mt-4 text-sm text-gray-600 hover:text-gray-900 underline">
          返回词典
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* 操作栏 */}
      <div className="flex justify-between items-center">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
          ← 返回
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/word/${resolvedParams?.id}/edit`)}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            编辑
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
          >
            {deleting ? '删除中...' : '删除词条'}
          </button>
        </div>
      </div>

      {/* 词头 */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">{word.term}</h1>
          <SpeakButton text={word.term} className="text-gray-400 hover:text-gray-700" />
        </div>
        {word.phonetic && (
          <p className="text-lg text-gray-400 font-mono">{word.phonetic}</p>
        )}
        {word.partOfSpeech && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {word.partOfSpeech.split(',').map((pos, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md italic">
                {pos.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 标签 */}
      {word.tags && (
        <div className="flex flex-wrap gap-1.5">
          {word.tags.split(',').map((tag, i) => (
            <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* 变体 */}
      {word.variants && (
        <div className="flex flex-wrap gap-1.5">
          {word.variants.split(',').map((v, i) => (
            <span key={i} className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs rounded-lg font-mono">
              {v.trim()}
            </span>
          ))}
        </div>
      )}

      {/* 释义 */}
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">释义</div>
        <p className="text-lg text-gray-800 leading-relaxed">{word.definition}</p>
      </div>

      {/* 例句 */}
      {word.examples.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">例句</div>
          <div className="space-y-4">
            {word.examples.map((example) => (
              <div key={example.id} className="pl-4 border-l-2 border-gray-200">
                <div className="flex items-start gap-2">
                  <p className="text-gray-700 flex-1 italic leading-relaxed">{example.sentenceEn}</p>
                  <SpeakButton text={example.sentenceEn} className="text-gray-300 hover:text-gray-600 flex-shrink-0 mt-0.5" />
                </div>
                {example.sentenceCn && (
                  <p className="text-gray-500 text-sm mt-1">{example.sentenceCn}</p>
                )}
                {example.source && (
                  <p className="text-gray-400 text-xs mt-1">来源: {example.source}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 复习进度 */}
      {word.progress && (
        <div className="pt-6 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">复习进度</div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">下次复习</div>
              <div className="text-sm font-semibold text-gray-900">
                {new Date(word.progress.nextReview).toLocaleDateString('zh-CN')}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">间隔天数</div>
              <div className="text-sm font-semibold text-gray-900">{word.progress.interval} 天</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">复习次数</div>
              <div className="text-sm font-semibold text-gray-900">{word.progress.repetitions} 次</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">遗忘次数</div>
              <div className={`text-sm font-semibold ${word.progress.lapses > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                {word.progress.lapses} 次
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
