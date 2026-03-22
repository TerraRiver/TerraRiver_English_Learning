'use client'

import { useState } from 'react'

export interface ExampleItem {
  sentenceEn: string
  sentenceCn: string
  source?: string
}

interface ExampleListEditableProps {
  examples: ExampleItem[]
  onChange: (examples: ExampleItem[]) => void
}

export default function ExampleListEditable({ examples, onChange }: ExampleListEditableProps) {
  const addExample = () => {
    onChange([...examples, { sentenceEn: '', sentenceCn: '', source: '' }])
  }

  const removeExample = (index: number) => {
    onChange(examples.filter((_, i) => i !== index))
  }

  const updateExample = (index: number, field: keyof ExampleItem, value: string) => {
    const newExamples = [...examples]
    newExamples[index] = { ...newExamples[index], [field]: value }
    onChange(newExamples)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          例句 (Examples)
        </label>
        <button
          type="button"
          onClick={addExample}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + 添加例句
        </button>
      </div>

      {examples.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
          还没有例句，点击上方按钮添加
        </div>
      ) : (
        <div className="space-y-4">
          {examples.map((example, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3 relative">
              <button
                type="button"
                onClick={() => removeExample(index)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                title="删除此例句"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  英文句子 *
                </label>
                <textarea
                  value={example.sentenceEn}
                  onChange={(e) => updateExample(index, 'sentenceEn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Enter the English sentence..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  中文翻译
                </label>
                <textarea
                  value={example.sentenceCn}
                  onChange={(e) => updateExample(index, 'sentenceCn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="输入中文翻译..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  出处 (Source)
                </label>
                <input
                  type="text"
                  value={example.source || ''}
                  onChange={(e) => updateExample(index, 'source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Foreign Affairs 2024-05"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
