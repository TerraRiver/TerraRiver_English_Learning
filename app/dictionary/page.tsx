'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [importMsg, setImportMsg] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMsg('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/import/csv', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setImportMsg(`导入失败：${data.error}`)
      } else {
        setImportMsg(`导入完成：新增 ${data.imported} 条，跳过 ${data.skipped} 条`)
        if (data.imported > 0) fetchWords()
      }
    } catch {
      setImportMsg('导入失败，请重试')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">词典</h1>
          <p className="mt-1 text-sm text-gray-500">浏览和搜索你的词条库</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <a
            href="/api/export/csv"
            download
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            导出 CSV
          </a>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {importing ? '导入中...' : '导入 CSV'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {importMsg && (
        <div className={`px-4 py-2.5 rounded-xl text-sm ${importMsg.includes('失败') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {importMsg}
        </div>
      )}

      {/* 搜索框 */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="搜索单词或释义..."
        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
      />

      {/* A-Z 筛选器 */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedLetter('')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            selectedLetter === ''
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          全部
        </button>
        {LETTERS.map((letter) => (
          <button
            key={letter}
            onClick={() => setSelectedLetter(letter)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedLetter === letter
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* 词条列表 */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">加载中...</div>
      ) : filteredWords.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          {searchTerm || selectedLetter ? '没有找到匹配的词条' : '还没有词条'}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredWords.map((word) => (
            <Link
              key={word.id}
              href={`/word/${word.id}`}
              className="flex justify-between items-start py-4 -mx-4 px-4 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-gray-900">{word.term}</span>
                  {word.phonetic && (
                    <span className="text-sm text-gray-400">{word.phonetic}</span>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-gray-500 line-clamp-2">{word.definition}</div>
                {word.tags && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {word.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-300 shrink-0 ml-4 mt-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {!loading && (
        <div className="text-xs text-gray-400 text-center pb-4">
          共 {filteredWords.length} 个词条
          {searchTerm && ` · 搜索 "${searchTerm}"`}
          {selectedLetter && ` · 字母 ${selectedLetter}`}
        </div>
      )}
    </div>
  )
}
