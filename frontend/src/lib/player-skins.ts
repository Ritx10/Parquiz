import { localizeShopText, type LocalizedText, type ShopLanguage } from './shop-i18n'

const freeSkinModules = import.meta.glob('../assets/player-skins/free/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const premiumSkinModules = import.meta.glob('../assets/player-skins/premium/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const rewardSkinModules = import.meta.glob('../assets/player-skins/reward/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

type SkinPresentation = {
  name: LocalizedText
  subtitle: LocalizedText
}

export type PlayerSkinId = string
export type PlayerSkinTier = 'free' | 'premium' | 'reward'

export type PlayerSkin = {
  id: PlayerSkinId
  index: number
  legacyIds: string[]
  name: LocalizedText
  price: number
  src: string
  subtitle: LocalizedText
  tier: PlayerSkinTier
  requiredLevel?: number
}

const freeSkinPresentationBySlug: Record<string, SkinPresentation> = {
  'pasted-graphic': { name: { es: 'Capi Casual', en: 'Capi Casual' }, subtitle: { es: 'Look urbano con gafas', en: 'Urban outfit with glasses' } },
  'pasted-graphic-6': { name: { es: 'Capi Verano', en: 'Capi Summer' }, subtitle: { es: 'Vestido fresco y sombrero', en: 'Fresh dress and sun hat' } },
  'unknown': { name: { es: 'Capi Princesa', en: 'Capi Princess' }, subtitle: { es: 'Vestido rosa y corona', en: 'Pink dress and crown' } },
  'unknown-1': { name: { es: 'Capi Dino', en: 'Capi Dino' }, subtitle: { es: 'Disfraz de dinosaurio', en: 'Dinosaur costume' } },
  'unknown-2': { name: { es: 'Capi Aviadora', en: 'Capi Aviator' }, subtitle: { es: 'Chaqueta de vuelo clasica', en: 'Classic flight jacket' } },
  'unknown-3': { name: { es: 'Capi Chef', en: 'Capi Chef' }, subtitle: { es: 'Lista para servir sushi', en: 'Ready to serve sushi' } },
  'unknown-4': { name: { es: 'Capi Ninja', en: 'Capi Ninja' }, subtitle: { es: 'Sigilo total', en: 'Pure stealth' } },
  'unknown-5': { name: { es: 'Capi Astronauta', en: 'Capi Astronaut' }, subtitle: { es: 'Exploradora espacial', en: 'Space explorer' } },
}

const premiumSkinPresentationBySlug: Record<string, SkinPresentation> = {
  image: { name: { es: 'Capi Samurai', en: 'Capi Samurai' }, subtitle: { es: 'Armadura legendaria', en: 'Legendary armor' } },
  'image-3': { name: { es: 'Capi Pirata', en: 'Capi Pirate' }, subtitle: { es: 'Capitana de los mares', en: 'Captain of the seas' } },
  'image-4': { name: { es: 'Capi Faraon', en: 'Capi Pharaoh' }, subtitle: { es: 'Realeza del antiguo Egipto', en: 'Royalty of ancient Egypt' } },
  'image-5': { name: { es: 'Capi Darth', en: 'Capi Darth' }, subtitle: { es: 'Lado oscuro galactico', en: 'Galactic dark side' } },
  'image-6': { name: { es: 'Capi Cyborg', en: 'Capi Cyborg' }, subtitle: { es: 'Mitad maquina, mitad capi', en: 'Half machine, half capy' } },
  'image-7': { name: { es: 'Capi Batman', en: 'Capi Batman' }, subtitle: { es: 'Guardian de la noche', en: 'Guardian of the night' } },
  'image-8': { name: { es: 'Capi Harry', en: 'Capi Harry' }, subtitle: { es: 'Magia y bufanda escolar', en: 'Magic and school scarf' } },
  'image-9': { name: { es: 'Capi Indiana', en: 'Capi Indiana' }, subtitle: { es: 'Aventurero de reliquias', en: 'Relic adventurer' } },
  'image-10': { name: { es: 'Capi Ghostbuster', en: 'Capi Ghostbuster' }, subtitle: { es: 'Cazador de fantasmas', en: 'Ghost hunter' } },
  'image-11': { name: { es: 'Capi Wonder', en: 'Capi Wonder' }, subtitle: { es: 'Heroina con lazo dorado', en: 'Heroine with golden lasso' } },
  'image-12': { name: { es: 'Capi Spider', en: 'Capi Spider' }, subtitle: { es: 'Trepa muros de ciudad', en: 'City wall-crawler' } },
  'image-13': { name: { es: 'Capi Astronauta Pro', en: 'Capi Astronaut Pro' }, subtitle: { es: 'Mision espacial avanzada', en: 'Advanced space mission' } },
  'image-14': { name: { es: 'Capi Blancanieves', en: 'Capi Snow White' }, subtitle: { es: 'Manzana encantada', en: 'Enchanted apple' } },
  'image-15': { name: { es: 'Capi Tiana', en: 'Capi Tiana' }, subtitle: { es: 'Princesa del pantano', en: 'Bayou princess' } },
  'image-16': { name: { es: 'Capi Ariel', en: 'Capi Ariel' }, subtitle: { es: 'Sirena del oceano', en: 'Ocean mermaid' } },
  'image-17': { name: { es: 'Capi Rapunzel', en: 'Capi Rapunzel' }, subtitle: { es: 'Cabello magico y arte', en: 'Magic hair and art' } },
  'image-18': { name: { es: 'Capi Moana', en: 'Capi Moana' }, subtitle: { es: 'Espiritu del oceano', en: 'Ocean spirit' } },
  'image-19': { name: { es: 'Capi Jasmine', en: 'Capi Jasmine' }, subtitle: { es: 'Lampara y aventura', en: 'Lamp and adventure' } },
  'image-2-2': { name: { es: 'Capi Buzo', en: 'Capi Diver' }, subtitle: { es: 'Traje de buceo clasico', en: 'Classic diving suit' } },
  'image-2': { name: { es: 'Capi Artista', en: 'Capi Artist' }, subtitle: { es: 'Pincel y paleta renacentista', en: 'Renaissance brush and palette' } },
  'image-20': { name: { es: 'Capi Vaquero', en: 'Capi Cowboy' }, subtitle: { es: 'Duelo del viejo oeste', en: 'Old west duel' } },
  'image-21': { name: { es: 'Capi Caballero', en: 'Capi Gentleman' }, subtitle: { es: 'Elegancia con baston', en: 'Elegance with a cane' } },
  'image-22': { name: { es: 'Capi Cisne', en: 'Capi Swan' }, subtitle: { es: 'Tutu y alas blancas', en: 'Tutu and white wings' } },
  'image-23': { name: { es: 'Capi Cyberpunk', en: 'Capi Cyberpunk' }, subtitle: { es: 'Neon y tecnologia', en: 'Neon and tech' } },
}

const rewardSkinPresentationBySlug: Record<string, SkinPresentation> = {
  'pasted-graphic-9': {
    name: { es: 'Capi Especial', en: 'Special Capi' },
    subtitle: { es: 'Recompensa exclusiva de nivel 10', en: 'Exclusive level 10 reward' },
  },
}

const getPathSlug = (filePath: string) => {
  const normalizedPath = filePath.replace(/\\/g, '/')
  const fileName = normalizedPath.split('/').pop() || ''
  return fileName.replace(/\.[^.]+$/, '')
}

const getPathFileName = (filePath: string) => filePath.replace(/\\/g, '/').split('/').pop() || ''

const sortEntries = (modules: Record<string, string>) => {
  return Object.entries(modules).sort(([left], [right]) => getPathFileName(left).localeCompare(getPathFileName(right), 'en'))
}

const titleCaseSlug = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')

const resolvePresentation = (
  slug: string,
  tier: PlayerSkinTier,
  fallbackIndex: number,
): SkinPresentation => {
  const mappedPresentation =
    tier === 'free'
      ? freeSkinPresentationBySlug[slug]
      : tier === 'premium'
        ? premiumSkinPresentationBySlug[slug]
        : rewardSkinPresentationBySlug[slug]

  if (mappedPresentation) {
    return mappedPresentation
  }

    return {
    name: {
      es: `Capi ${titleCaseSlug(slug) || `${tier === 'free' ? 'Gratis' : 'Premium'} ${fallbackIndex + 1}`}`,
      en: `Capi ${titleCaseSlug(slug) || `${tier === 'free' ? 'Free' : 'Premium'} ${fallbackIndex + 1}`}`,
    },
    subtitle:
      tier === 'free'
        ? { es: 'Skin gratuita inicial', en: 'Free starter skin' }
        : tier === 'premium'
          ? { es: 'Skin premium de tienda', en: 'Premium shop skin' }
          : { es: 'Recompensa especial por nivel', en: 'Special level reward' },
  }
}

const buildSkinId = (tier: PlayerSkinTier, index: number) =>
  `capi-${tier === 'free' ? 'gratis' : tier === 'premium' ? 'pago' : 'especial'}-${index + 1}`

const legacySkinIdGroups = [
  ['capi-princess', 'bear-princess'],
  ['capi-dino', 'bear-dino'],
  ['capi-pilot', 'bear-pilot'],
  ['capi-chef', 'bear-chef'],
  ['capi-ninja', 'bear-ninja'],
  ['capi-astronaut', 'bear-astronaut'],
]

const freeSkins = sortEntries(freeSkinModules).map<PlayerSkin>(([modulePath, src], index) => {
  const presentation = resolvePresentation(getPathSlug(modulePath), 'free', index)

  return {
    id: buildSkinId('free', index),
    index,
    legacyIds: legacySkinIdGroups[index] || [],
    name: presentation.name,
    price: 0,
    src,
    subtitle: presentation.subtitle,
    tier: 'free',
  }
})

const premiumSkins = sortEntries(premiumSkinModules)
  .filter(([modulePath]) => getPathSlug(modulePath) !== 'pasted-graphic-9')
  .map<PlayerSkin>(([modulePath, src], index) => {
  const presentation = resolvePresentation(getPathSlug(modulePath), 'premium', index)

  return {
    id: buildSkinId('premium', index),
    index: freeSkins.length + index,
    legacyIds: [],
    name: presentation.name,
    price: 1200 + index * 100,
    src,
    subtitle: presentation.subtitle,
    tier: 'premium',
  }
})

const rewardSkins = sortEntries(rewardSkinModules).map<PlayerSkin>(([modulePath, src], index) => {
  const presentation = resolvePresentation(getPathSlug(modulePath), 'reward', index)

  return {
    id: buildSkinId('reward', index),
    index: freeSkins.length + premiumSkins.length + index,
    legacyIds: [],
    name: presentation.name,
    price: 0,
    requiredLevel: 10,
    src,
    subtitle: presentation.subtitle,
    tier: 'reward',
  }
})

export const playerSkins: PlayerSkin[] = [...freeSkins, ...premiumSkins, ...rewardSkins]

export const specialRewardSkinId: PlayerSkinId | null = rewardSkins[0]?.id || null

export const playerSkinIdOrder: PlayerSkinId[] = playerSkins.map((skin) => skin.id)

export const starterSkinIds: PlayerSkinId[] = freeSkins.map((skin) => skin.id)

export const defaultOwnedPlayerSkinIds: PlayerSkinId[] = [...starterSkinIds]

const playerSkinById = playerSkins.reduce<Record<PlayerSkinId, PlayerSkin>>((acc, skin) => {
  acc[skin.id] = skin
  return acc
}, {})

const legacySkinIdMap = playerSkins.reduce<Record<string, PlayerSkinId>>((acc, skin) => {
  skin.legacyIds.forEach((legacyId) => {
    acc[legacyId] = skin.id
  })
  acc[skin.id] = skin.id
  return acc
}, {})

export const normalizePlayerSkinId = (skinId: null | string): null | PlayerSkinId => {
  if (!skinId) {
    return null
  }

  return legacySkinIdMap[skinId] ?? null
}

export const normalizeOwnedPlayerSkinIds = (value: unknown, selectedSkinId?: null | string): PlayerSkinId[] => {
  const source = Array.isArray(value) ? value : defaultOwnedPlayerSkinIds
  const normalized = source
    .map((entry) => (typeof entry === 'string' ? normalizePlayerSkinId(entry) : null))
    .filter((entry): entry is PlayerSkinId => Boolean(entry))

  const next = normalized.length > 0 ? normalized : [...defaultOwnedPlayerSkinIds]
  const normalizedSelectedSkinId = normalizePlayerSkinId(selectedSkinId ?? null)

  if (normalizedSelectedSkinId && !next.includes(normalizedSelectedSkinId)) {
    next.push(normalizedSelectedSkinId)
  }

  return Array.from(new Set(next))
}

export const getPlayerSkinSrc = (skinId: null | string) => {
  const normalized = normalizePlayerSkinId(skinId)

  if (!normalized) {
    return null
  }

  return playerSkinById[normalized]?.src || null
}

export const getPlayerSkin = (skinId: null | string) => {
  const normalized = normalizePlayerSkinId(skinId)

  if (!normalized) {
    return null
  }

  return playerSkinById[normalized] || null
}

export const getPlayerSkinName = (skinId: null | string, language: ShopLanguage) => {
  const skin = getPlayerSkin(skinId)
  return skin ? localizeShopText(skin.name, language) : null
}

export const getPlayerSkinSubtitle = (skinId: null | string, language: ShopLanguage) => {
  const skin = getPlayerSkin(skinId)
  return skin ? localizeShopText(skin.subtitle, language) : null
}

export const getStarterPlayerSkins = () => starterSkinIds.map((id) => playerSkinById[id]).filter(Boolean)

export const isSkinAvatar = (avatar: string) => /\.(png|jpe?g|webp|avif|gif|svg)(\?.*)?$/i.test(avatar)

export const playerSkinIndexFromId = (skinId: null | string) => {
  const normalized = normalizePlayerSkinId(skinId)

  if (!normalized) {
    return 0
  }

  return playerSkinById[normalized]?.index ?? 0
}

export const playerSkinIdFromIndex = (index: number): PlayerSkinId => {
  return playerSkins.find((skin) => skin.index === index)?.id || playerSkinIdOrder[0]
}
