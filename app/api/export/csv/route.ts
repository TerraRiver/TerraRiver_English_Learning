import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const HEADERS = ['term', 'phonetic', 'partOfSpeech', 'definition', 'variants', 'tags', 'sentenceEn', 'sentenceCn', 'source']

function escape(value: string | null | undefined): string {
  const s = value ?? ''
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function row(fields: (string | null | undefined)[]): string {
  return fields.map(escape).join(',')
}

export async function GET() {
  try {
    const words = await prisma.word.findMany({
      include: { examples: true },
      orderBy: { term: 'asc' },
    })

    const lines: string[] = [HEADERS.join(',')]

    for (const word of words) {
      if (word.examples.length === 0) {
        lines.push(row([word.term, word.phonetic, word.partOfSpeech, word.definition, word.variants, word.tags, '', '', '']))
      } else {
        word.examples.forEach((ex, i) => {
          if (i === 0) {
            lines.push(row([word.term, word.phonetic, word.partOfSpeech, word.definition, word.variants, word.tags, ex.sentenceEn, ex.sentenceCn, ex.source]))
          } else {
            lines.push(row(['', '', '', '', '', '', ex.sentenceEn, ex.sentenceCn, ex.source]))
          }
        })
      }
    }

    const csv = '\uFEFF' + lines.join('\r\n') // BOM for Excel UTF-8
    const date = new Date().toISOString().slice(0, 10)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="lexicon-${date}.csv"`,
      },
    })
  } catch (error) {
    console.error('导出失败:', error)
    return NextResponse.json({ error: '导出失败' }, { status: 500 })
  }
}
