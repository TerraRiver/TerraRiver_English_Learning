import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const HEADERS = ['term', 'phonetic', 'partOfSpeech', 'definition', 'variants', 'tags', 'sentenceEn', 'sentenceCn', 'source']

// RFC 4180 简单 CSV 解析器
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let i = 0
  const n = text.length

  while (i < n) {
    const row: string[] = []
    // 跳过行首的 \r\n（空行）
    if (text[i] === '\r') i++
    if (text[i] === '\n') { i++; continue }

    while (i < n) {
      if (text[i] === '"') {
        // 带引号字段
        i++ // skip opening quote
        let field = ''
        while (i < n) {
          if (text[i] === '"' && text[i + 1] === '"') {
            field += '"'; i += 2
          } else if (text[i] === '"') {
            i++; break
          } else {
            field += text[i++]
          }
        }
        row.push(field)
      } else {
        // 无引号字段
        let field = ''
        while (i < n && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          field += text[i++]
        }
        row.push(field)
      }

      if (i < n && text[i] === ',') {
        i++ // next field
      } else {
        break // end of row
      }
    }
    // 跳过行尾 \r\n
    if (i < n && text[i] === '\r') i++
    if (i < n && text[i] === '\n') i++

    if (row.length > 0) rows.push(row)
  }
  return rows
}

interface WordGroup {
  term: string
  phonetic: string
  partOfSpeech: string
  definition: string
  variants: string
  tags: string
  examples: { sentenceEn: string; sentenceCn: string; source: string }[]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: '请上传 CSV 文件' }, { status: 400 })
    }

    const text = (await (file as Blob).text()).replace(/^\uFEFF/, '') // strip BOM
    const rows = parseCSV(text)

    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV 文件为空或格式错误' }, { status: 400 })
    }

    // 验证 header
    const header = rows[0].map(h => h.trim().toLowerCase())
    const idxOf = (name: string) => header.indexOf(name)
    const idx = {
      term: idxOf('term'),
      phonetic: idxOf('phonetic'),
      partOfSpeech: idxOf('partofspeech'),
      definition: idxOf('definition'),
      variants: idxOf('variants'),
      tags: idxOf('tags'),
      sentenceEn: idxOf('sentenceen'),
      sentenceCn: idxOf('sentencecn'),
      source: idxOf('source'),
    }

    if (idx.term === -1 || idx.definition === -1) {
      return NextResponse.json({ error: 'CSV 缺少必要列 term 或 definition' }, { status: 400 })
    }

    // 按 term 分组，保持顺序
    const groupMap = new Map<string, WordGroup>()
    const groupOrder: string[] = []

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      const get = (i: number) => (i >= 0 ? (row[i] ?? '').trim() : '')

      const term = get(idx.term)
      const sentenceEn = get(idx.sentenceEn)

      if (term) {
        // 新词条行
        if (!groupMap.has(term)) {
          groupMap.set(term, {
            term,
            phonetic: get(idx.phonetic),
            partOfSpeech: get(idx.partOfSpeech),
            definition: get(idx.definition),
            variants: get(idx.variants),
            tags: get(idx.tags),
            examples: [],
          })
          groupOrder.push(term)
        }
        if (sentenceEn) {
          groupMap.get(term)!.examples.push({
            sentenceEn,
            sentenceCn: get(idx.sentenceCn),
            source: get(idx.source),
          })
        }
      } else if (sentenceEn && groupOrder.length > 0) {
        // 续行例句（term 为空，归属上一个词条）
        const lastTerm = groupOrder[groupOrder.length - 1]
        groupMap.get(lastTerm)!.examples.push({
          sentenceEn,
          sentenceCn: get(idx.sentenceCn),
          source: get(idx.source),
        })
      }
    }

    let imported = 0
    let skipped = 0

    for (const term of groupOrder) {
      const group = groupMap.get(term)!
      if (!group.definition) { skipped++; continue }

      const exists = await prisma.word.findUnique({ where: { term }, select: { id: true } })
      if (exists) {
        skipped++
        continue
      }

      await prisma.word.create({
        data: {
          term: group.term,
          phonetic: group.phonetic || null,
          partOfSpeech: group.partOfSpeech || null,
          definition: group.definition,
          variants: group.variants || null,
          tags: group.tags || null,
          examples: {
            create: group.examples,
          },
          progress: {
            create: {
              nextReview: new Date(),
              interval: 0,
              easeFactor: 2.5,
              repetitions: 0,
            },
          },
        } as Parameters<typeof prisma.word.create>[0]['data'],
      })
      imported++
    }

    return NextResponse.json({ imported, skipped })
  } catch (error) {
    console.error('导入失败:', error)
    return NextResponse.json({ error: '导入失败，请检查文件格式' }, { status: 500 })
  }
}
