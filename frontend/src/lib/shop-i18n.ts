export type ShopLanguage = 'es' | 'en'
export type ShopRarityKey = 'common' | 'rare' | 'epic' | 'legendary'

export type LocalizedText = {
  en: string
  es: string
}

export const localizeShopText = (text: LocalizedText, language: ShopLanguage) => text[language]

export const localizedShopRarityLabels: Record<ShopRarityKey, LocalizedText> = {
  common: { en: 'Common', es: 'Común' },
  rare: { en: 'Rare', es: 'Raro' },
  epic: { en: 'Epic', es: 'Épico' },
  legendary: { en: 'Legendary', es: 'Legendario' },
}

export const localizeShopRarity = (rarity: ShopRarityKey, language: ShopLanguage) =>
  localizedShopRarityLabels[rarity][language]
