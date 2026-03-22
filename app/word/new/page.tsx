'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ExampleListEditable, { ExampleItem } from '@/app/components/ExampleListEditable'

export default function NewWordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiError, setAiError] = useState('')

  const [formData, setFormData] = useState({
    term: '',
    phonetic: '',
    partOfSpeech: '',
    definition: '',
    variants: '',
    tags: '',
  })

  const [examples, setExamples] = useState<ExampleItem[]>([])
  const [duplicateWord, setDuplicateWord] = useState<{ id: number; term: string } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 防抖检测重复词条
  useEffect(() => {
    const term = formData.term.trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!term) {
      setDuplicateWord(null)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/words?exact=${encodeURIComponent(term)}`)
        if (!res.ok) return
        const words: Array<{ id: number; term: string }> = await res.json()
        setDuplicateWord(words[0] ?? null)
      } catch {
        // 检测失败时静默忽略，不影响正常录入
      }
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [formData.term])

  const handleAiGenerate = async () => {
    if (!formData.term.trim()) {
      setAiError('请先填写单词/短语')
      return
    }
    setAiLoading(true)
    setAiError('')

    try {
      const response = await fetch('/api/ai/generate-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: formData.term.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'AI 生成失败')
      }

      setFormData((prev) => ({
        ...prev,
        phonetic: data.phonetic || prev.phonetic,
        partOfSpeech: data.partOfSpeech || prev.partOfSpeech,
        definition: data.definition || prev.definition,
        variants: data.variants || prev.variants,
        tags: data.tags || prev.tags,
      }))

      if (data.examples?.length > 0) {
        setExamples(data.examples)
      }
    } catch (err: any) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">添加新词条</h1>
        <p className="mt-1 text-sm text-gray-500">填写单词信息和相关例句</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        {error && (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* 单词 + AI 生成按钮 */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            单词 / 短语 *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.term}
              onChange={(e) => setFormData({ ...formData, term: e.target.value })}
              className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
              placeholder="e.g., hegemony"
              required
            />
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiLoading || !formData.term.trim()}
              className="px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-40 whitespace-nowrap flex items-center gap-1.5 text-sm font-medium transition-colors"
              title="使用 AI 自动填充"
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  生成中...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI 生成
                </>
              )}
            </button>
          </div>
          {aiError && <p className="mt-1.5 text-xs text-red-500">{aiError}</p>}
          {duplicateWord && (
            <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>词条已存在：</span>
              <a href={`/word/${duplicateWord.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-amber-900">
                {duplicateWord.term}
              </a>
              <span className="text-amber-600">→ 点击查看</span>
            </div>
          )}
        </div>

        {/* 音标 */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            音标 (Phonetic)
          </label>
          <input
            type="text"
            value={formData.phonetic}
            onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
            placeholder="e.g., /hɪˈɡeməni/"
          />
        </div>

        {/* 词性 */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            词性 (Part of Speech)
          </label>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {['noun', 'verb', 'adjective', 'adverb', 'phrase', 'abbreviation', 'other'].map((pos) => {
              const checked = formData.partOfSpeech.split(',').map(s => s.trim()).includes(pos)
              return (
                <label key={pos} className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = formData.partOfSpeech.split(',').map(s => s.trim()).filter(Boolean)
                      const updated = e.target.checked
                        ? [...current, pos]
                        : current.filter(p => p !== pos)
                      setFormData({ ...formData, partOfSpeech: updated.join(', ') })
                    }}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="italic">{pos}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* 单词变体 */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            单词变体 (Variants)
          </label>
          <input
            type="text"
            value={formData.variants}
            onChange={(e) => setFormData({ ...formData, variants: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
            placeholder="e.g., hegemonies (pl.), hegemonic (adj.)"
          />
          <p className="mt-1.5 text-xs text-gray-400">用逗号分隔，如：dominated (past tense), dominating (pres. part.)</p>
        </div>

        {/* 释义 */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            释义 *
          </label>
          <textarea
            value={formData.definition}
            onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
            rows={3}
            placeholder="输入单词的主要释义..."
            required
          />
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            标签 (Tags)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
            placeholder="用逗号分隔，如: 四级,通用"
          />
        </div>

        {/* 例句 */}
        <ExampleListEditable examples={examples} onChange={setExamples} />

        {/* 按钮 */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || !!duplicateWord}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {loading ? '创建中...' : '创建词条'}
          </button>
        </div>
      </form>
    </div>
  )
}
