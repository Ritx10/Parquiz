import type { PlayerColor } from '../components/game/match-types'
import type { TokenSkinId } from './token-cosmetics'

export type PlayerVisualTheme = {
  avatarToneClass: string
  boardCenterColor: string
  homePalette: {
    inner: string
    ring: string
    slot: string
    slotBorder: string
  }
  hudAccentClass: string
  laneFillClass: string
  laneTextClass: string
  stripClass: string
}

const playerVisualThemes: Record<TokenSkinId, PlayerVisualTheme> = {
  pink: {
    avatarToneClass: 'from-[#ffe4f1] via-[#f7a8cf] to-[#d96a9f]',
    boardCenterColor: '#d87eac',
    homePalette: {
      ring: 'bg-[#c36293] border-[#7e3a5d]',
      inner: 'bg-[#f8ecf3] border-[#a65d83]',
      slot: 'bg-[#ffd8ea]',
      slotBorder: 'border-[#bf80a0]',
    },
    hudAccentClass: 'bg-[#ec8fba] text-[#5b1738]',
    laneFillClass: 'bg-[#d87eac]',
    laneTextClass: 'text-[#5b1738] border-[#964d74]',
    stripClass: 'bg-[#d96a9f]',
  },
  red: {
    avatarToneClass: 'from-[#ffd9d9] via-[#ff9f95] to-[#d85d4f]',
    boardCenterColor: '#d74236',
    homePalette: {
      ring: 'bg-[#cf1f32] border-[#6f101c]',
      inner: 'bg-[#f2e9d2] border-[#83252f]',
      slot: 'bg-[#f8c8cf]',
      slotBorder: 'border-[#8a3e45]',
    },
    hudAccentClass: 'bg-[#ff6d5e] text-[#4a1008]',
    laneFillClass: 'bg-[#de5549]',
    laneTextClass: 'text-[#3a120f] border-[#8d241e]',
    stripClass: 'bg-[#d74236]',
  },
  blue: {
    avatarToneClass: 'from-[#d6edff] via-[#8fd4ff] to-[#3e93df]',
    boardCenterColor: '#3d96e7',
    homePalette: {
      ring: 'bg-[#2f9ae8] border-[#16508b]',
      inner: 'bg-[#f2e9d2] border-[#2d6caa]',
      slot: 'bg-[#cde8fb]',
      slotBorder: 'border-[#4b7cae]',
    },
    hudAccentClass: 'bg-[#4a9bff] text-[#0d3058]',
    laneFillClass: 'bg-[#58aef2]',
    laneTextClass: 'text-[#0e2d4b] border-[#16508c]',
    stripClass: 'bg-[#3d96e7]',
  },
  green: {
    avatarToneClass: 'from-[#dcffe6] via-[#9ef0b4] to-[#4caf6b]',
    boardCenterColor: '#208a77',
    homePalette: {
      ring: 'bg-[#208a77] border-[#0f4b41]',
      inner: 'bg-[#f2e9d2] border-[#1d7667]',
      slot: 'bg-[#cceede]',
      slotBorder: 'border-[#4f8c7e]',
    },
    hudAccentClass: 'bg-[#2bc58d] text-[#0b3d2d]',
    laneFillClass: 'bg-[#61bc74]',
    laneTextClass: 'text-[#153d20] border-[#266c4f]',
    stripClass: 'bg-[#208a77]',
  },
  yellow: {
    avatarToneClass: 'from-[#fff6d6] via-[#ffe48a] to-[#d2ae3e]',
    boardCenterColor: '#efc53a',
    homePalette: {
      ring: 'bg-[#e9c42a] border-[#8c6f08]',
      inner: 'bg-[#f2e9d2] border-[#b18b10]',
      slot: 'bg-[#fbeeba]',
      slotBorder: 'border-[#a78320]',
    },
    hudAccentClass: 'bg-[#f4cc4e] text-[#4a3404]',
    laneFillClass: 'bg-[#f4d34d]',
    laneTextClass: 'text-[#4f3806] border-[#9f7b10]',
    stripClass: 'bg-[#e9c42a]',
  },
  fire: {
    avatarToneClass: 'from-[#ffe1b2] via-[#ff9a5c] to-[#d84a1b]',
    boardCenterColor: '#ed7a2a',
    homePalette: {
      ring: 'bg-[#db5f18] border-[#7b2507]',
      inner: 'bg-[#fff0df] border-[#b84c18]',
      slot: 'bg-[#ffd2ae]',
      slotBorder: 'border-[#d27f4c]',
    },
    hudAccentClass: 'bg-[#ff9652] text-[#4e1900]',
    laneFillClass: 'bg-[#f09a54]',
    laneTextClass: 'text-[#4e1900] border-[#b35a1c]',
    stripClass: 'bg-[#e56c21]',
  },
  ice: {
    avatarToneClass: 'from-[#ebfbff] via-[#bfeaff] to-[#73b9ff]',
    boardCenterColor: '#7ac8f7',
    homePalette: {
      ring: 'bg-[#7ac8f7] border-[#376b9b]',
      inner: 'bg-[#f5fdff] border-[#77a8d3]',
      slot: 'bg-[#dbf4ff]',
      slotBorder: 'border-[#8cb9d8]',
    },
    hudAccentClass: 'bg-[#94dcff] text-[#163e68]',
    laneFillClass: 'bg-[#a1daf8]',
    laneTextClass: 'text-[#163e68] border-[#5e96bf]',
    stripClass: 'bg-[#73b9ff]',
  },
  jungle: {
    avatarToneClass: 'from-[#e7ffd9] via-[#aee17e] to-[#4e9856]',
    boardCenterColor: '#74b86b',
    homePalette: {
      ring: 'bg-[#5b9a49] border-[#2d5728]',
      inner: 'bg-[#eff8e3] border-[#5f8e54]',
      slot: 'bg-[#daf2c7]',
      slotBorder: 'border-[#7da06b]',
    },
    hudAccentClass: 'bg-[#8ed36b] text-[#224315]',
    laneFillClass: 'bg-[#90c97b]',
    laneTextClass: 'text-[#224315] border-[#537d45]',
    stripClass: 'bg-[#4e9856]',
  },
  royal: {
    avatarToneClass: 'from-[#fff4c2] via-[#f1d36c] to-[#b07d18]',
    boardCenterColor: '#d2ab4b',
    homePalette: {
      ring: 'bg-[#c2962c] border-[#6e4a0a]',
      inner: 'bg-[#fff8e4] border-[#af8a2d]',
      slot: 'bg-[#f8ecc1]',
      slotBorder: 'border-[#c3a35a]',
    },
    hudAccentClass: 'bg-[#f1cd64] text-[#513708]',
    laneFillClass: 'bg-[#e2c162]',
    laneTextClass: 'text-[#513708] border-[#a37c1a]',
    stripClass: 'bg-[#b98a25]',
  },
}

export const resolvePlayerVisualSkinId = (visualSkinId: TokenSkinId | undefined, color: PlayerColor): TokenSkinId => {
  if (visualSkinId) {
    return visualSkinId
  }

  return color
}

export const getPlayerVisualTheme = (skinId: TokenSkinId): PlayerVisualTheme => playerVisualThemes[skinId]

export const getPlayerVisualThemeByColor = (color: PlayerColor, visualSkinId?: TokenSkinId) =>
  getPlayerVisualTheme(resolvePlayerVisualSkinId(visualSkinId, color))
