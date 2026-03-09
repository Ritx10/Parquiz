export type PodiumPlace = 1 | 2 | 3 | 4

export type MatchRewardSummary = {
  baseCoins: number
  baseXp: number
  bonusCapturesXp: number
  bonusKnowledgeXp: number
  bonusParticipationXp: number
  captureCount: number
  correctAnswers: number
  place: PodiumPlace
  totalCoins: number
  totalXp: number
}

export const coinsRewardByPlace: Record<PodiumPlace, number> = {
  1: 100,
  2: 60,
  3: 40,
  4: 20,
}

export const xpRewardByPlace: Record<PodiumPlace, number> = {
  1: 120,
  2: 80,
  3: 50,
  4: 30,
}

export const KNOWLEDGE_BONUS_XP = 20
export const CAPTURE_BONUS_XP = 10
export const PARTICIPATION_BONUS_XP = 10

export const calculateMatchRewardSummary = (params: {
  captureCount: number
  correctAnswers: number
  place: PodiumPlace
}) => {
  const baseCoins = coinsRewardByPlace[params.place]
  const baseXp = xpRewardByPlace[params.place]
  const bonusKnowledgeXp = params.correctAnswers > 0 ? KNOWLEDGE_BONUS_XP : 0
  const bonusCapturesXp = params.captureCount > 0 ? CAPTURE_BONUS_XP : 0
  const bonusParticipationXp = PARTICIPATION_BONUS_XP

  return {
    baseCoins,
    baseXp,
    bonusCapturesXp,
    bonusKnowledgeXp,
    bonusParticipationXp,
    captureCount: params.captureCount,
    correctAnswers: params.correctAnswers,
    place: params.place,
    totalCoins: baseCoins,
    totalXp: baseXp + bonusKnowledgeXp + bonusCapturesXp + bonusParticipationXp,
  } satisfies MatchRewardSummary
}
