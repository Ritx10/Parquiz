import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { motion, type TargetAndTransition } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GameAvatar } from './game-avatar'
import { getBoardThemeDefinition, getBoardThemeSurfacePalette } from '../../lib/board-themes'
import type { MatchRewardSummary, PodiumPlace } from '../../lib/match-rewards'
import { getPlayerVisualThemeByColor } from '../../lib/player-color-themes'
import type { TokenSkinId } from '../../lib/token-cosmetics'
import { useAppSettingsStore } from '../../store/app-settings-store'

type PlayerColor = 'red' | 'green' | 'blue' | 'yellow'

interface RankingEntry {
  avatar: string
  id: string
  name: string
  place: PodiumPlace
  reward: number
  rewardSummary?: MatchRewardSummary
  color: PlayerColor
  progressScore?: number
  title?: string
  visualSkinId?: TokenSkinId
}

const defaultRanking: RankingEntry[] = [
  { id: 'P1', name: 'P1', place: 1, reward: 2350, color: 'red', avatar: 'P1' },
  { id: 'P2', name: 'P2', place: 2, reward: 1980, color: 'blue', avatar: 'P2' },
  { id: 'P3', name: 'P3', place: 3, reward: 1650, color: 'green', avatar: 'P3' },
  { id: 'P4', name: 'P4', place: 4, reward: 1400, color: 'yellow', avatar: 'P4' },
]

const rankingCopyByLanguage = {
  es: {
    backHome: 'VOLVER AL INICIO',
    championship: 'CAMPEONATO - CLASIFICACION FINAL',
    finalRanking: 'PARQUIZ CHAMPIONSHIP',
    rewardsTitle: 'RECOMPENSAS',
    xpEarned: 'XP Ganada',
    coinsEarned: 'Monedas',
    bonusQuestions: 'Bonus preguntas',
    bonusCaptures: 'Bonus capturas',
    bonusParticipation: 'Bonus participacion',
    placeLabel: {
      1: 'PRIMER LUGAR',
      2: 'SEGUNDO LUGAR',
      3: 'TERCER LUGAR',
      4: 'CUARTO LUGAR',
    } as Record<PodiumPlace, string>,
  },
  en: {
    backHome: 'BACK TO HOME',
    championship: 'CHAMPIONSHIP - FINAL RANKING',
    finalRanking: 'PARQUIZ CHAMPIONSHIP',
    rewardsTitle: 'REWARDS',
    xpEarned: 'XP Earned',
    coinsEarned: 'Coins',
    bonusQuestions: 'Question bonus',
    bonusCaptures: 'Capture bonus',
    bonusParticipation: 'Participation bonus',
    placeLabel: {
      1: 'FIRST PLACE',
      2: 'SECOND PLACE',
      3: 'THIRD PLACE',
      4: 'FOURTH PLACE',
    } as Record<PodiumPlace, string>,
  },
} as const

const podiumOrder: PodiumPlace[] = [2, 1, 3, 4]

const podiumConfigByPlace: Record<PodiumPlace, { blockClass: string; medalClass: string; icon: string; labelClass: string }> = {
  1: {
    blockClass: 'h-[430px] w-[228px] sm:h-[500px] sm:w-[254px]',
    icon: '🏆',
    labelClass: 'text-[#fff0a8]',
    medalClass: 'from-[#fff0aa] via-[#ffcf4f] to-[#d88a06]',
  },
  2: {
    blockClass: 'h-[350px] w-[198px] sm:h-[410px] sm:w-[216px]',
    icon: '🥈',
    labelClass: 'text-[#ebf3ff]',
    medalClass: 'from-[#f4f8ff] via-[#bccbe1] to-[#7d8ea8]',
  },
  3: {
    blockClass: 'h-[286px] w-[188px] sm:h-[334px] sm:w-[206px]',
    icon: '🥉',
    labelClass: 'text-[#ffe3c7]',
    medalClass: 'from-[#ffd8b5] via-[#e09a5a] to-[#ac5828]',
  },
  4: {
    blockClass: 'h-[228px] w-[204px] sm:h-[266px] sm:w-[224px]',
    icon: '🎖',
    labelClass: 'text-[#fff0b9]',
    medalClass: 'from-[#ffe9ad] via-[#efc760] to-[#cd8a21]',
  },
}

const avatarMotionByPlace: Record<PodiumPlace, TargetAndTransition> = {
  1: { rotate: [0, -4, 4, 0], scale: [1, 1.06, 1], y: [0, -8, 0] },
  2: { rotate: [0, -2, 2, -2, 0], scale: [1, 1.02, 1], y: [0, -3, 0] },
  3: { rotate: [0, 1.5, -1.5, 0], scale: [1, 1.015, 1], y: [0, -2, 0] },
  4: { rotate: [0, -3, 3, 0], x: [0, -2, 2, 0], y: [0, -1, 0] },
}

const rankingGlassTintByThemeId = {
  'theme-classic': {
    border: 'rgba(255,255,255,0.28)',
    glow: 'rgba(103, 64, 29, 0.2)',
    tintA: 'rgba(245,230,200,0.34)',
    tintB: 'rgba(214,186,148,0.18)',
  },
  'theme-rainbow': {
    border: 'rgba(255,255,255,0.3)',
    glow: 'rgba(96, 132, 199, 0.22)',
    tintA: 'rgba(200,220,255,0.3)',
    tintB: 'rgba(255,212,236,0.16)',
  },
  'theme-castle': {
    border: 'rgba(255,255,255,0.3)',
    glow: 'rgba(86, 92, 168, 0.22)',
    tintA: 'rgba(180,200,255,0.32)',
    tintB: 'rgba(214,202,255,0.16)',
  },
  'theme-jungle': {
    border: 'rgba(255,255,255,0.28)',
    glow: 'rgba(43, 104, 58, 0.2)',
    tintA: 'rgba(180,255,200,0.28)',
    tintB: 'rgba(118,180,132,0.16)',
  },
  'theme-desert': {
    border: 'rgba(255,255,255,0.28)',
    glow: 'rgba(131, 87, 37, 0.2)',
    tintA: 'rgba(255,226,185,0.28)',
    tintB: 'rgba(232,180,116,0.16)',
  },
  'theme-night': {
    border: 'rgba(255,255,255,0.3)',
    glow: 'rgba(48, 75, 138, 0.24)',
    tintA: 'rgba(180,200,255,0.28)',
    tintB: 'rgba(104,128,201,0.18)',
  },
  'theme-volcano': {
    border: 'rgba(255,255,255,0.28)',
    glow: 'rgba(126, 49, 28, 0.24)',
    tintA: 'rgba(255,160,140,0.3)',
    tintB: 'rgba(170,72,44,0.18)',
  },
  'theme-legend': {
    border: 'rgba(255,255,255,0.3)',
    glow: 'rgba(136, 110, 54, 0.22)',
    tintA: 'rgba(245,220,170,0.28)',
    tintB: 'rgba(215,186,108,0.16)',
  },
} as const

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '')
  const normalized = sanitized.length === 3 ? sanitized.split('').map((char) => `${char}${char}`).join('') : sanitized
  const value = Number.parseInt(normalized, 16)

  return {
    b: value & 255,
    g: (value >> 8) & 255,
    r: (value >> 16) & 255,
  }
}

const mixHex = (hex: string, targetHex: string, ratio: number) => {
  const source = hexToRgb(hex)
  const target = hexToRgb(targetHex)
  const mix = (from: number, to: number) => Math.round(from + (to - from) * ratio)

  return `rgb(${mix(source.r, target.r)}, ${mix(source.g, target.g)}, ${mix(source.b, target.b)})`
}

const rgbaFromHex = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

type FinalRankingScreenProps = {
  currentPlayerId?: string
  placements?: RankingEntry[]
}

function StadiumLight({ className }: { className: string }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="grid grid-cols-4 gap-2 rounded-[22px] border border-white/20 bg-[#113265]/80 p-3 shadow-[0_14px_24px_rgba(0,0,0,0.34)] backdrop-blur-sm">
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            className="h-3.5 w-3.5 rounded-full bg-[#eaf8ff] shadow-[0_0_18px_rgba(169,237,255,0.95)] sm:h-4 sm:w-4"
            key={`light-${className}-${index}`}
          />
        ))}
      </div>
    </div>
  )
}

function PodiumAvatar({ entry }: { entry: RankingEntry }) {
  const avatarTheme = getPlayerVisualThemeByColor(entry.color, entry.visualSkinId)
  const frameSizeClass =
    entry.place === 1
      ? 'h-[122px] w-[122px] rounded-[32px] sm:h-[142px] sm:w-[142px]'
      : entry.place === 4
        ? 'h-[88px] w-[88px] rounded-[24px] sm:h-[98px] sm:w-[98px]'
        : 'h-[96px] w-[96px] rounded-[26px] sm:h-[108px] sm:w-[108px]'
  const outerFrameClass = entry.place === 1 ? 'rounded-[36px]' : 'rounded-[32px]'

  return (
    <motion.div
      animate={avatarMotionByPlace[entry.place]}
      className="relative"
      transition={{ duration: entry.place === 1 ? 2.3 : 2.8, ease: 'easeInOut', repeat: Infinity }}
    >
      <div className="absolute -right-2 top-4 z-20 text-[40px] drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] sm:text-[48px]">
        {podiumConfigByPlace[entry.place].icon}
      </div>
      <div className={`${outerFrameClass} border-[5px] border-[#5f2d16] bg-[linear-gradient(180deg,#ffe39e_0%,#f4b742_55%,#d67a1d_100%)] p-2 shadow-[0_18px_24px_rgba(0,0,0,0.34)]`}>
        <div className={`flex items-center justify-center border-[4px] border-[#fff2d1] bg-gradient-to-b ${frameSizeClass} ${avatarTheme.avatarToneClass} shadow-[inset_0_2px_0_rgba(255,255,255,0.55)]`}>
          <GameAvatar
            alt={entry.name}
            avatar={entry.avatar}
            imageClassName="h-full w-full object-contain p-2"
            textClassName="text-4xl font-black text-white"
          />
        </div>
      </div>
    </motion.div>
  )
}

function PodiumBlock({ entry, delay, ui }: { entry: RankingEntry; delay: number; ui: (typeof rankingCopyByLanguage)[keyof typeof rankingCopyByLanguage] }) {
  const config = podiumConfigByPlace[entry.place]
  const visualTheme = getPlayerVisualThemeByColor(entry.color, entry.visualSkinId)
  const podiumBaseColor = visualTheme.boardCenterColor
  const podiumStyle = {
    backgroundImage: `linear-gradient(180deg, ${mixHex(podiumBaseColor, '#ffffff', 0.14)} 0%, ${podiumBaseColor} 54%, ${mixHex(podiumBaseColor, '#000000', 0.22)} 100%)`,
    borderColor: mixHex(podiumBaseColor, '#4a2411', 0.5),
    boxShadow: `0 22px 34px ${rgbaFromHex(podiumBaseColor, 0.24)}`,
  } satisfies CSSProperties
  const medalBorderColor = mixHex(podiumBaseColor, '#6b3715', 0.42)

  return (
    <motion.article
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`relative flex flex-col items-center ${entry.place === 1 ? 'z-20' : 'z-10'}`}
      initial={{ opacity: 0, y: 80, scale: 0.92 }}
      transition={{ delay, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`relative z-20 flex flex-col items-center ${entry.place === 1 ? 'mb-[-26px] sm:mb-[-32px]' : entry.place === 2 ? 'mb-[-14px] sm:mb-[-18px]' : entry.place === 3 ? 'mb-[-10px] sm:mb-[-14px]' : 'mb-[-8px] sm:mb-[-10px]'}`}>
        <PodiumAvatar entry={entry} />
      </div>

      <div className={`relative overflow-hidden rounded-t-[28px] border-[5px] ${config.blockClass}`} style={podiumStyle}>
        <div className="absolute inset-x-0 top-0 h-5 bg-white/18" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:18px_18px] opacity-40" />
        <div className={`absolute inset-x-0 h-[3px] bg-black/12 ${entry.place === 1 ? 'top-[112px] sm:top-[126px]' : entry.place === 2 ? 'top-[90px] sm:top-[100px]' : entry.place === 3 ? 'top-[84px] sm:top-[92px]' : 'top-[78px] sm:top-[84px]'}`} />

        <div className={`relative flex h-full flex-col items-center justify-end px-4 text-center sm:px-5 ${entry.place === 1 ? 'pb-8 pt-[148px] sm:pb-9 sm:pt-[172px]' : entry.place === 2 ? 'pb-7 pt-[116px] sm:pb-8 sm:pt-[132px]' : entry.place === 3 ? 'pb-7 pt-[104px] sm:pb-8 sm:pt-[118px]' : 'pb-6 pt-[96px] sm:pb-7 sm:pt-[108px]'}`}>
          <div className={`mb-3 rounded-full border-[4px] bg-gradient-to-b ${config.medalClass} px-4 py-2 font-display text-[18px] tracking-[0.08em] text-[#5a3014] shadow-[0_8px_14px_rgba(0,0,0,0.26)] sm:text-[22px]`} style={{ borderColor: medalBorderColor }}>
            {entry.place}
          </div>
          <p className={`font-display uppercase leading-[0.94] drop-shadow-[0_3px_0_rgba(48,23,9,0.62)] ${entry.place === 4 ? 'text-[18px] sm:text-[25px]' : entry.place === 1 ? 'text-[28px] sm:text-[38px]' : 'text-[23px] sm:text-[31px]'} ${config.labelClass}`}>
            {ui.placeLabel[entry.place]}
          </p>
          <p className={`mt-3 font-black leading-tight text-white ${entry.place === 4 ? 'text-[14px] sm:text-[18px]' : 'text-[16px] sm:text-[22px]'}`}>{entry.name}</p>
        </div>
      </div>
    </motion.article>
  )
}

export default function FinalRankingScreen({ currentPlayerId, placements }: FinalRankingScreenProps) {
  const navigate = useNavigate()
  const language = useAppSettingsStore((state) => state.language)
  const selectedBoardThemeId = useAppSettingsStore((state) => state.selectedBoardThemeId)
  const ui = rankingCopyByLanguage[language]
  const [showConfetti, setShowConfetti] = useState(true)
  const boardTheme = getBoardThemeDefinition(selectedBoardThemeId)
  const surfacePalette = getBoardThemeSurfacePalette(selectedBoardThemeId)
  const glassTint = rankingGlassTintByThemeId[selectedBoardThemeId]

  const rankingGlassStyle = {
    backdropFilter: 'blur(22px) saturate(135%)',
    background: `linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 18%, rgba(255,255,255,0.03) 100%), linear-gradient(135deg, ${glassTint.tintA} 0%, ${glassTint.tintB} 100%)`,
    borderColor: glassTint.border,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -18px 28px rgba(255,255,255,0.04), 0 10px 40px ${glassTint.glow}`,
  } satisfies CSSProperties

  const buttonGlassStyle = {
    backdropFilter: 'blur(14px) saturate(135%)',
    background: `linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.1) 22%, rgba(255,255,255,0.04) 100%), linear-gradient(135deg, ${glassTint.tintA} 0%, ${glassTint.tintB} 100%)`,
    borderColor: 'rgba(255,255,255,0.3)',
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 6px 20px rgba(0,0,0,0.35)',
  } satisfies CSSProperties

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowConfetti(false), 7200)
    return () => window.clearTimeout(timeoutId)
  }, [])

  const ranking = useMemo(() => {
    const source = placements && placements.length > 0 ? [...placements] : [...defaultRanking]
    return source.sort((a, b) => a.place - b.place)
  }, [placements])

  const placementsByPlace = useMemo(() => {
    return ranking.reduce((acc, entry) => {
      acc[entry.place] = entry
      return acc
    }, {} as Record<PodiumPlace, RankingEntry>)
  }, [ranking])

  const currentPlayerPlacement = useMemo(() => {
    if (!currentPlayerId) {
      return ranking[0] || null
    }

    return ranking.find((entry) => entry.id === currentPlayerId) || ranking[0] || null
  }, [currentPlayerId, ranking])

  const currentPlayerRewards = currentPlayerPlacement?.rewardSummary || null

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 56 }).map((_, index) => ({
        delay: (index % 9) * 0.18,
        duration: 4.9 + (index % 6) * 0.5,
        left: `${2 + ((index * 7) % 96)}%`,
        rotate: (index * 29) % 360,
        shape: index % 3 === 0 ? 'rounded-sm' : index % 3 === 1 ? 'rounded-full' : 'rounded-[3px]',
        tone:
          index % 5 === 0
            ? 'bg-[#ff6b6b]'
            : index % 5 === 1
              ? 'bg-[#ffd54c]'
              : index % 5 === 2
                ? 'bg-[#55d6ff]'
                : index % 5 === 3
                  ? 'bg-[#72e46f]'
                  : 'bg-[#c87dff]',
      })),
    [],
  )

  const coinPieces = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, index) => ({
        delay: (index % 6) * 0.28,
        duration: 4.6 + (index % 5) * 0.42,
        left: `${8 + ((index * 13) % 84)}%`,
        rotate: (index * 41) % 360,
        size: index % 3 === 0 ? 34 : index % 3 === 1 ? 28 : 24,
      })),
    [],
  )

  return (
    <div
      className="fixed inset-0 z-[300] overflow-x-hidden overflow-y-auto text-white"
      style={{ backgroundColor: boardTheme.backgroundColor, backgroundImage: boardTheme.backgroundImage, backgroundPosition: 'center', backgroundSize: 'cover' }}
    >
      <motion.div
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/35"
        initial={{ opacity: 0.3 }}
        transition={{ duration: 0.55 }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_82%,rgba(255,248,201,0.18),transparent_22%),radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.16),transparent_18%)]" />

      <StadiumLight className="left-[4%] top-[5%] rotate-[-8deg]" />
      <StadiumLight className="right-[4%] top-[5%] rotate-[8deg]" />

      <div className="absolute left-0 right-0 top-6 z-20 flex justify-center px-4">
        <div className="rounded-[30px] border px-5 py-4 sm:px-10" style={rankingGlassStyle}>
          <p className="text-center font-display text-[28px] uppercase leading-none sm:text-[54px]" style={{ color: surfacePalette.headerText, textShadow: '0 3px 0 rgba(90,44,6,0.4)' }}>
            {ui.finalRanking}
          </p>
          <p className="mt-2 text-center text-[14px] font-black uppercase tracking-[0.12em] sm:text-[22px]" style={{ color: surfacePalette.hudCardText }}>
            {ui.championship}
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 top-[84px] z-10 hidden h-8 items-start justify-between px-[10%] md:flex">
        {Array.from({ length: 10 }).map((_, index) => (
          <span
            className={`h-0 w-0 border-l-[16px] border-r-[16px] border-t-[28px] border-l-transparent border-r-transparent ${index % 4 === 0 ? 'border-t-[#ff7a59]' : index % 4 === 1 ? 'border-t-[#ffd34e]' : index % 4 === 2 ? 'border-t-[#52d86d]' : 'border-t-[#55b8ff]'}`}
            key={`flag-${index}`}
          />
        ))}
      </div>

      <div className="absolute bottom-[12%] left-[50%] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-white/10 blur-[70px]" />
      <div className="absolute bottom-[8%] left-0 right-0 h-[230px] bg-[linear-gradient(180deg,rgba(19,35,75,0)_0%,rgba(9,21,46,0.22)_10%,rgba(15,84,122,0.72)_60%,rgba(8,34,73,0.94)_100%)]" />

      <div className="absolute bottom-[22%] left-0 right-0 z-10 h-[260px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,248,179,0.28),transparent_30%)]" />

      <div className="absolute bottom-[17%] left-0 right-0 z-10 h-[190px] overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-[180px] bg-[linear-gradient(180deg,rgba(42,13,31,0)_0%,rgba(32,13,40,0.48)_25%,rgba(18,10,30,0.9)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 opacity-85">
          {Array.from({ length: 24 }).map((_, index) => (
            <span
              className="rounded-t-full bg-[#25153d]"
              key={`crowd-${index}`}
              style={{
                height: `${72 + (index % 6) * 18}px`,
                width: `${20 + (index % 4) * 8}px`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-[15%] left-[10%] right-[10%] z-10 hidden h-[10px] rounded-full bg-white/10 blur-md lg:block" />

      {showConfetti ? (
        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
          {confettiPieces.map((piece, index) => (
            <motion.span
              animate={{ opacity: [0, 1, 1, 0], rotate: [piece.rotate, piece.rotate + 260], y: ['-10%', '110%'] }}
              className={`absolute h-4 w-2 ${piece.shape} ${piece.tone} shadow-[0_0_8px_rgba(255,255,255,0.25)]`}
              initial={{ opacity: 0, y: '-15%' }}
              key={`confetti-${index}`}
              style={{ left: piece.left, top: '-5%' }}
              transition={{ delay: piece.delay, duration: piece.duration, ease: 'linear', repeat: Infinity }}
            />
          ))}

          {coinPieces.map((coin, index) => (
            <motion.span
              animate={{ opacity: [0, 1, 1, 0], rotate: [coin.rotate, coin.rotate + 240], y: ['-14%', '110%'] }}
              className="absolute flex items-center justify-center rounded-full border-[3px] border-[#b97812] bg-[radial-gradient(circle_at_30%_30%,#fff7b8_0%,#f8c94d_45%,#d88a18_80%,#a9650e_100%)] shadow-[0_0_16px_rgba(255,220,108,0.35),0_8px_14px_rgba(90,51,10,0.24)]"
              initial={{ opacity: 0, y: '-20%' }}
              key={`coin-${index}`}
              style={{ height: coin.size, left: coin.left, top: '-9%', width: coin.size }}
              transition={{ delay: coin.delay, duration: coin.duration, ease: 'linear', repeat: Infinity }}
            >
              <span className="font-black text-[#8d5612]" style={{ fontSize: coin.size * 0.38 }}>$</span>
            </motion.span>
          ))}

          {Array.from({ length: 18 }).map((_, index) => (
            <motion.span
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              className="absolute text-[20px]"
              initial={{ opacity: 0.2, scale: 0.7 }}
              key={`sparkle-${index}`}
              style={{ left: `${6 + ((index * 9) % 88)}%`, top: `${8 + ((index * 11) % 64)}%` }}
              transition={{ duration: 1.4 + (index % 4) * 0.3, ease: 'easeInOut', repeat: Infinity }}
            >
              ✦
            </motion.span>
          ))}
        </div>
      ) : null}

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative z-40 mx-auto flex min-h-screen max-w-[1180px] flex-col justify-end px-3 pb-24 pt-36 sm:px-6 sm:pt-40"
        initial={{ opacity: 0, y: 30 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        <div className="relative rounded-[34px] border px-5 pb-7 pt-5 sm:px-7 sm:pb-8 sm:pt-6" style={rankingGlassStyle}>
          <div className="absolute inset-x-[3%] top-[2%] h-[16%] rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0.05))] blur-sm" />
          <div className="absolute inset-0 opacity-[0.08] mix-blend-screen" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 4px)' }} />

          <div className="relative flex items-end justify-center gap-1.5 sm:gap-2 lg:gap-3 xl:gap-3.5">
            {podiumOrder.map((place, index) => {
              const entry = placementsByPlace[place]
              if (!entry) {
                return null
              }

              return <PodiumBlock delay={0.45 + index * 0.18} entry={entry} key={entry.id} ui={ui} />
            })}
          </div>

          {currentPlayerPlacement && currentPlayerRewards ? (
            <div className="relative mt-6 rounded-[28px] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-[24px] uppercase tracking-[0.08em]" style={{ color: surfacePalette.headerText }}>
                  {ui.rewardsTitle}
                </p>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/80 sm:text-sm">
                  {currentPlayerPlacement.name} · {ui.placeLabel[currentPlayerPlacement.place]}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/14 bg-black/14 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">{ui.xpEarned}</p>
                  <p className="mt-1 font-display text-[38px] leading-none text-[#fff6bc]">+{currentPlayerRewards.totalXp}</p>
                </div>
                <div className="rounded-[22px] border border-white/14 bg-black/14 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">{ui.coinsEarned}</p>
                  <p className="mt-1 font-display text-[38px] leading-none text-[#ffe7a8]">+{currentPlayerRewards.totalCoins}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm font-black text-white/88 sm:grid-cols-2">
                <div className="rounded-[18px] border border-white/12 bg-black/12 px-4 py-3">{ui.bonusQuestions}: +{currentPlayerRewards.bonusKnowledgeXp} XP</div>
                <div className="rounded-[18px] border border-white/12 bg-black/12 px-4 py-3">{ui.bonusCaptures}: +{currentPlayerRewards.bonusCapturesXp} XP</div>
                <div className="rounded-[18px] border border-white/12 bg-black/12 px-4 py-3">{ui.bonusParticipation}: +{currentPlayerRewards.bonusParticipationXp} XP</div>
              </div>
            </div>
          ) : null}
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 1.2, duration: 0.45 }}
        >
          <button
            className="rounded-[24px] border px-8 py-3 font-display text-[24px] uppercase tracking-[0.1em] text-white transition hover:brightness-105 active:translate-y-[2px]"
            onClick={() => navigate('/', { replace: true })}
            style={buttonGlassStyle}
            type="button"
          >
            {ui.backHome}
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
