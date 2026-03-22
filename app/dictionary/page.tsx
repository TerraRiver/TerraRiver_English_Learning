'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Word {
  id: number
  term: string
  phonetic?: string
  definition: string
  tags?: string
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function DictionaryPage() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLetter, setSelectedLetter] = useState('')

  useEffect(() => {
    fetchWords()
  }, [selectedLetter])

  const fetchWords = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedLetter) params.append('letter', selectedLetter)

    const response = await fetch(`/api/words?${params}`)
    const data = await response.json()
    setWords(data)
    setLoading(false)
  }

  const filteredWords = words.filter((word) =>
    word.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.definition.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">词典</h1>
        <p className="mt-1 text-sm text-gray-600">
          浏览和搜索你的词条库
        </p>
      </div>

      {/* 搜索框 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索单词或释义..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* A-Z 筛选器 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedLetter('')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedLetter === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {LETTERS.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedLetter === letter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* 词条列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : filteredWords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || selectedLetter ? '没有找到匹配的词条' : '还没有词条'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredWords.map((word) => (
              <Link
                key={word.id}
                href={`/word/${word.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {word.term}
                      </span>
                      {word.phonetic && (
                        <span className="text-sm text-gray-500">
                          {word.phonetic}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {word.definition}
                    </div>
                    {word.tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {word.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 统计 */}
      {!loading && (
        <div className="text-sm text-gray-500 text-center">
          共 {filteredWords.length} 个词条
          {searchTerm && ` (搜索: "${searchTerm}")`}
          {selectedLetter && ` (字母: ${selectedLetter})`}
        </div>
      )}
    </div>
  )
}
