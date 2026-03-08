import type { PlayerColor } from '../components/game/match-types'
import { localizeShopRarity, localizeShopText, type LocalizedText, type ShopLanguage, type ShopRarityKey } from './shop-i18n'

export type DiceSkinId =
  | 'blue'
  | 'gold'
  | 'green'
  | 'pink'
  | 'red'
  | 'starlight'
  | 'nebula'
  | 'volcano'
  | 'arctic'
  | 'jade'
  | 'meteorite'
  | 'prism'

export type DiceSkinDefinition = {
  id: DiceSkinId
  name: string
  subtitle: string
  price: number
  rarityLabel: 'Común' | 'Raro' | 'Épico' | 'Legendario'
  shellClass: string
  faceClass: string
  pipClass: string
  previewToneClass: string
  sparkleClass?: string
  overlayClass?: string
}

const diceSkinCopyById: Record<DiceSkinId, { name: LocalizedText; rarityKey: ShopRarityKey; subtitle: LocalizedText }> = {
  blue: { name: { es: 'Dados Azul Turbo', en: 'Turbo Blue Dice' }, rarityKey: 'common', subtitle: { es: 'Set clasico del jugador', en: 'Classic player set' } },
  pink: { name: { es: 'Dados Rosa Pop', en: 'Pink Pop Dice' }, rarityKey: 'rare', subtitle: { es: 'Brillo dulce y arcade', en: 'Sweet arcade glow' } },
  gold: { name: { es: 'Dados Dorados Royale', en: 'Golden Royale Dice' }, rarityKey: 'epic', subtitle: { es: 'Acabado premium brillante', en: 'Shiny premium finish' } },
  red: { name: { es: 'Dados Rojo Rush', en: 'Red Rush Dice' }, rarityKey: 'rare', subtitle: { es: 'Pulso competitivo intenso', en: 'Intense competitive pulse' } },
  green: { name: { es: 'Dados Verde Lucky', en: 'Lucky Green Dice' }, rarityKey: 'rare', subtitle: { es: 'Toque fresco y afortunado', en: 'Fresh lucky touch' } },
  starlight: { name: { es: 'Dados Starlight', en: 'Starlight Dice' }, rarityKey: 'epic', subtitle: { es: 'Version especial iridiscente', en: 'Iridescent special edition' } },
  nebula: { name: { es: 'Dado Nebulosa', en: 'Nebula Die' }, rarityKey: 'epic', subtitle: { es: 'Morado profundo con polvo de estrellas', en: 'Deep purple with stardust' } },
  volcano: { name: { es: 'Dado Volcan', en: 'Volcano Die' }, rarityKey: 'legendary', subtitle: { es: 'Roca negra con grietas de lava', en: 'Black rock with lava cracks' } },
  arctic: { name: { es: 'Dado Hielo Artico', en: 'Arctic Ice Die' }, rarityKey: 'epic', subtitle: { es: 'Cristal azul claro congelado', en: 'Frozen light-blue crystal' } },
  jade: { name: { es: 'Dado Jade Antiguo', en: 'Ancient Jade Die' }, rarityKey: 'rare', subtitle: { es: 'Piedra verde con vetas antiguas', en: 'Green stone with ancient veins' } },
  meteorite: { name: { es: 'Dado Meteorito', en: 'Meteorite Die' }, rarityKey: 'epic', subtitle: { es: 'Roca espacial de impacto', en: 'Impact-forged space rock' } },
  prism: { name: { es: 'Dado Prisma', en: 'Prism Die' }, rarityKey: 'legendary', subtitle: { es: 'Transparente con reflejos de luz', en: 'Transparent with light reflections' } },
}

export type DiceSkinAssignmentRequest = {
  playerId: string
  color: PlayerColor
  preferredSkinId?: DiceSkinId
}

export const diceSkinCatalog: DiceSkinDefinition[] = [
  {
    id: 'blue',
    name: 'Dados Azul Turbo',
    subtitle: 'Set clasico del jugador',
    price: 0,
    rarityLabel: 'Común',
    shellClass: 'border-[#5f7fb6] bg-gradient-to-b from-[#f6fbff] via-[#dcecff] to-[#b4d3ff]',
    faceClass: 'bg-gradient-to-b from-[#ffffff] via-[#ebf5ff] to-[#cfe1ff]',
    pipClass: 'bg-[#29518a]',
    previewToneClass: 'from-[#e7f1ff] to-[#c8ddff]',
    sparkleClass: 'bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.85),rgba(255,255,255,0.18)_48%,transparent_72%)]',
  },
  {
    id: 'pink',
    name: 'Dados Rosa Pop',
    subtitle: 'Brillo dulce y arcade',
    price: 350,
    rarityLabel: 'Raro',
    shellClass: 'border-[#c56a8f] bg-gradient-to-b from-[#fff1f8] via-[#ffd5ea] to-[#ffb2d5]',
    faceClass: 'bg-gradient-to-b from-[#fff8fc] via-[#ffe7f2] to-[#ffcadd]',
    pipClass: 'bg-[#b14072]',
    previewToneClass: 'from-[#ffeaf2] to-[#ffd0e2]',
    sparkleClass: 'bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.9),rgba(255,255,255,0.18)_46%,transparent_72%)]',
  },
  {
    id: 'gold',
    name: 'Dados Dorados Royale',
    subtitle: 'Acabado premium brillante',
    price: 1000,
    rarityLabel: 'Épico',
    shellClass: 'border-[#be8a19] bg-gradient-to-b from-[#fff7da] via-[#f8d775] to-[#dda53a]',
    faceClass: 'bg-gradient-to-b from-[#fffdf1] via-[#ffe9a7] to-[#f7c95a]',
    pipClass: 'bg-[#8b5600]',
    previewToneClass: 'from-[#fff4d5] to-[#eac87d]',
    sparkleClass: 'bg-[radial-gradient(circle_at_30%_30%,rgba(255,251,227,0.96),rgba(255,255,255,0.16)_44%,transparent_72%)]',
  },
  {
    id: 'red',
    name: 'Dados Rojo Rush',
    subtitle: 'Pulso competitivo intenso',
    price: 450,
    rarityLabel: 'Raro',
    shellClass: 'border-[#bf5048] bg-gradient-to-b from-[#fff1ef] via-[#ffc7c0] to-[#f28c82]',
    faceClass: 'bg-gradient-to-b from-[#fffaf9] via-[#ffe3de] to-[#ffc0b7]',
    pipClass: 'bg-[#9f2e24]',
    previewToneClass: 'from-[#ffe1de] to-[#f7b0a8]',
    sparkleClass: 'bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.85),rgba(255,255,255,0.16)_46%,transparent_72%)]',
  },
  {
    id: 'green',
    name: 'Dados Verde Lucky',
    subtitle: 'Toque fresco y afortunado',
    price: 400,
    rarityLabel: 'Raro',
    shellClass: 'border-[#5f9d58] bg-gradient-to-b from-[#f3fff0] via-[#d7f7cf] to-[#9dd88e]',
    faceClass: 'bg-gradient-to-b from-[#fbfff9] via-[#e9fbdc] to-[#c5efb5]',
    pipClass: 'bg-[#2d6f38]',
    previewToneClass: 'from-[#e9ffe7] to-[#c8f1c4]',
    sparkleClass: 'bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.9),rgba(255,255,255,0.14)_46%,transparent_72%)]',
  },
  {
    id: 'starlight',
    name: 'Dados Starlight',
    subtitle: 'Version especial iridiscente',
    price: 1200,
    rarityLabel: 'Épico',
    shellClass: 'border-[#8a78d2] bg-gradient-to-b from-[#fbf8ff] via-[#e3dcff] to-[#c5b5ff]',
    faceClass: 'bg-gradient-to-b from-[#ffffff] via-[#f0ebff] to-[#ddd1ff]',
    pipClass: 'bg-[#5d44b1]',
    previewToneClass: 'from-[#eee6ff] to-[#d3c6f9]',
    sparkleClass: 'bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.95),rgba(255,255,255,0.18)_46%,transparent_72%)]',
    overlayClass:
      'bg-[radial-gradient(circle_at_22%_22%,rgba(255,255,255,0.95)_0_6%,transparent_7%),radial-gradient(circle_at_76%_30%,rgba(255,255,255,0.88)_0_4%,transparent_5%),radial-gradient(circle_at_34%_72%,rgba(255,255,255,0.8)_0_3%,transparent_4%)]',
  },
  {
    id: 'nebula',
    name: 'Dado Nebulosa',
    subtitle: 'Morado profundo con polvo de estrellas',
    price: 950,
    rarityLabel: 'Épico',
    shellClass: 'border-[#5f4589] bg-[linear-gradient(145deg,#1c1333_0%,#32215e_35%,#5d2c8a_68%,#241747_100%)]',
    faceClass: 'bg-[linear-gradient(180deg,#30204f_0%,#52307a_55%,#2b1b46_100%)]',
    pipClass: 'bg-[#f4d8ff]',
    previewToneClass: 'from-[#2a1944] via-[#4d2e77] to-[#1f173a]',
    sparkleClass: 'bg-[radial-gradient(circle_at_26%_26%,rgba(255,255,255,0.9),rgba(255,255,255,0.14)_46%,transparent_72%)]',
    overlayClass:
      'bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.95)_0_4%,transparent_5%),radial-gradient(circle_at_72%_18%,rgba(164,208,255,0.9)_0_3%,transparent_4%),radial-gradient(circle_at_78%_68%,rgba(255,235,170,0.88)_0_3%,transparent_4%),radial-gradient(circle_at_30%_76%,rgba(255,255,255,0.84)_0_2%,transparent_3%)]',
  },
  {
    id: 'volcano',
    name: 'Dado Volcan',
    subtitle: 'Roca negra con grietas de lava',
    price: 1450,
    rarityLabel: 'Legendario',
    shellClass: 'border-[#2b1d1a] bg-[linear-gradient(145deg,#090909_0%,#242424_35%,#121212_100%)]',
    faceClass: 'bg-[linear-gradient(180deg,#2d2d2d_0%,#141414_58%,#090909_100%)]',
    pipClass: 'bg-[#ffb566]',
    previewToneClass: 'from-[#1b1716] via-[#33201c] to-[#120f0d]',
    sparkleClass: 'bg-[radial-gradient(circle_at_28%_26%,rgba(255,145,80,0.42),rgba(255,145,80,0.12)_42%,transparent_68%)]',
    overlayClass:
      'bg-[linear-gradient(140deg,transparent_0_18%,rgba(255,107,43,0.86)_19_21%,transparent_22_40%,rgba(255,153,61,0.9)_41_43%,transparent_44_65%,rgba(255,89,0,0.85)_66_69%,transparent_70_100%),linear-gradient(25deg,transparent_0_32%,rgba(255,148,72,0.72)_33_35%,transparent_36_100%)]',
  },
  {
    id: 'arctic',
    name: 'Dado Hielo Artico',
    subtitle: 'Cristal azul claro congelado',
    price: 900,
    rarityLabel: 'Épico',
    shellClass: 'border-[#7ab8db] bg-[linear-gradient(145deg,#effdff_0%,#c8f0ff_38%,#8fd1ef_100%)]',
    faceClass: 'bg-[linear-gradient(180deg,#ffffff_0%,#ddf7ff_55%,#bee9fb_100%)]',
    pipClass: 'bg-[#418ebd]',
    previewToneClass: 'from-[#edfaff] via-[#d1f2ff] to-[#b6e4f5]',
    sparkleClass: 'bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.98),rgba(255,255,255,0.18)_44%,transparent_70%)]',
    overlayClass:
      'bg-[linear-gradient(140deg,transparent_0_18%,rgba(255,255,255,0.8)_19_20%,transparent_21_40%,rgba(185,237,255,0.7)_41_42%,transparent_43_100%),linear-gradient(28deg,transparent_0_58%,rgba(255,255,255,0.55)_59_60%,transparent_61_100%)]',
  },
  {
    id: 'jade',
    name: 'Dado Jade Antiguo',
    subtitle: 'Piedra verde con vetas antiguas',
    price: 780,
    rarityLabel: 'Raro',
    shellClass: 'border-[#4a7f62] bg-[linear-gradient(145deg,#e0f7ea_0%,#99d4b2_35%,#5c9876_100%)]',
    faceClass: 'bg-[linear-gradient(180deg,#eefaf2_0%,#c6e8d0_52%,#9dc8ad_100%)]',
    pipClass: 'bg-[#2d5f43]',
    previewToneClass: 'from-[#ecfff3] via-[#c7ebd7] to-[#98cbae]',
    sparkleClass: 'bg-[radial-gradient(circle_at_26%_28%,rgba(255,255,255,0.82),rgba(255,255,255,0.12)_44%,transparent_70%)]',
    overlayClass:
      'bg-[linear-gradient(120deg,transparent_0_22%,rgba(84,122,95,0.35)_23_24%,transparent_25_48%,rgba(68,112,84,0.38)_49_50%,transparent_51_100%),linear-gradient(30deg,transparent_0_64%,rgba(46,88,62,0.32)_65_66%,transparent_67_100%)]',
  },
  {
    id: 'meteorite',
    name: 'Dado Meteorito',
    subtitle: 'Roca espacial de impacto',
    price: 1025,
    rarityLabel: 'Épico',
    shellClass: 'border-[#5d6167] bg-[linear-gradient(145deg,#888c95_0%,#5c6169_38%,#30343a_100%)]',
    faceClass: 'bg-[linear-gradient(180deg,#c3c7cf_0%,#9399a4_52%,#666b74_100%)]',
    pipClass: 'bg-[#f5f7fb]',
    previewToneClass: 'from-[#d2d7df] via-[#969ca7] to-[#686d76]',
    sparkleClass: 'bg-[radial-gradient(circle_at_28%_28%,rgba(255,255,255,0.6),rgba(255,255,255,0.1)_44%,transparent_70%)]',
    overlayClass:
      'bg-[radial-gradient(circle_at_28%_32%,rgba(48,52,58,0.42)_0_11%,transparent_12%),radial-gradient(circle_at_70%_26%,rgba(58,62,68,0.38)_0_9%,transparent_10%),radial-gradient(circle_at_62%_70%,rgba(50,54,60,0.34)_0_8%,transparent_9%)]',
  },
  {
    id: 'prism',
    name: 'Dado Prisma',
    subtitle: 'Transparente con reflejos de luz',
    price: 1350,
    rarityLabel: 'Legendario',
    shellClass: 'border-[#a8b2d8] bg-[linear-gradient(145deg,rgba(255,255,255,0.92)_0%,rgba(226,238,255,0.86)_38%,rgba(197,211,255,0.8)_100%)]',
    faceClass: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(240,248,255,0.72)_48%,rgba(214,226,255,0.68)_100%)]',
    pipClass: 'bg-[#6f79b0]',
    previewToneClass: 'from-[#fcf8ff] via-[#e6eeff] to-[#d8defb]',
    sparkleClass: 'bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.98),rgba(255,255,255,0.28)_44%,transparent_72%)]',
    overlayClass:
      'bg-[linear-gradient(135deg,transparent_0_18%,rgba(255,102,153,0.22)_19_26%,rgba(126,183,255,0.18)_27_40%,rgba(139,255,214,0.18)_41_58%,rgba(255,223,120,0.18)_59_74%,transparent_75_100%)]',
  },
]

const diceSkinIds = new Set<DiceSkinId>(diceSkinCatalog.map((skin) => skin.id))

export const normalizeDiceSkinId = (value: unknown): DiceSkinId => {
  if (typeof value === 'string' && diceSkinIds.has(value as DiceSkinId)) {
    return value as DiceSkinId
  }

  return 'blue'
}

export const normalizeOwnedDiceSkinIds = (value: unknown, selectedDiceSkinId: DiceSkinId): DiceSkinId[] => {
  const provided = Array.isArray(value) ? value.map((entry) => normalizeDiceSkinId(entry)) : []
  const unique = new Set<DiceSkinId>([selectedDiceSkinId, ...provided])

  if (unique.size === 0) {
    unique.add('blue')
  }

  return Array.from(unique)
}

export const getDiceSkinDefinition = (skinId: DiceSkinId) =>
  diceSkinCatalog.find((skin) => skin.id === skinId) || diceSkinCatalog[0]

export const getDiceSkinName = (skinId: DiceSkinId, language: ShopLanguage) =>
  localizeShopText(diceSkinCopyById[skinId]?.name || diceSkinCopyById.blue.name, language)

export const getDiceSkinSubtitle = (skinId: DiceSkinId, language: ShopLanguage) =>
  localizeShopText(diceSkinCopyById[skinId]?.subtitle || diceSkinCopyById.blue.subtitle, language)

export const getDiceSkinRarityLabel = (skinId: DiceSkinId, language: ShopLanguage) =>
  localizeShopRarity(diceSkinCopyById[skinId]?.rarityKey || 'common', language)

export const diceSkinIndexFromId = (skinId: DiceSkinId): number => {
  const index = diceSkinCatalog.findIndex((skin) => skin.id === skinId)
  return index >= 0 ? index : 0
}

export const diceSkinIdFromIndex = (index: number): DiceSkinId => {
  return diceSkinCatalog[index]?.id || 'blue'
}

const defaultDiceSkinIdByColor: Record<PlayerColor, DiceSkinId> = {
  blue: 'blue',
  green: 'green',
  red: 'red',
  yellow: 'gold',
}

const diceSkinAssignmentOrder: DiceSkinId[] = [
  'blue',
  'red',
  'green',
  'gold',
  'pink',
  'starlight',
  'nebula',
  'jade',
  'arctic',
  'meteorite',
  'volcano',
  'prism',
]

export const getDefaultDiceSkinIdByColor = (color: PlayerColor): DiceSkinId => defaultDiceSkinIdByColor[color]

export const assignDistinctDiceSkins = (players: DiceSkinAssignmentRequest[]) => {
  const assigned: Record<string, DiceSkinId> = {}
  const usedSkins = new Set<DiceSkinId>()

  players.forEach((player) => {
    const preferredChoices: DiceSkinId[] = []

    if (player.preferredSkinId) {
      preferredChoices.push(player.preferredSkinId)
    }

    preferredChoices.push(getDefaultDiceSkinIdByColor(player.color))

    const fallbackChoices = diceSkinAssignmentOrder.filter((skinId) => !preferredChoices.includes(skinId))
    const nextSkinId = [...preferredChoices, ...fallbackChoices].find((skinId) => !usedSkins.has(skinId)) || preferredChoices[0] || 'blue'

    assigned[player.playerId] = nextSkinId
    usedSkins.add(nextSkinId)
  })

  return assigned
}
