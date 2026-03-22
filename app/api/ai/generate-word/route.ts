import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

const SYSTEM_PROMPT = `你是一位英语词典编纂专家。用户会给你一个英文单词或短语，你需要返回一个 JSON 对象，包含以下字段：

- phonetic: IPA 音标，如 /hɪˈɡeməni/，如果不确定则返回空字符串
- partOfSpeech: 词性数组，列出该词所有适用的词性，使用英文小写，可选值：noun、verb、adjective、adverb、phrase、abbreviation、other；例如一个词同时是名词和动词则返回 ["noun", "verb"]
- definition: 按照牛津英语词典风格的中文释义，说明词性和核心含义，简洁准确，1-2句话
- variants: 单词变体数组，列出该词的主要形态变化，每项格式为"变体 (类型)"，例如 "hegemonies (pl.)"、"dominated (past tense)"、"dominating (pres. part.)"、"hegemonic (adj.)"；若为不可数名词或无变体则返回空数组
- tags: 相关标签数组，从以下类别中选择最相关的1-4个：四级、六级、雅思、学术、通用、其他；根据单词的难度和使用场景判断：四级/六级对应大学英语四六级词汇，雅思对应雅思考试词汇，学术指学术写作中常见但不限于某一考试的词汇，通用指日常高频词汇，其他指不属于以上类别的词汇
- examples: 例句数组，只包含1条例句，包含：
  - sentenceEn: 英文例句，体现该词的典型用法
  - sentenceCn: 对应的中文翻译

只返回 JSON，不要任何额外说明。`

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: '未配置 DEEPSEEK_API_KEY' }, { status: 500 })
  }

  let term: string
  try {
    const body = await request.json()
    term = (body.term || '').trim()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  if (!term) {
    return NextResponse.json({ error: '请先填写单词' }, { status: 400 })
  }

  const deepseekResponse = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: term },
      ],
    }),
  })

  if (!deepseekResponse.ok) {
    const errText = await deepseekResponse.text()
    console.error('DeepSeek API error:', errText)
    return NextResponse.json({ error: 'AI 服务请求失败，请稍后重试' }, { status: 502 })
  }

  const deepseekData = await deepseekResponse.json()
  const rawContent = deepseekData.choices?.[0]?.message?.content

  if (!rawContent) {
    return NextResponse.json({ error: 'AI 返回内容为空' }, { status: 502 })
  }

  let parsed: {
    phonetic?: string
    partOfSpeech?: string | string[]
    definition?: string
    variants?: string[]
    tags?: string[]
    examples?: { sentenceEn: string; sentenceCn: string }[]
  }
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    console.error('Failed to parse DeepSeek response:', rawContent)
    return NextResponse.json({ error: 'AI 返回格式错误' }, { status: 502 })
  }

  return NextResponse.json({
    phonetic: parsed.phonetic || '',
    partOfSpeech: Array.isArray(parsed.partOfSpeech)
      ? parsed.partOfSpeech.join(', ')
      : (parsed.partOfSpeech || ''),
    definition: parsed.definition || '',
    variants: Array.isArray(parsed.variants) ? parsed.variants.join(', ') : (parsed.variants || ''),
    tags: Array.isArray(parsed.tags) ? parsed.tags.join(',') : (parsed.tags || ''),
    examples: Array.isArray(parsed.examples)
      ? parsed.examples.slice(0, 1).map((ex) => ({
          sentenceEn: ex.sentenceEn || '',
          sentenceCn: ex.sentenceCn || '',
          source: '',
        }))
      : [],
  })
}
