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
    repetitions: number
  } | null
}

interface ReviewConfig {
  limit: number          // 0 = 无限制
  selectedTags: string[] // 空数组 = 全部标签
  shuffle: boolean
  includeNew: boolean
  mode: 'detailed' | 'simple'
}

const DEFAULT_CONFIG: ReviewConfig = {
  limit: 0,
  selectedTags: [],
  shuffle: false,
  includeNew: true,
  mode: 'detailed',
}

const LIMIT_OPTIONS = [
  { label: '无限制', value: 0 },
  { label: '10 个', value: 10 },
  { label: '20 个', value: 20 },
  { label: '30 个', value: 30 },
  { label: '50 个', value: 50 },
]

type ReviewQuality = 'again' | 'hard' | 'good' | 'easy'
type Phase = 'setup' | 'reviewing' | 'done'

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        value ? 'bg-gray-900' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function ReviewPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('setup')
  const [allWords, setAllWords] = useState<Word[]>([])
  const [dueCount, setDueCount] = useState(0)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [config, setConfig] = useState<ReviewConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  // 复习阶段状态
  const [reviewWords, setReviewWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // 本次会话中已重入队列的单词 ID，每个词最多重入一次
  const [requeuedIds, setRequeuedIds] = useState<Set<number>>(new Set())

  // 从 localStorage 恢复配置
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ir-ekb-review-config')
      if (saved) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) })
    } catch {}
  }, [])

  useEffect(() => {
    fetchWords()
  }, [])

  const fetchWords = async () => {
    const response = await fetch('/api/review')
    const data = await response.json()
    const words: Word[] = data.words || []
    setAllWords(words)
    setDueCount(data.dueCount ?? 0)

    // 从全部词中提取所有标签
    const tagSet = new Set<string>()
    words.forEach((w) => {
      w.tags?.split(',').forEach((t) => {
        const trimmed = t.trim()
        if (trimmed) tagSet.add(trimmed)
      })
    })
    setAvailableTags(Array.from(tagSet).sort())
    setLoading(false)
  }

  const applyFilters = (words: Word[], cfg: ReviewConfig): Word[] => {
    let result = [...words]

    if (!cfg.includeNew) {
      result = result.filter((w) => w.progress != null)
    }

    if (cfg.selectedTags.length > 0) {
      result = result.filter((w) => {
        if (!w.tags) return false
        const wordTags = w.tags.split(',').map((t) => t.trim())
        return cfg.selectedTags.some((st) => wordTags.includes(st))
      })
    }

    if (cfg.shuffle) {
      result = result.sort(() => Math.random() - 0.5)
    }

    if (cfg.limit > 0) {
      result = result.slice(0, cfg.limit)
    }

    return result
  }

  const previewCount = applyFilters(allWords, config).length

  const saveConfig = (newConfig: ReviewConfig) => {
    setConfig(newConfig)
    localStorage.setItem('ir-ekb-review-config', JSON.stringify(newConfig))
  }

  const handleStart = () => {
    const words = applyFilters(allWords, config)
    setReviewWords(words)
    setCurrentIndex(0)
    setShowAnswer(false)
    setRequeuedIds(new Set())
    setPhase('reviewing')
  }

  const handleAnswer = async (quality: ReviewQuality) => {
    if (submitting) return
    setSubmitting(true)

    const currentWord = reviewWords[currentIndex]

    await fetch('/api/review/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId: currentWord.id, quality }),
    })

    // Again 且本次会话尚未重入过：追加到队列末尾
    if (quality === 'again' && !requeuedIds.has(currentWord.id)) {
      setRequeuedIds((prev) => new Set(prev).add(currentWord.id))
      setReviewWords((prev) => [...prev, currentWord])
    }

    if (currentIndex < reviewWords.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
      setSubmitting(false)
    } else {
      setPhase('done')
    }
  }

  // ─── 加载中 ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  // ─── 配置页 ───────────────────────────────────────────────
  if (phase === 'setup') {
    if (allWords.length === 0) {
      return (
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-white rounded-2xl p-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">词库还没有单词</h2>
            <p className="text-gray-600 mb-6">先去添加一些单词吧！</p>
            <button onClick={() => router.push('/word/new')} className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700">
              添加单词
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">复习</h1>
          <p className="mt-1 text-sm text-gray-600">
            词库共 <span className="font-semibold text-gray-900">{allWords.length}</span> 个单词
            {dueCount > 0 && <>，其中 <span className="font-semibold text-gray-900">{dueCount}</span> 个今日到期</>}
            {dueCount === 0 && <span className="text-gray-400">，暂无到期，可继续赶进度</span>}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">复习配置</h2>

            {/* 每次上限 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">每次上限</div>
                <div className="text-xs text-gray-500 mt-0.5">限制本次复习的单词数量</div>
              </div>
              <select
                value={config.limit}
                onChange={(e) => saveConfig({ ...config, limit: parseInt(e.target.value) })}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {LIMIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 标签筛选 */}
            {availableTags.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">标签筛选</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => saveConfig({ ...config, selectedTags: [] })}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      config.selectedTags.length === 0
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'text-gray-600 border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    全部
                  </button>
                  {availableTags.map((tag) => {
                    const selected = config.selectedTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? config.selectedTags.filter((t) => t !== tag)
                            : [...config.selectedTags, tag]
                          saveConfig({ ...config, selectedTags: next })
                        }}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          selected
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'text-gray-600 border-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 包含新词 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">包含新词</div>
                <div className="text-xs text-gray-500 mt-0.5">纳入从未复习过的单词</div>
              </div>
              <Toggle value={config.includeNew} onChange={() => saveConfig({ ...config, includeNew: !config.includeNew })} />
            </div>

            {/* 随机顺序 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">随机顺序</div>
                <div className="text-xs text-gray-500 mt-0.5">打乱单词复习顺序</div>
              </div>
              <Toggle value={config.shuffle} onChange={() => saveConfig({ ...config, shuffle: !config.shuffle })} />
            </div>

            {/* 评分模式 */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">评分模式</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => saveConfig({ ...config, mode: 'detailed' })}
                  className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                    config.mode === 'detailed' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800">精细模式</div>
                  <div className="text-xs text-gray-500 mt-1">Again / Hard / Good / Easy</div>
                </button>
                <button
                  type="button"
                  onClick={() => saveConfig({ ...config, mode: 'simple' })}
                  className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                    config.mode === 'simple' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800">简洁模式</div>
                  <div className="text-xs text-gray-500 mt-1">Again / Easy</div>
                </button>
              </div>
            </div>
          </div>

          {/* 底部操作栏 */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between rounded-b-2xl px-6 py-4">
            <span className="text-sm text-gray-600">
              将复习{' '}
              <span className={`font-semibold ${previewCount === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                {previewCount}
              </span>{' '}
              个单词
            </span>
            <button
              onClick={handleStart}
              disabled={previewCount === 0}
              className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 font-medium"
            >
              开始复习 →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── 完成页 ───────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-gray-50 rounded-2xl p-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">复习完成！</h2>
          <p className="text-gray-600 mb-6">
            本次复习了{' '}
            <span className="font-semibold text-gray-900">{reviewWords.length}</span> 个单词
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { fetchWords(); setPhase('setup') }}
              className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
            >
              再来一次
            </button>
            <button onClick={() => router.push('/')} className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700">
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── 复习页 ───────────────────────────────────────────────
  const currentWord = reviewWords[currentIndex]
  const progressPct = (currentIndex / reviewWords.length) * 100
  const isRequeued = requeuedIds.has(currentWord.id)

  return (
    <div className="max-w-3xl mx-auto">
      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{currentIndex + 1} / {reviewWords.length}</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* 卡片 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        {/* 重做角标 */}
        {isRequeued && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重做 — 上次标记为 Again
          </div>
        )}
        <div className="p-6 sm:p-12 min-h-[260px] sm:min-h-[400px] flex flex-col justify-center items-center">
          {!showAnswer ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 break-all">{currentWord.term}</h2>
                <SpeakButton text={currentWord.term} className="text-gray-500" />
              </div>
              {currentWord.phonetic && (
                <p className="text-lg text-gray-500 mb-8">{currentWord.phonetic}</p>
              )}
              <button
                onClick={() => setShowAnswer(true)}
                className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-700 text-base font-medium transition-colors"
              >
                显示答案
              </button>
            </div>
          ) : (
            <div className="w-full space-y-6">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 break-all">{currentWord.term}</h2>
                  <SpeakButton text={currentWord.term} className="text-gray-500" />
                </div>
                {currentWord.phonetic && (
                  <p className="text-lg text-gray-500">{currentWord.phonetic}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">释义</h3>
                <p className="text-lg text-gray-800">{currentWord.definition}</p>
              </div>
              {currentWord.examples.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">例句</h3>
                  <div className="space-y-3">
                    {currentWord.examples.map((example) => (
                      <div key={example.id} className="pl-4 border-l-2 border-gray-200 text-sm">
                        <div className="flex items-start gap-2">
                          <p className="text-gray-700 italic flex-1">{example.sentenceEn}</p>
                          <SpeakButton text={example.sentenceEn} className="text-gray-300 hover:text-gray-600 flex-shrink-0" />
                        </div>
                        {example.sentenceCn && <p className="text-gray-500 mt-1">{example.sentenceCn}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 评分按钮 */}
        {showAnswer && (
          <div className="bg-gray-50 p-4 sm:p-6 rounded-b-2xl">
            {config.mode === 'detailed' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <button onClick={() => handleAnswer('again')} disabled={submitting} className="py-4 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-40 font-medium transition-colors">
                  <div className="text-sm">Again</div>
                  <div className="text-xs opacity-75">重来</div>
                </button>
                <button onClick={() => handleAnswer('hard')} disabled={submitting} className="py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-40 font-medium transition-colors">
                  <div className="text-sm">Hard</div>
                  <div className="text-xs opacity-75">困难</div>
                </button>
                <button onClick={() => handleAnswer('good')} disabled={submitting} className="py-4 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 disabled:opacity-40 font-medium transition-colors">
                  <div className="text-sm">Good</div>
                  <div className="text-xs opacity-75">良好</div>
                </button>
                <button onClick={() => handleAnswer('easy')} disabled={submitting} className="py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-40 font-medium transition-colors">
                  <div className="text-sm">Easy</div>
                  <div className="text-xs opacity-75">简单</div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleAnswer('again')} disabled={submitting} className="px-4 py-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 font-medium">
                  <div className="text-base">Again</div>
                  <div className="text-sm opacity-75">没记住，重来</div>
                </button>
                <button onClick={() => handleAnswer('easy')} disabled={submitting} className="px-4 py-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 font-medium">
                  <div className="text-base">Easy</div>
                  <div className="text-sm opacity-75">记住了，下一个</div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 退出按钮 */}
      <div className="mt-6 text-center">
        <button onClick={() => setPhase('setup')} className="text-gray-600 hover:text-gray-900 text-sm">
          ← 返回配置
        </button>
      </div>
    </div>
  )
}
