'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SpeakButton from '@/app/components/SpeakButton'

interface Word {
  id: number
  term: string
  phonetic?: string
  definition: string
  examples: Array<{
    id: number
    sentenceEn: string
    sentenceCn?: string
    source?: string
  }>
}

type ReviewQuality = 'again' | 'hard' | 'good' | 'easy'

export default function ReviewPage() {
  const router = useRouter()
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReviewWords()
  }, [])

  const fetchReviewWords = async () => {
    const response = await fetch('/api/review')
    const data = await response.json()
    setWords(data.words || [])
    setLoading(false)
  }

  const handleAnswer = async (quality: ReviewQuality) => {
    if (submitting) return

    setSubmitting(true)
    const currentWord = words[currentIndex]

    await fetch('/api/review/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wordId: currentWord.id,
        quality,
      }),
    })

    // 移到下一个单词
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
      setSubmitting(false)
    } else {
      // 复习完成
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-16 h-16 mx-auto text-green-500 mb-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            今天没有要复习的单词
          </h2>
          <p className="text-gray-600 mb-6">
            所有单词都已完成复习，继续保持！
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const currentWord = words[currentIndex]
  const progress = ((currentIndex) / words.length) * 100

  return (
    <div className="max-w-3xl mx-auto">
      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            {currentIndex + 1} / {words.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 卡片 */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* 正面 - 单词 */}
        <div className="p-12 min-h-[400px] flex flex-col justify-center items-center">
          {!showAnswer ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h2 className="text-5xl font-bold text-gray-900">
                  {currentWord.term}
                </h2>
                <SpeakButton text={currentWord.term} className="text-blue-600" />
              </div>
              {currentWord.phonetic && (
                <p className="text-xl text-gray-500 mb-8">{currentWord.phonetic}</p>
              )}
              <button
                onClick={() => setShowAnswer(true)}
                className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium"
              >
                显示答案
              </button>
            </div>
          ) : (
            <div className="w-full space-y-6">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <h2 className="text-4xl font-bold text-gray-900">
                    {currentWord.term}
                  </h2>
                  <SpeakButton text={currentWord.term} className="text-blue-600" />
                </div>
                {currentWord.phonetic && (
                  <p className="text-lg text-gray-500">{currentWord.phonetic}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  释义
                </h3>
                <p className="text-lg text-gray-800">{currentWord.definition}</p>
              </div>

              {currentWord.examples.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    例句
                  </h3>
                  <div className="space-y-3">
                    {currentWord.examples.map((example) => (
                      <div
                        key={example.id}
                        className="pl-4 border-l-2 border-blue-200 text-sm"
                      >
                        <div className="flex items-start gap-2">
                          <p className="text-gray-700 italic flex-1">
                            {example.sentenceEn}
                          </p>
                          <SpeakButton
                            text={example.sentenceEn}
                            className="text-gray-400 hover:text-blue-600 flex-shrink-0"
                          />
                        </div>
                        {example.sentenceCn && (
                          <p className="text-gray-500 mt-1">{example.sentenceCn}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部评分按钮 */}
        {showAnswer && (
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => handleAnswer('again')}
                disabled={submitting}
                className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 font-medium"
              >
                <div className="text-sm">Again</div>
                <div className="text-xs opacity-75">重来</div>
              </button>
              <button
                onClick={() => handleAnswer('hard')}
                disabled={submitting}
                className="px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 font-medium"
              >
                <div className="text-sm">Hard</div>
                <div className="text-xs opacity-75">困难</div>
              </button>
              <button
                onClick={() => handleAnswer('good')}
                disabled={submitting}
                className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 font-medium"
              >
                <div className="text-sm">Good</div>
                <div className="text-xs opacity-75">良好</div>
              </button>
              <button
                onClick={() => handleAnswer('easy')}
                disabled={submitting}
                className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 font-medium"
              >
                <div className="text-sm">Easy</div>
                <div className="text-xs opacity-75">简单</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 退出按钮 */}
      <div className="mt-6 text-center">
        <button
          onClick={() => router.push('/')}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          退出复习
        </button>
      </div>
    </div>
  )
}
