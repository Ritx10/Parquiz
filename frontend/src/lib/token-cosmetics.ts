import { localizeShopRarity, localizeShopText, type LocalizedText, type ShopLanguage, type ShopRarityKey } from './shop-i18n'

export type TokenSkinId =
  | 'pink'
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'turquoise'
  | 'brown'
  | 'gold'
  | 'purple'
  | 'black'
  | 'silver'
  | 'rainbow'
  | 'crystal'
  | 'lava'
  | 'pearl'
  | 'steel'
  | 'obsidian'
  | 'amber'

export type TokenSkinTier = 'free' | 'premium'

export type TokenSkinDefinition = {
  id: TokenSkinId
  index: number
  name: string
  price: number
  previewToneClass: string
  rarityLabel: 'Común' | 'Raro' | 'Épico' | 'Legendario'
  shellClass: string
  innerClass: string
  shineClass?: string
  textureClass?: string
  tier: TokenSkinTier
}

const tokenSkinCopyById: Record<TokenSkinId, { name: LocalizedText; rarityKey: ShopRarityKey; subtitle: LocalizedText }> = {
  pink: { name: { es: 'Rosado', en: 'Pink' }, rarityKey: 'rare', subtitle: { es: 'Ficha premium delicada', en: 'Delicate premium token' } },
  red: { name: { es: 'Rojo', en: 'Red' }, rarityKey: 'common', subtitle: { es: 'Ficha equipable', en: 'Equippable token' } },
  blue: { name: { es: 'Azul', en: 'Blue' }, rarityKey: 'common', subtitle: { es: 'Ficha equipable', en: 'Equippable token' } },
  green: { name: { es: 'Verde', en: 'Green' }, rarityKey: 'common', subtitle: { es: 'Ficha equipable', en: 'Equippable token' } },
  yellow: { name: { es: 'Amarillo', en: 'Yellow' }, rarityKey: 'common', subtitle: { es: 'Ficha equipable', en: 'Equippable token' } },
  orange: { name: { es: 'Naranja', en: 'Orange' }, rarityKey: 'rare', subtitle: { es: 'Ficha premium vibrante', en: 'Vibrant premium token' } },
  turquoise: { name: { es: 'Turquesa', en: 'Turquoise' }, rarityKey: 'rare', subtitle: { es: 'Ficha premium marina', en: 'Oceanic premium token' } },
  brown: { name: { es: 'Cafe', en: 'Brown' }, rarityKey: 'epic', subtitle: { es: 'Ficha premium terrosa', en: 'Earthy premium token' } },
  gold: { name: { es: 'Dorado', en: 'Gold' }, rarityKey: 'epic', subtitle: { es: 'Ficha premium brillante', en: 'Shining premium token' } },
  purple: { name: { es: 'Morado', en: 'Purple' }, rarityKey: 'rare', subtitle: { es: 'Ficha premium magica', en: 'Magical premium token' } },
  black: { name: { es: 'Negro', en: 'Black' }, rarityKey: 'epic', subtitle: { es: 'Ficha premium elegante', en: 'Elegant premium token' } },
  silver: { name: { es: 'Plateado', en: 'Silver' }, rarityKey: 'epic', subtitle: { es: 'Ficha premium metalica', en: 'Metallic premium token' } },
  rainbow: { name: { es: 'Arcoiris', en: 'Rainbow' }, rarityKey: 'legendary', subtitle: { es: 'Ficha multicolor premium', en: 'Premium multicolor token' } },
  crystal: { name: { es: 'Cristal', en: 'Crystal' }, rarityKey: 'epic', subtitle: { es: 'Ficha transparente cristalina', en: 'Transparent crystal token' } },
  lava: { name: { es: 'Lava', en: 'Lava' }, rarityKey: 'legendary', subtitle: { es: 'Ficha de magma encendido', en: 'Molten magma token' } },
  pearl: { name: { es: 'Perla', en: 'Pearl' }, rarityKey: 'epic', subtitle: { es: 'Ficha nacarada luminosa', en: 'Lustrous pearly token' } },
  steel: { name: { es: 'Acero', en: 'Steel' }, rarityKey: 'epic', subtitle: { es: 'Ficha metalica resistente', en: 'Resilient steel token' } },
  obsidian: { name: { es: 'Obsidiana', en: 'Obsidian' }, rarityKey: 'legendary', subtitle: { es: 'Ficha negra brillante', en: 'Glossy black token' } },
  amber: { name: { es: 'Ambar', en: 'Amber' }, rarityKey: 'epic', subtitle: { es: 'Ficha translucida anaranjada', en: 'Translucent amber token' } },
}

const tokenSkins: TokenSkinDefinition[] = [
  {
    id: 'pink',
    index: 0,
    name: 'Rosado',
    price: 350,
    previewToneClass: 'from-[#ffe6f1] to-[#f8bfd9]',
    rarityLabel: 'Raro',
    shellClass: 'from-[#ffd3e9] via-[#f487b8] to-[#cf4b86] border-[#8c2958]',
    innerClass: 'bg-[#fff0f7] border-[#f6bdd8]',
    tier: 'premium',
  },
  {
    id: 'red',
    index: 1,
    name: 'Rojo',
    price: 0,
    previewToneClass: 'from-[#ffe4de] to-[#ffc5bc]',
    rarityLabel: 'Común',
    shellClass: 'from-[#ffb7a9] via-[#f34d47] to-[#bb1d1d] border-[#7b1717]',
    innerClass: 'bg-[#fff3ef] border-[#f0c1ba]',
    tier: 'free',
  },
  {
    id: 'blue',
    index: 2,
    name: 'Azul',
    price: 0,
    previewToneClass: 'from-[#e3f0ff] to-[#bcd9ff]',
    rarityLabel: 'Común',
    shellClass: 'from-[#afd7ff] via-[#3087ef] to-[#1555c8] border-[#173d89]',
    innerClass: 'bg-[#eef7ff] border-[#bfd7f3]',
    tier: 'free',
  },
  {
    id: 'green',
    index: 3,
    name: 'Verde',
    price: 0,
    previewToneClass: 'from-[#e5ffe8] to-[#bdecc8]',
    rarityLabel: 'Común',
    shellClass: 'from-[#c1f8a8] via-[#41c43d] to-[#16852a] border-[#1c5a1f]',
    innerClass: 'bg-[#f0fff0] border-[#cce8c9]',
    tier: 'free',
  },
  {
    id: 'yellow',
    index: 4,
    name: 'Amarillo',
    price: 0,
    previewToneClass: 'from-[#fff6d9] to-[#f6e09a]',
    rarityLabel: 'Común',
    shellClass: 'from-[#fff4a8] via-[#ffd43a] to-[#e2a200] border-[#9b6c00]',
    innerClass: 'bg-[#fffbea] border-[#f1e4b3]',
    tier: 'free',
  },
  {
    id: 'orange',
    index: 5,
    name: 'Naranja',
    price: 700,
    previewToneClass: 'from-[#ffe9d6] to-[#ffca9d]',
    rarityLabel: 'Raro',
    shellClass: 'from-[#ffe17a] via-[#ff7b2d] to-[#d73b12] border-[#8a270d]',
    innerClass: 'bg-[#fff4df] border-[#ffc48d]',
    tier: 'premium',
  },
  {
    id: 'turquoise',
    index: 6,
    name: 'Turquesa',
    price: 700,
    previewToneClass: 'from-[#e6ffff] to-[#b9f2f1]',
    rarityLabel: 'Raro',
    shellClass: 'from-[#d3ffff] via-[#48d5cf] to-[#159aa2] border-[#0d6671]',
    innerClass: 'bg-[#f1ffff] border-[#bceceb]',
    tier: 'premium',
  },
  {
    id: 'brown',
    index: 7,
    name: 'Cafe',
    price: 900,
    previewToneClass: 'from-[#f6eadb] to-[#d8b48f]',
    rarityLabel: 'Épico',
    shellClass: 'from-[#f0d4b4] via-[#a86c3e] to-[#6a3b1d] border-[#4f2813]',
    innerClass: 'bg-[#fff5ea] border-[#d0b08f]',
    tier: 'premium',
  },
  {
    id: 'gold',
    index: 8,
    name: 'Dorado',
    price: 1200,
    previewToneClass: 'from-[#fff4d7] to-[#f0d18f]',
    rarityLabel: 'Épico',
    shellClass: 'from-[#fff0a0] via-[#d8b342] to-[#9d6a0c] border-[#694507]',
    innerClass: 'bg-[#fff8e7] border-[#edd8aa]',
    tier: 'premium',
  },
  {
    id: 'purple',
    index: 9,
    name: 'Morado',
    price: 650,
    previewToneClass: 'from-[#f0e5ff] to-[#d4bbff]',
    rarityLabel: 'Raro',
    shellClass: 'from-[#edd8ff] via-[#9b65f5] to-[#6534b9] border-[#4a2386]',
    innerClass: 'bg-[#faf4ff] border-[#d5c2f2]',
    tier: 'premium',
  },
  {
    id: 'black',
    index: 10,
    name: 'Negro',
    price: 800,
    previewToneClass: 'from-[#eef0f3] to-[#bcc2cb]',
    rarityLabel: 'Épico',
    shellClass: 'from-[#6d7788] via-[#343b47] to-[#12161d] border-[#080b10]',
    innerClass: 'bg-[#f5f7fa] border-[#cfd5dd]',
    tier: 'premium',
  },
  {
    id: 'silver',
    index: 11,
    name: 'Plateado',
    price: 950,
    previewToneClass: 'from-[#f5f9ff] to-[#d9e1f0]',
    rarityLabel: 'Épico',
    shellClass: 'from-[#f8fbff] via-[#c7d2e3] to-[#8d99ab] border-[#657082]',
    innerClass: 'bg-[#ffffff] border-[#d7deeb]',
    tier: 'premium',
  },
  {
    id: 'rainbow',
    index: 12,
    name: 'Arcoiris',
    price: 1400,
    previewToneClass: 'from-[#ffe8f5] via-[#e8f7ff] to-[#fff1cb]',
    rarityLabel: 'Legendario',
    shellClass: 'from-[#ff73b8] via-[#7f7cff] via-[#45d3b3] to-[#ffb347] border-[#6a3c8f]',
    innerClass: 'bg-[#fffefc] border-[#e7d7ff]',
    tier: 'premium',
  },
  {
    id: 'crystal',
    index: 13,
    name: 'Cristal',
    price: 950,
    previewToneClass: 'from-[#f3fbff] via-[#dff0ff] to-[#c6def9]',
    rarityLabel: 'Épico',
    shellClass: 'from-[#fbffff] via-[#bfe6ff] to-[#8fbfe8] border-[#72a8c8]',
    innerClass: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(229,245,255,0.72))] border-[#cae4f8]',
    textureClass: 'bg-[linear-gradient(135deg,transparent_0_20%,rgba(255,255,255,0.78)_21_25%,transparent_26_45%,rgba(184,231,255,0.55)_46_50%,transparent_51_100%)]',
    shineClass: 'bg-[radial-gradient(circle_at_28%_26%,rgba(255,255,255,0.98),rgba(255,255,255,0.22)_44%,transparent_70%)]',
    tier: 'premium',
  },
  {
    id: 'lava',
    index: 14,
    name: 'Lava',
    price: 1500,
    previewToneClass: 'from-[#251717] via-[#40201c] to-[#180d0c]',
    rarityLabel: 'Legendario',
    shellClass: 'from-[#111111] via-[#2a2220] to-[#090909] border-[#2b1710]',
    innerClass: 'bg-[linear-gradient(180deg,#1f1b1a_0%,#0f0d0c_100%)] border-[#533126]',
    textureClass:
      'bg-[linear-gradient(140deg,transparent_0_18%,rgba(255,92,33,0.9)_19_21%,transparent_22_42%,rgba(255,148,56,0.88)_43_45%,transparent_46_68%,rgba(255,72,0,0.85)_69_72%,transparent_73_100%)]',
    shineClass: 'bg-[radial-gradient(circle_at_30%_26%,rgba(255,168,103,0.5),rgba(255,168,103,0.14)_46%,transparent_72%)]',
    tier: 'premium',
  },
  {
    id: 'pearl',
    index: 15,
    name: 'Perla',
    price: 1000,
    previewToneClass: 'from-[#fffdf7] via-[#f0ebff] to-[#efe1d6]',
    rarityLabel: 'Épico',
    shellClass: 'from-[#fffef6] via-[#f0ecff] to-[#e4d4cd] border-[#c9b6b2]',
    innerClass: 'bg-[linear-gradient(180deg,#ffffff_0%,#faf6ff_60%,#f4eee7_100%)] border-[#e5d8da]',
    textureClass: 'bg-[linear-gradient(115deg,rgba(255,255,255,0.2)_0%,rgba(239,219,255,0.42)_46%,rgba(255,242,220,0.28)_100%)]',
    shineClass: 'bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.98),rgba(255,255,255,0.22)_46%,transparent_72%)]',
    tier: 'premium',
  },
  {
    id: 'steel',
    index: 16,
    name: 'Acero',
    price: 1050,
    previewToneClass: 'from-[#f0f5fb] via-[#c5cfdb] to-[#8d98a8]',
    rarityLabel: 'Épico',
    shellClass: 'from-[#f7fbff] via-[#bac5d1] to-[#798392] border-[#536071]',
    innerClass: 'bg-[linear-gradient(180deg,#ffffff_0%,#dde5ef_56%,#bcc6d1_100%)] border-[#a9b4c2]',
    textureClass: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.28)_0_16%,transparent_17_34%,rgba(255,255,255,0.16)_35_50%,transparent_51_100%)]',
    shineClass: 'bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.88),rgba(255,255,255,0.16)_46%,transparent_72%)]',
    tier: 'premium',
  },
  {
    id: 'obsidian',
    index: 17,
    name: 'Obsidiana',
    price: 1300,
    previewToneClass: 'from-[#1b1c24] via-[#2f2d38] to-[#0f1015]',
    rarityLabel: 'Legendario',
    shellClass: 'from-[#3d3e4b] via-[#17181f] to-[#07080d] border-[#05060a]',
    innerClass: 'bg-[linear-gradient(180deg,#2b2b34_0%,#111117_100%)] border-[#4c4963]',
    textureClass: 'bg-[linear-gradient(135deg,rgba(118,103,214,0.18)_0%,transparent_42%,rgba(255,255,255,0.08)_72%,transparent_100%)]',
    shineClass: 'bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.44),rgba(255,255,255,0.08)_44%,transparent_70%)]',
    tier: 'premium',
  },
  {
    id: 'amber',
    index: 18,
    name: 'Ambar',
    price: 980,
    previewToneClass: 'from-[#fff0cf] via-[#ffca72] to-[#d97d24]',
    rarityLabel: 'Épico',
    shellClass: 'from-[#fff0a8] via-[#ffb44f] to-[#c46813] border-[#8b4907]',
    innerClass: 'bg-[linear-gradient(180deg,rgba(255,249,220,0.92),rgba(255,201,95,0.72))] border-[#ebbf6d]',
    textureClass: 'bg-[linear-gradient(135deg,rgba(255,255,255,0.22)_0%,rgba(255,170,71,0.28)_48%,rgba(194,89,12,0.22)_100%)]',
    shineClass: 'bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.92),rgba(255,255,255,0.18)_46%,transparent_72%)]',
    tier: 'premium',
  },
]

const tokenSkinById = tokenSkins.reduce<Record<TokenSkinId, TokenSkinDefinition>>((acc, skin) => {
  acc[skin.id] = skin
  return acc
}, {} as Record<TokenSkinId, TokenSkinDefinition>)

const legacyTokenSkinAliasMap = {
  fire: 'orange',
  ice: 'turquoise',
  jungle: 'brown',
  royal: 'gold',
} as const satisfies Record<string, TokenSkinId>

const resolveLegacyTokenSkinId = (value: string) => {
  return value in legacyTokenSkinAliasMap
    ? legacyTokenSkinAliasMap[value as keyof typeof legacyTokenSkinAliasMap]
    : value
}

const tokenSkinIdSet = new Set<TokenSkinId>(Object.keys(tokenSkinById) as TokenSkinId[])

export const tokenSkinCatalog: TokenSkinDefinition[] = [...tokenSkins].sort((left, right) => left.index - right.index)

export const tokenSkinShopOrder: TokenSkinId[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'pink',
  'purple',
  'black',
  'orange',
  'brown',
  'turquoise',
  'gold',
  'silver',
  'rainbow',
  'crystal',
  'lava',
  'pearl',
  'steel',
  'obsidian',
  'amber',
]

export const tokenSkinShopCatalog: TokenSkinDefinition[] = tokenSkinShopOrder.map((skinId) => tokenSkinById[skinId])

export const defaultOwnedTokenSkinIds: TokenSkinId[] = ['red', 'blue', 'green', 'yellow']

export const isTokenSkinId = (value: unknown): value is TokenSkinId => {
  if (typeof value !== 'string') {
    return false
  }

  return tokenSkinIdSet.has(resolveLegacyTokenSkinId(value) as TokenSkinId)
}

export const normalizeTokenSkinId = (value: unknown): TokenSkinId => {
  if (typeof value === 'string') {
    const resolvedValue = resolveLegacyTokenSkinId(value)
    if (tokenSkinIdSet.has(resolvedValue as TokenSkinId)) {
      return resolvedValue as TokenSkinId
    }
  }

  return 'blue'
}

export const normalizeOwnedTokenSkinIds = (value: unknown, selectedSkinId?: TokenSkinId): TokenSkinId[] => {
  const source = Array.isArray(value) ? value : defaultOwnedTokenSkinIds
  const normalized = source.map((entry) => normalizeTokenSkinId(entry))
  const next = normalized.length > 0 ? normalized : [...defaultOwnedTokenSkinIds]

  if (selectedSkinId && !next.includes(selectedSkinId)) {
    next.push(selectedSkinId)
  }

  return Array.from(new Set(next))
}

export const getTokenSkinDefinition = (skinId: TokenSkinId) => tokenSkinById[skinId] || tokenSkinById.blue

export const getTokenSkinName = (skinId: TokenSkinId, language: ShopLanguage) =>
  localizeShopText(tokenSkinCopyById[skinId]?.name || tokenSkinCopyById.blue.name, language)

export const getTokenSkinSubtitle = (skinId: TokenSkinId, language: ShopLanguage) =>
  localizeShopText(tokenSkinCopyById[skinId]?.subtitle || tokenSkinCopyById.blue.subtitle, language)

export const getTokenSkinRarityLabel = (skinId: TokenSkinId, language: ShopLanguage) =>
  localizeShopRarity(tokenSkinCopyById[skinId]?.rarityKey || 'common', language)

export const tokenSkinIndexFromId = (skinId: TokenSkinId): number => getTokenSkinDefinition(skinId).index

export const tokenSkinIdFromIndex = (index: number): TokenSkinId => {
  return tokenSkinCatalog.find((skin) => skin.index === index)?.id || 'blue'
}
