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
  orange: {
    avatarToneClass: 'from-[#ffe4c6] via-[#ffb46e] to-[#e16b1b]',
    boardCenterColor: '#ea7c2d',
    homePalette: {
      ring: 'bg-[#de6417] border-[#7a2b05]',
      inner: 'bg-[#fff0df] border-[#bc5f1b]',
      slot: 'bg-[#ffd6b1]',
      slotBorder: 'border-[#d98f57]',
    },
    hudAccentClass: 'bg-[#ffa05e] text-[#4d1f04]',
    laneFillClass: 'bg-[#f3a15b]',
    laneTextClass: 'text-[#4d1f04] border-[#b56428]',
    stripClass: 'bg-[#e16b1b]',
  },
  turquoise: {
    avatarToneClass: 'from-[#dbfffd] via-[#92f0ec] to-[#2da8b0]',
    boardCenterColor: '#39b7bc',
    homePalette: {
      ring: 'bg-[#1d9ea3] border-[#0f5358]',
      inner: 'bg-[#efffff] border-[#3d9ca1]',
      slot: 'bg-[#cef6f3]',
      slotBorder: 'border-[#72bdb8]',
    },
    hudAccentClass: 'bg-[#5fddd7] text-[#0b3a3d]',
    laneFillClass: 'bg-[#66d4d1]',
    laneTextClass: 'text-[#0d3f43] border-[#2d8d92]',
    stripClass: 'bg-[#2da8b0]',
  },
  brown: {
    avatarToneClass: 'from-[#f4e7d8] via-[#c99667] to-[#7a4926]',
    boardCenterColor: '#a56c42',
    homePalette: {
      ring: 'bg-[#91572f] border-[#4f2813]',
      inner: 'bg-[#fff4e7] border-[#a46f48]',
      slot: 'bg-[#ecd5bf]',
      slotBorder: 'border-[#b68a68]',
    },
    hudAccentClass: 'bg-[#c98a58] text-[#3f2110]',
    laneFillClass: 'bg-[#c48b5e]',
    laneTextClass: 'text-[#412313] border-[#8e5e3a]',
    stripClass: 'bg-[#7a4926]',
  },
  gold: {
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
  purple: {
    avatarToneClass: 'from-[#f2e6ff] via-[#c9a6ff] to-[#7a56d6]',
    boardCenterColor: '#9a72e0',
    homePalette: {
      ring: 'bg-[#875dcf] border-[#45258d]',
      inner: 'bg-[#f7f1ff] border-[#9271d5]',
      slot: 'bg-[#e9dbff]',
      slotBorder: 'border-[#b295e5]',
    },
    hudAccentClass: 'bg-[#b58df7] text-[#321657]',
    laneFillClass: 'bg-[#b18ae9]',
    laneTextClass: 'text-[#33195d] border-[#6f46b0]',
    stripClass: 'bg-[#7a56d6]',
  },
  black: {
    avatarToneClass: 'from-[#e8edf3] via-[#8e9aac] to-[#2a303a]',
    boardCenterColor: '#4d5664',
    homePalette: {
      ring: 'bg-[#353c47] border-[#10151b]',
      inner: 'bg-[#f6f8fb] border-[#647085]',
      slot: 'bg-[#dbe1ea]',
      slotBorder: 'border-[#8c97a6]',
    },
    hudAccentClass: 'bg-[#687487] text-[#f7fafc]',
    laneFillClass: 'bg-[#7b8798]',
    laneTextClass: 'text-[#15202f] border-[#4c5667]',
    stripClass: 'bg-[#2a303a]',
  },
  silver: {
    avatarToneClass: 'from-[#f6faff] via-[#d6deeb] to-[#96a3b5]',
    boardCenterColor: '#bcc8d8',
    homePalette: {
      ring: 'bg-[#adb9ca] border-[#5d6877]',
      inner: 'bg-[#ffffff] border-[#b7c2d3]',
      slot: 'bg-[#eef3fa]',
      slotBorder: 'border-[#bac5d4]',
    },
    hudAccentClass: 'bg-[#d9e2ee] text-[#334155]',
    laneFillClass: 'bg-[#d7e0eb]',
    laneTextClass: 'text-[#334155] border-[#8f9cad]',
    stripClass: 'bg-[#96a3b5]',
  },
  rainbow: {
    avatarToneClass: 'from-[#ffd3eb] via-[#b8d3ff] to-[#ffe082]',
    boardCenterColor: '#c784d9',
    homePalette: {
      ring: 'bg-[linear-gradient(135deg,#ff7ab8_0%,#8a7dff_34%,#3ccdb8_68%,#ffbf4a_100%)] border-[#6d4295]',
      inner: 'bg-[#fff8ff] border-[#d6b5ff]',
      slot: 'bg-[#fff1ff]',
      slotBorder: 'border-[#c7a7e7]',
    },
    hudAccentClass: 'bg-[linear-gradient(135deg,#ff7ab8_0%,#8a7dff_48%,#47d8b2_100%)] text-white',
    laneFillClass: 'bg-[linear-gradient(90deg,#ff8fbf_0%,#89b0ff_45%,#62d8bf_72%,#ffd36b_100%)]',
    laneTextClass: 'text-[#4f2058] border-[#935ca6]',
    stripClass: 'bg-[linear-gradient(90deg,#ff74b7_0%,#8a7dff_45%,#43d1b7_72%,#ffbe48_100%)]',
  },
  crystal: {
    avatarToneClass: 'from-[#f7fdff] via-[#dceeff] to-[#abcdf0]',
    boardCenterColor: '#b9d9f4',
    homePalette: {
      ring: 'bg-[#8ec0e8] border-[#5c8db4]',
      inner: 'bg-[#fbfeff] border-[#b7d8f2]',
      slot: 'bg-[#ebf7ff]',
      slotBorder: 'border-[#b4d0e6]',
    },
    hudAccentClass: 'bg-[#d7edff] text-[#31516b]',
    laneFillClass: 'bg-[#cae7fb]',
    laneTextClass: 'text-[#31516b] border-[#8ab2cf]',
    stripClass: 'bg-[#9ec7e8]',
  },
  lava: {
    avatarToneClass: 'from-[#291816] via-[#54261d] to-[#190b0a]',
    boardCenterColor: '#d1642a',
    homePalette: {
      ring: 'bg-[#251817] border-[#090909]',
      inner: 'bg-[#362320] border-[#8f441f]',
      slot: 'bg-[#5f2d21]',
      slotBorder: 'border-[#c36d3d]',
    },
    hudAccentClass: 'bg-[#ef8a4e] text-[#451d0b]',
    laneFillClass: 'bg-[#cb5d2e]',
    laneTextClass: 'text-[#ffe1c5] border-[#7f2b14]',
    stripClass: 'bg-[#221110]',
  },
  pearl: {
    avatarToneClass: 'from-[#fffef8] via-[#f3edff] to-[#e8ded8]',
    boardCenterColor: '#efe3df',
    homePalette: {
      ring: 'bg-[#e4d8d4] border-[#b79f9c]',
      inner: 'bg-[#fffefb] border-[#ddd0d5]',
      slot: 'bg-[#faf4f3]',
      slotBorder: 'border-[#d8c7cf]',
    },
    hudAccentClass: 'bg-[#f4ecec] text-[#6d5a58]',
    laneFillClass: 'bg-[#efe6e4]',
    laneTextClass: 'text-[#6d5a58] border-[#ccb7b3]',
    stripClass: 'bg-[#ddcfcd]',
  },
  steel: {
    avatarToneClass: 'from-[#f2f7fb] via-[#c5cfdb] to-[#8895a7]',
    boardCenterColor: '#aeb9c7',
    homePalette: {
      ring: 'bg-[#7e8a99] border-[#4a5562]',
      inner: 'bg-[#f5f8fc] border-[#b5bfca]',
      slot: 'bg-[#dde4ec]',
      slotBorder: 'border-[#97a4b0]',
    },
    hudAccentClass: 'bg-[#d5dde7] text-[#334150]',
    laneFillClass: 'bg-[#c7d0da]',
    laneTextClass: 'text-[#334150] border-[#7e8a99]',
    stripClass: 'bg-[#8f9bab]',
  },
  obsidian: {
    avatarToneClass: 'from-[#23242c] via-[#3b3745] to-[#0b0c12]',
    boardCenterColor: '#2f2f3f',
    homePalette: {
      ring: 'bg-[#181922] border-[#06070c]',
      inner: 'bg-[#302e38] border-[#59546d]',
      slot: 'bg-[#444053]',
      slotBorder: 'border-[#746b92]',
    },
    hudAccentClass: 'bg-[#5d5871] text-[#f5f2ff]',
    laneFillClass: 'bg-[#4a465b]',
    laneTextClass: 'text-[#ece7ff] border-[#706992]',
    stripClass: 'bg-[#181922]',
  },
  amber: {
    avatarToneClass: 'from-[#fff2cf] via-[#ffc975] to-[#cf7521]',
    boardCenterColor: '#e5a240',
    homePalette: {
      ring: 'bg-[#cf7b1c] border-[#8a4d0e]',
      inner: 'bg-[#fff5df] border-[#dfaa55]',
      slot: 'bg-[#ffe1ad]',
      slotBorder: 'border-[#d39b46]',
    },
    hudAccentClass: 'bg-[#ffc268] text-[#5f3507]',
    laneFillClass: 'bg-[#f0b35e]',
    laneTextClass: 'text-[#5f3507] border-[#bf7b21]',
    stripClass: 'bg-[#d78b2f]',
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
