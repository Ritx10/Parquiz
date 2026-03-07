import type { PlayerColor } from '../components/game/match-types'

export type DiceSkinId = 'blue' | 'gold' | 'green' | 'pink' | 'red' | 'starlight'

export type DiceSkinDefinition = {
  id: DiceSkinId
  name: string
  subtitle: string
  price: number
  rarityLabel: string
  shellClass: string
  faceClass: string
  pipClass: string
  previewToneClass: string
  sparkleClass?: string
  symbol?: string
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
    rarityLabel: 'Inicial',
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
    rarityLabel: 'Catalogo',
    shellClass: 'border-[#c56a8f] bg-gradient-to-b from-[#fff1f8] via-[#ffd5ea] to-[#ffb2d5]',
    faceClass: 'bg-gradient-to-b from-[#fff8fc] via-[#ffe7f2] to-[#ffcadd]',
    pipClass: 'bg-[#b14072]',
    previewToneClass: 'from-[#ffeaf2] to-[#ffd0e2]',
    sparkleClass: 'bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.9),rgba(255,255,255,0.18)_46%,transparent_72%)]',
    symbol: 'P',
  },
  {
    id: 'gold',
    name: 'Dados Dorados Royale',
    subtitle: 'Acabado premium brillante',
    price: 1000,
    rarityLabel: 'Especial',
    shellClass: 'border-[#be8a19] bg-gradient-to-b from-[#fff7da] via-[#f8d775] to-[#dda53a]',
    faceClass: 'bg-gradient-to-b from-[#fffdf1] via-[#ffe9a7] to-[#f7c95a]',
    pipClass: 'bg-[#8b5600]',
    previewToneClass: 'from-[#fff4d5] to-[#eac87d]',
    sparkleClass: 'bg-[radial-gradient(circle_at_30%_30%,rgba(255,251,227,0.96),rgba(255,255,255,0.16)_44%,transparent_72%)]',
    symbol: '★',
  },
  {
    id: 'red',
    name: 'Dados Rojo Rush',
    subtitle: 'Pulso competitivo intenso',
    price: 450,
    rarityLabel: 'Catalogo',
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
    rarityLabel: 'Catalogo',
    shellClass: 'border-[#5f9d58] bg-gradient-to-b from-[#f3fff0] via-[#d7f7cf] to-[#9dd88e]',
    faceClass: 'bg-gradient-to-b from-[#fbfff9] via-[#e9fbdc] to-[#c5efb5]',
    pipClass: 'bg-[#2d6f38]',
    previewToneClass: 'from-[#e9ffe7] to-[#c8f1c4]',
    sparkleClass: 'bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.9),rgba(255,255,255,0.14)_46%,transparent_72%)]',
    symbol: '☘',
  },
  {
    id: 'starlight',
    name: 'Dados Starlight',
    subtitle: 'Version especial iridiscente',
    price: 1200,
    rarityLabel: 'Especial',
    shellClass: 'border-[#8a78d2] bg-gradient-to-b from-[#fbf8ff] via-[#e3dcff] to-[#c5b5ff]',
    faceClass: 'bg-gradient-to-b from-[#ffffff] via-[#f0ebff] to-[#ddd1ff]',
    pipClass: 'bg-[#5d44b1]',
    previewToneClass: 'from-[#eee6ff] to-[#d3c6f9]',
    sparkleClass: 'bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.95),rgba(255,255,255,0.18)_46%,transparent_72%)]',
    symbol: '✦',
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

const defaultDiceSkinIdByColor: Record<PlayerColor, DiceSkinId> = {
  blue: 'blue',
  green: 'green',
  red: 'red',
  yellow: 'gold',
}

const diceSkinAssignmentOrder: DiceSkinId[] = ['blue', 'red', 'green', 'gold', 'pink', 'starlight']

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
