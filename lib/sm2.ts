/**
 * SM-2 间隔重复算法实现
 * 基于 SuperMemo-2 算法
 */

export type ReviewQuality = 'again' | 'hard' | 'good' | 'easy'

export interface SM2Result {
  interval: number      // 下次复习间隔（天）
  repetitions: number   // 连续成功复习次数
  easeFactor: number    // 难度系数 (EF)
  nextReview: Date      // 下次复习日期
}

/**
 * 计算下次复习参数
 * @param quality 用户反馈质量 ('again' | 'hard' | 'good' | 'easy')
 * @param repetitions 当前连续成功次数
 * @param easeFactor 当前难度系数
 * @param interval 当前间隔天数
 * @returns SM2Result 包含下次复习的所有参数
 */
export function calculateSM2(
  quality: ReviewQuality,
  repetitions: number,
  easeFactor: number,
  interval: number
): SM2Result {
  // 将质量映射为分数 (0-5)
  const qualityScore = {
    again: 0,  // 完全不记得
    hard: 3,   // 想了很久才记起
    good: 4,   // 犹豫后想起
    easy: 5,   // 轻松记起
  }[quality]

  // 计算新的难度系数 (EF)
  let newEF = easeFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02))

  // EF 不能低于 1.3
  if (newEF < 1.3) {
    newEF = 1.3
  }

  let newInterval: number
  let newRepetitions: number

  // 如果回答质量低于 3（即 'again'），重置进度
  if (qualityScore < 3) {
    newRepetitions = 0
    newInterval = 1  // 明天再复习
  } else {
    newRepetitions = repetitions + 1

    // 根据重复次数计算间隔
    if (newRepetitions === 1) {
      newInterval = 1  // 第一次：1天
    } else if (newRepetitions === 2) {
      newInterval = 6  // 第二次：6天
    } else {
      // 第三次及以后：上次间隔 * EF
      newInterval = Math.round(interval * newEF)
    }
  }

  // 根据质量微调间隔
  if (quality === 'easy') {
    newInterval = Math.round(newInterval * 1.3)  // 简单：间隔 +30%
  } else if (quality === 'hard') {
    newInterval = Math.round(newInterval * 0.85) // 困难：间隔 -15%
    newInterval = Math.max(newInterval, 1)       // 最少1天
  }

  // 计算下次复习日期
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: newEF,
    nextReview,
  }
}

/**
 * 获取今日应复习的单词数量
 * @param nextReviewDate 下次复习日期
 * @returns boolean 是否需要复习
 */
export function isDueForReview(nextReviewDate: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const reviewDate = new Date(nextReviewDate)
  reviewDate.setHours(0, 0, 0, 0)

  return reviewDate <= today
}
