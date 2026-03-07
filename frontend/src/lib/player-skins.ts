export type PlayerSkinId =
  | 'capi-princess'
  | 'capi-dino'
  | 'capi-pilot'
  | 'capi-chef'
  | 'capi-ninja'
  | 'capi-astronaut'

export type PlayerSkin = {
  id: PlayerSkinId
  legacyId?: string
  name: string
  subtitle: string
  src: string
  price: number
}

export const playerSkins: PlayerSkin[] = [
  {
    id: 'capi-princess',
    legacyId: 'bear-princess',
    name: 'Capi Princesa',
    subtitle: 'Vestido rosa',
    src: '/skins/parquiz/capi-princess.png',
    price: 0,
  },
  {
    id: 'capi-dino',
    legacyId: 'bear-dino',
    name: 'Capi Dino',
    subtitle: 'Disfraz jurasico',
    src: '/skins/parquiz/capi-dino.png',
    price: 350,
  },
  {
    id: 'capi-pilot',
    legacyId: 'bear-pilot',
    name: 'Capi Piloto',
    subtitle: 'Aventurero aereo',
    src: '/skins/parquiz/capi-pilot.png',
    price: 450,
  },
  {
    id: 'capi-chef',
    legacyId: 'bear-chef',
    name: 'Capi Chef',
    subtitle: 'Maestro del sushi',
    src: '/skins/parquiz/capi-chef.png',
    price: 550,
  },
  {
    id: 'capi-ninja',
    legacyId: 'bear-ninja',
    name: 'Capi Ninja',
    subtitle: 'Sigilo total',
    src: '/skins/parquiz/capi-ninja.png',
    price: 0,
  },
  {
    id: 'capi-astronaut',
    legacyId: 'bear-astronaut',
    name: 'Capi Astronauta',
    subtitle: 'Explorador espacial',
    src: '/skins/parquiz/capi-astronaut.png',
    price: 0,
  },
]

export const starterSkinIds: PlayerSkinId[] = ['capi-princess', 'capi-ninja', 'capi-astronaut']

const playerSkinById = playerSkins.reduce<Record<PlayerSkinId, PlayerSkin>>((acc, skin) => {
  acc[skin.id] = skin
  return acc
}, {} as Record<PlayerSkinId, PlayerSkin>)

const legacySkinIdMap = playerSkins.reduce<Record<string, PlayerSkinId>>((acc, skin) => {
  if (skin.legacyId) {
    acc[skin.legacyId] = skin.id
  }
  acc[skin.id] = skin.id
  return acc
}, {})

export const normalizePlayerSkinId = (skinId: null | string): null | PlayerSkinId => {
  if (!skinId) {
    return null
  }

  return legacySkinIdMap[skinId] ?? null
}

export const getPlayerSkinSrc = (skinId: null | string) => {
  const normalized = normalizePlayerSkinId(skinId)

  if (!normalized) {
    return null
  }

  return playerSkinById[normalized].src
}

export const getPlayerSkin = (skinId: null | string) => {
  const normalized = normalizePlayerSkinId(skinId)

  if (!normalized) {
    return null
  }

  return playerSkinById[normalized]
}

export const getStarterPlayerSkins = () => starterSkinIds.map((id) => playerSkinById[id])

export const isSkinAvatar = (avatar: string) => avatar.startsWith('/skins/parquiz/')
