/**
 * SM-2 间隔重复算法实现
 * 基于 SuperMemo-2 算法
 */

export type ReviewQuality = 'again' | 'hard' | 'good' | 'easy'

export interface SM2Result {
  interval: number      // 下次复习间隔（天）
  repetitions: number   // 连续成功复习次数
  easeFactor: number    // 难度系数 (EF)
  lapses: number        // 累计遗忘次数
  nextReview: Date      // 下次复习日期
}

const EF_MIN = 1.3
const EF_MAX = 5.0

/**
 * 计算下次复习参数
 * @param quality      用户反馈质量
 * @param repetitions  当前连续成功次数
 * @param easeFactor   当前难度系数
 * @param interval     当前间隔天数
 * @param lapses       历史遗忘次数
 */
export function calculateSM2(
  quality: ReviewQuality,
  repetitions: number,
  easeFactor: number,
  interval: number,
  lapses: number
): SM2Result {
  // 将质量映射为分数 (0-5)
  const qualityScore = { again: 0, hard: 3, good: 4, easy: 5 }[quality]

  // 更新难度系数，并钳制在 [EF_MIN, EF_MAX]
  let newEF = easeFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02))
  newEF = Math.min(Math.max(newEF, EF_MIN), EF_MAX)

  let newInterval: number
  let newRepetitions: number
  let newLapses = lapses

  if (qualityScore < 3) {
    // 遗忘：重置进度，遗忘次数 +1
    newRepetitions = 0
    newInterval = 1
    newLapses = lapses + 1
  } else {
    newRepetitions = repetitions + 1

    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEF)
    }
  }

  // 按评分微调间隔
  if (quality === 'easy') {
    newInterval = Math.round(newInterval * 1.3)
  } else if (quality === 'hard') {
    newInterval = Math.max(Math.round(newInterval * 0.85), 1)
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: newEF,
    lapses: newLapses,
    nextReview,
  }
}

/**
 * 判断单词是否在今天或之前到期
 */
export function isDueForReview(nextReviewDate: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const reviewDate = new Date(nextReviewDate)
  reviewDate.setHours(0, 0, 0, 0)

  return reviewDate <= today
}
