'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ExampleListEditable, { ExampleItem } from '@/app/components/ExampleListEditable'

export default function EditWordPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    term: '',
    phonetic: '',
    partOfSpeech: '',
    definition: '',
    variants: '',
    tags: '',
  })
  const [examples, setExamples] = useState<ExampleItem[]>([])

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/words/${id}`)
      .then((r) => r.json())
      .then((word) => {
        setFormData({
          term: word.term ?? '',
          phonetic: word.phonetic ?? '',
          partOfSpeech: word.partOfSpeech ?? '',
          definition: word.definition ?? '',
          variants: word.variants ?? '',
          tags: word.tags ?? '',
        })
        setExamples(
          (word.examples ?? []).map((ex: { sentenceEn: string; sentenceCn?: string; source?: string }) => ({
            sentenceEn: ex.sentenceEn,
            sentenceCn: ex.sentenceCn ?? '',
            source: ex.source ?? '',
          }))
        )
        setLoading(false)
      })
      .catch(() => {
        setError('加载词条失败')
        setLoading(false)
      })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/words/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          examples: examples.filter((ex) => ex.sentenceEn.trim() !== ''),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '保存失败')

      router.push(`/word/${id}`)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">编辑词条</h1>
        <p className="mt-1 text-sm text-gray-500">{formData.term}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        {error && (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* 单词 */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            单词 / 短语 *
          </label>
          <input
            type="text"
            value={formData.term}
            onChange={(e) => setFormData({ ...formData, term: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
            required
          />
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
              const checked = formData.partOfSpeech.split(',').map((s) => s.trim()).includes(pos)
              return (
                <label key={pos} className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = formData.partOfSpeech.split(',').map((s) => s.trim()).filter(Boolean)
                      const updated = e.target.checked
                        ? [...current, pos]
                        : current.filter((p) => p !== pos)
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
            onClick={() => router.push(`/word/${id}`)}
            className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            disabled={saving}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>
    </div>
  )
}
