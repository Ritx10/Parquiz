import { localizeShopRarity, localizeShopText, type LocalizedText, type ShopLanguage, type ShopRarityKey } from './shop-i18n'

export type BoardThemeId =
  | 'theme-castle'
  | 'theme-classic'
  | 'theme-desert'
  | 'theme-jungle'
  | 'theme-legend'
  | 'theme-night'
  | 'theme-rainbow'
  | 'theme-volcano'

export type BoardThemeDefinition = {
  id: BoardThemeId
  icon: string
  name: string
  price: number
  previewToneClass: string
  previewImageSrc: string
  rarityLabel: string
  subtitle: string
  backgroundColor: string
  backgroundImage: string
}

const boardThemeCopyById: Record<BoardThemeId, { name: LocalizedText; rarityKey: ShopRarityKey; subtitle: LocalizedText }> = {
  'theme-classic': {
    name: { es: 'Tema Clasico', en: 'Classic Theme' },
    rarityKey: 'common',
    subtitle: { es: 'Salon arcade original', en: 'Original arcade lounge' },
  },
  'theme-rainbow': {
    name: { es: 'Tema Arcoiris', en: 'Rainbow Theme' },
    rarityKey: 'rare',
    subtitle: { es: 'Cielo brillante multicolor', en: 'Bright multicolor sky' },
  },
  'theme-castle': {
    name: { es: 'Tema Castillo', en: 'Castle Theme' },
    rarityKey: 'epic',
    subtitle: { es: 'Reino suave de fantasia', en: 'Soft fantasy kingdom' },
  },
  'theme-jungle': {
    name: { es: 'Tema Palmera', en: 'Jungle Theme' },
    rarityKey: 'epic',
    subtitle: { es: 'Oasis tropical animado', en: 'Lively tropical oasis' },
  },
  'theme-desert': {
    name: { es: 'Tema Desierto', en: 'Desert Theme' },
    rarityKey: 'rare',
    subtitle: { es: 'Dunas doradas al atardecer', en: 'Golden sunset dunes' },
  },
  'theme-night': {
    name: { es: 'Tema Luna', en: 'Moon Theme' },
    rarityKey: 'epic',
    subtitle: { es: 'Noche magica con brillo lunar', en: 'Magical moonlit night' },
  },
  'theme-volcano': {
    name: { es: 'Tema Volcan', en: 'Volcano Theme' },
    rarityKey: 'epic',
    subtitle: { es: 'Cielo ardiente y lava', en: 'Fiery sky and lava' },
  },
  'theme-legend': {
    name: { es: 'Tema Legendario', en: 'Legend Theme' },
    rarityKey: 'legendary',
    subtitle: { es: 'Aura premium encantada', en: 'Enchanted premium aura' },
  },
}

export type BoardThemeSurfacePalette = {
  accentPanelBackground: string
  badgeBackground: string
  badgeBorder: string
  badgeText: string
  boardGlassGlow: string
  boardGlassOverlay: string
  boardGlassSheen: string
  boardGridOverlay: string
  boardInnerBackground: string
  boardOuterBackground: string
  boardOuterBorder: string
  diceLauncherActiveBackground: string
  diceLauncherBorder: string
  diceLauncherIdleBackground: string
  diceLauncherRing: string
  diceLauncherText: string
  headerBackground: string
  headerBorder: string
  headerText: string
  hudAvatarBackground: string
  hudCardBackground: string
  hudCardBorder: string
  hudCardText: string
  hudPillBackground: string
  hudPillBorder: string
  hudPillText: string
  mainPanelBackground: string
  mainPanelBorder: string
  neutralTrackFill: string
  sideInputBackground: string
  sideInputBorder: string
  sidePanelBackground: string
  sidePanelBorder: string
}

export const boardThemeCatalog: BoardThemeDefinition[] = [
  {
    id: 'theme-classic',
    icon: '🏁',
    name: 'Tema Clasico',
    price: 0,
    previewToneClass: 'from-[#f7eddf] to-[#e4d4c2]',
    previewImageSrc: '/home-background.jpg',
    rarityLabel: 'Inicial',
    subtitle: 'Salon arcade original',
    backgroundColor: '#8d5936',
    backgroundImage:
      "radial-gradient(circle at 50% 20%, rgba(255,241,210,0.22), transparent 34%), linear-gradient(180deg, rgba(38,20,10,0.18), rgba(18,9,6,0.46)), url('/home-background.jpg')",
  },
  {
    id: 'theme-rainbow',
    icon: '🌈',
    name: 'Tema Arcoiris',
    price: 550,
    previewToneClass: 'from-[#edf8ff] to-[#d2eeff]',
    previewImageSrc: '/FondoParQuiz/rainbow.jpg',
    rarityLabel: 'Catalogo',
    subtitle: 'Cielo brillante multicolor',
    backgroundColor: '#8bc9ff',
    backgroundImage:
      "linear-gradient(180deg, rgba(18,10,24,0.08), rgba(14,8,12,0.26)), url('/FondoParQuiz/rainbow.jpg')",
  },
  {
    id: 'theme-castle',
    icon: '🏰',
    name: 'Tema Castillo',
    price: 900,
    previewToneClass: 'from-[#eee9ff] to-[#d8d0fa]',
    previewImageSrc: '/FondoParQuiz/rainbow-castle.jpg',
    rarityLabel: 'Catalogo',
    subtitle: 'Reino suave de fantasia',
    backgroundColor: '#8c84d9',
    backgroundImage:
      "linear-gradient(180deg, rgba(27,16,52,0.12), rgba(12,8,18,0.42)), url('/FondoParQuiz/rainbow-castle.jpg')",
  },
  {
    id: 'theme-jungle',
    icon: '🌴',
    name: 'Tema Palmera',
    price: 800,
    previewToneClass: 'from-[#efffe9] to-[#cdeebf]',
    previewImageSrc: '/FondoParQuiz/jungle.jpg',
    rarityLabel: 'Catalogo',
    subtitle: 'Oasis tropical animado',
    backgroundColor: '#5fa163',
    backgroundImage:
      "linear-gradient(180deg, rgba(17,52,29,0.12), rgba(8,24,13,0.42)), url('/FondoParQuiz/jungle.jpg')",
  },
  {
    id: 'theme-desert',
    icon: '🏜️',
    name: 'Tema Desierto',
    price: 700,
    previewToneClass: 'from-[#fff0df] to-[#f5d0aa]',
    previewImageSrc: '/FondoParQuiz/desert.jpg',
    rarityLabel: 'Catalogo',
    subtitle: 'Dunas doradas al atardecer',
    backgroundColor: '#d59a58',
    backgroundImage:
      "linear-gradient(180deg, rgba(89,46,16,0.06), rgba(34,16,8,0.34)), url('/FondoParQuiz/desert.jpg')",
  },
  {
    id: 'theme-night',
    icon: '🌙',
    name: 'Tema Luna',
    price: 850,
    previewToneClass: 'from-[#e9ebff] to-[#cfd5fa]',
    previewImageSrc: '/FondoParQuiz/night.jpg',
    rarityLabel: 'Catalogo',
    subtitle: 'Noche magica con brillo lunar',
    backgroundColor: '#24356c',
    backgroundImage:
      "linear-gradient(180deg, rgba(10,18,47,0.14), rgba(5,9,18,0.52)), url('/FondoParQuiz/night.jpg')",
  },
  {
    id: 'theme-volcano',
    icon: '🌋',
    name: 'Tema Volcan',
    price: 950,
    previewToneClass: 'from-[#ffe8dd] to-[#f9c2ad]',
    previewImageSrc: '/FondoParQuiz/volcano.jpg',
    rarityLabel: 'Especial',
    subtitle: 'Cielo ardiente y lava',
    backgroundColor: '#7b2e1e',
    backgroundImage:
      "linear-gradient(180deg, rgba(48,10,4,0.08), rgba(15,4,2,0.42)), url('/FondoParQuiz/volcano.jpg')",
  },
  {
    id: 'theme-legend',
    icon: '🪄',
    name: 'Tema Legendario',
    price: 1500,
    previewToneClass: 'from-[#fff2d9] to-[#efd29f]',
    previewImageSrc: '/FondoParQuiz/legend.jpg',
    rarityLabel: 'Especial',
    subtitle: 'Aura premium encantada',
    backgroundColor: '#86653a',
    backgroundImage:
      "linear-gradient(180deg, rgba(28,15,52,0.08), rgba(8,6,18,0.34)), url('/FondoParQuiz/legend.jpg')",
  },
]

const surfacePaletteByThemeId: Record<BoardThemeId, BoardThemeSurfacePalette> = {
  'theme-classic': {
    accentPanelBackground: 'linear-gradient(180deg, #ffefc8 0%, #ffe39d 48%, #ffd26b 100%)',
    badgeBackground: 'linear-gradient(180deg, #f8d772 0%, #e4b23a 100%)',
    badgeBorder: '#7a4e12',
    badgeText: '#603d0b',
    boardGlassGlow: 'rgba(255, 222, 166, 0.26)',
    boardGlassOverlay: 'linear-gradient(135deg, rgba(250,239,220,0.72) 0%, rgba(240,214,176,0.48) 52%, rgba(226,192,145,0.4) 100%)',
    boardGlassSheen: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,248,231,0.2) 34%, rgba(255,255,255,0.04) 100%)',
    boardGridOverlay:
      'linear-gradient(to right, rgba(40, 25, 12, 0.42) 1px, transparent 1px), linear-gradient(to bottom, rgba(40, 25, 12, 0.42) 1px, transparent 1px), repeating-linear-gradient(0deg, rgba(128, 80, 45, 0.08) 0, rgba(128, 80, 45, 0.08) 2px, rgba(239, 208, 170, 0.08) 2px, rgba(239, 208, 170, 0.08) 4px)',
    boardInnerBackground: '#f7e6c8',
    boardOuterBackground:
      'repeating-linear-gradient(0deg, rgba(126,84,45,0.18) 0, rgba(126,84,45,0.18) 2px, rgba(229,194,146,0.2) 2px, rgba(229,194,146,0.2) 4px), linear-gradient(120deg, #e7c68f 0%, #d8af77 26%, #f2d8ac 56%, #cca06a 100%)',
    boardOuterBorder: '#b98652',
    diceLauncherActiveBackground: 'rgba(13, 51, 88, 0.88)',
    diceLauncherBorder: '#7cd5ff',
    diceLauncherIdleBackground: 'rgba(13, 51, 88, 0.45)',
    diceLauncherRing: '0 0 0 3px rgba(124,213,255,0.35)',
    diceLauncherText: '#dbf4ff',
    headerBackground: 'linear-gradient(90deg, rgba(132,82,35,0.54) 0%, rgba(155,99,46,0.46) 50%, rgba(123,75,30,0.52) 100%)',
    headerBorder: '#4e2f14',
    headerText: '#fff0c7',
    hudAvatarBackground: '#fff4dc',
    hudCardBackground: 'rgba(8, 41, 68, 0.78)',
    hudCardBorder: 'rgba(255,255,255,0.2)',
    hudCardText: '#ffffff',
    hudPillBackground: 'rgba(255,255,255,0.1)',
    hudPillBorder: 'rgba(255,255,255,0.2)',
    hudPillText: '#dbf4ff',
    mainPanelBackground: 'linear-gradient(180deg, rgba(251,241,219,0.22) 0%, rgba(238,213,173,0.16) 52%, rgba(221,180,127,0.12) 100%)',
    mainPanelBorder: '#fce29f',
    neutralTrackFill: '#fff8e6',
    sideInputBackground: '#fff8e7',
    sideInputBorder: '#c9a85a',
    sidePanelBackground: 'linear-gradient(180deg, #fff3ce 0%, #ffe7ae 48%, #ffd57d 100%)',
    sidePanelBorder: '#fce29f',
  },
  'theme-rainbow': {
    accentPanelBackground: 'linear-gradient(180deg, #eef7ff 0%, #dbeeff 52%, #c8e6ff 100%)',
    badgeBackground: 'linear-gradient(180deg, #fff3bf 0%, #f2c36e 100%)',
    badgeBorder: '#8b6731',
    badgeText: '#674618',
    boardGlassGlow: 'rgba(171, 214, 255, 0.28)',
    boardGlassOverlay: 'linear-gradient(135deg, rgba(255,211,228,0.28) 0%, rgba(214,236,255,0.56) 24%, rgba(223,255,234,0.46) 52%, rgba(255,244,208,0.38) 74%, rgba(229,214,255,0.34) 100%)',
    boardGlassSheen: 'linear-gradient(180deg, rgba(255,255,255,0.46) 0%, rgba(247,250,255,0.2) 34%, rgba(255,255,255,0.04) 100%)',
    boardGridOverlay:
      'linear-gradient(to right, rgba(82, 106, 132, 0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(82, 106, 132, 0.28) 1px, transparent 1px), repeating-linear-gradient(0deg, rgba(175, 205, 235, 0.12) 0, rgba(175, 205, 235, 0.12) 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)',
    boardInnerBackground: '#edf6ff',
    boardOuterBackground:
      'repeating-linear-gradient(0deg, rgba(97,131,170,0.12) 0, rgba(97,131,170,0.12) 2px, rgba(233,245,255,0.12) 2px, rgba(233,245,255,0.12) 4px), linear-gradient(120deg, #dcecff 0%, #c5dcfb 32%, #eef7ff 62%, #b7d5f6 100%)',
    boardOuterBorder: '#93b8dd',
    diceLauncherActiveBackground: 'rgba(91, 132, 177, 0.9)',
    diceLauncherBorder: '#dff1ff',
    diceLauncherIdleBackground: 'rgba(91, 132, 177, 0.46)',
    diceLauncherRing: '0 0 0 3px rgba(186,223,255,0.34)',
    diceLauncherText: '#f5fbff',
    headerBackground: 'linear-gradient(90deg, rgba(100,137,184,0.52) 0%, rgba(134,169,212,0.44) 50%, rgba(109,143,189,0.5) 100%)',
    headerBorder: '#5579a4',
    headerText: '#fdfcff',
    hudAvatarBackground: '#fff7f6',
    hudCardBackground: 'rgba(234, 245, 255, 0.92)',
    hudCardBorder: 'rgba(111, 149, 194, 0.42)',
    hudCardText: '#365170',
    hudPillBackground: 'rgba(130, 170, 214, 0.18)',
    hudPillBorder: 'rgba(111, 149, 194, 0.34)',
    hudPillText: '#52739b',
    mainPanelBackground: 'linear-gradient(180deg, rgba(238,247,255,0.2) 0%, rgba(205,228,250,0.14) 52%, rgba(176,209,242,0.1) 100%)',
    mainPanelBorder: '#d4e8fb',
    neutralTrackFill: '#f8fbff',
    sideInputBackground: '#f8fbff',
    sideInputBorder: '#accbe6',
    sidePanelBackground: 'linear-gradient(180deg, #f3faff 0%, #dfedff 50%, #cfe4ff 100%)',
    sidePanelBorder: '#d4e8fb',
  },
  'theme-castle': {
    accentPanelBackground: 'linear-gradient(180deg, #f2ecff 0%, #e0d7fb 50%, #d2c7f4 100%)',
    badgeBackground: 'linear-gradient(180deg, #fff0c8 0%, #ebc27c 100%)',
    badgeBorder: '#86649f',
    badgeText: '#5b3f76',
    boardGlassGlow: 'rgba(193, 177, 255, 0.28)',
    boardGlassOverlay: 'linear-gradient(135deg, rgba(245,239,255,0.68) 0%, rgba(216,206,255,0.44) 54%, rgba(190,176,250,0.38) 100%)',
    boardGlassSheen: 'linear-gradient(180deg, rgba(255,255,255,0.44) 0%, rgba(249,245,255,0.2) 34%, rgba(255,255,255,0.04) 100%)',
    boardGridOverlay:
      'linear-gradient(to right, rgba(85, 71, 118, 0.24) 1px, transparent 1px), linear-gradient(to bottom, rgba(85, 71, 118, 0.24) 1px, transparent 1px), repeating-linear-gradient(0deg, rgba(219, 210, 247, 0.12) 0, rgba(219, 210, 247, 0.12) 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 4px)',
    boardInnerBackground: '#f1ecff',
    boardOuterBackground:
      'repeating-linear-gradient(0deg, rgba(110,87,159,0.12) 0, rgba(110,87,159,0.12) 2px, rgba(244,239,255,0.1) 2px, rgba(244,239,255,0.1) 4px), linear-gradient(120deg, #dcd4f9 0%, #cfc6f2 32%, #eee9ff 64%, #c7bce8 100%)',
    boardOuterBorder: '#a699d7',
    diceLauncherActiveBackground: 'rgba(97, 83, 143, 0.88)',
    diceLauncherBorder: '#e2d8ff',
    diceLauncherIdleBackground: 'rgba(97, 83, 143, 0.44)',
    diceLauncherRing: '0 0 0 3px rgba(210,198,255,0.34)',
    diceLauncherText: '#f7f2ff',
    headerBackground: 'linear-gradient(90deg, rgba(108,83,146,0.54) 0%, rgba(135,107,178,0.46) 50%, rgba(97,73,127,0.52) 100%)',
    headerBorder: '#56406f',
    headerText: '#fdf6ff',
    hudAvatarBackground: '#fff6ff',
    hudCardBackground: 'rgba(241, 236, 255, 0.92)',
    hudCardBorder: 'rgba(128, 104, 173, 0.36)',
    hudCardText: '#4c3b72',
    hudPillBackground: 'rgba(148, 130, 197, 0.18)',
    hudPillBorder: 'rgba(128, 104, 173, 0.28)',
    hudPillText: '#69548d',
    mainPanelBackground: 'linear-gradient(180deg, rgba(243,238,255,0.2) 0%, rgba(220,208,252,0.15) 52%, rgba(198,186,240,0.1) 100%)',
    mainPanelBorder: '#dfd7fa',
    neutralTrackFill: '#faf7ff',
    sideInputBackground: '#f9f6ff',
    sideInputBorder: '#b8aadf',
    sidePanelBackground: 'linear-gradient(180deg, #f5f1ff 0%, #e6ddfb 50%, #d8cdf1 100%)',
    sidePanelBorder: '#dfd7fa',
  },
  'theme-jungle': {
    accentPanelBackground: 'linear-gradient(180deg, #edf9e6 0%, #d4efc5 50%, #c3e4af 100%)',
    badgeBackground: 'linear-gradient(180deg, #fff3bf 0%, #e2be6d 100%)',
    badgeBorder: '#5d8748',
    badgeText: '#43642f',
    boardGlassGlow: 'rgba(156, 225, 186, 0.3)',
    boardGlassOverlay: 'linear-gradient(135deg, rgba(236,252,240,0.64) 0%, rgba(190,235,208,0.42) 50%, rgba(138,210,181,0.34) 100%)',
    boardGlassSheen: 'linear-gradient(180deg, rgba(255,255,255,0.44) 0%, rgba(242,255,246,0.2) 34%, rgba(255,255,255,0.04) 100%)',
    boardGridOverlay:
      'linear-gradient(to right, rgba(49, 88, 58, 0.24) 1px, transparent 1px), linear-gradient(to bottom, rgba(49, 88, 58, 0.24) 1px, transparent 1px), repeating-linear-gradient(0deg, rgba(188, 223, 182, 0.12) 0, rgba(188, 223, 182, 0.12) 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 4px)',
    boardInnerBackground: '#ebf6e4',
    boardOuterBackground:
      'repeating-linear-gradient(0deg, rgba(69,123,75,0.12) 0, rgba(69,123,75,0.12) 2px, rgba(235,248,225,0.1) 2px, rgba(235,248,225,0.1) 4px), linear-gradient(120deg, #d6efc7 0%, #c3e4af 32%, #effae8 64%, #b0d89e 100%)',
    boardOuterBorder: '#8fb580',
    diceLauncherActiveBackground: 'rgba(69, 116, 76, 0.88)',
    diceLauncherBorder: '#e6f9da',
    diceLauncherIdleBackground: 'rgba(69, 116, 76, 0.42)',
    diceLauncherRing: '0 0 0 3px rgba(196,233,175,0.34)',
    diceLauncherText: '#f2fff1',
    headerBackground: 'linear-gradient(90deg, rgba(71,116,75,0.52) 0%, rgba(94,147,100,0.44) 50%, rgba(63,103,63,0.5) 100%)',
    headerBorder: '#385937',
    headerText: '#f5ffe9',
    hudAvatarBackground: '#fbfff6',
    hudCardBackground: 'rgba(237, 249, 230, 0.92)',
    hudCardBorder: 'rgba(100, 143, 96, 0.34)',
    hudCardText: '#35533a',
    hudPillBackground: 'rgba(125, 175, 118, 0.16)',
    hudPillBorder: 'rgba(100, 143, 96, 0.28)',
    hudPillText: '#547259',
    mainPanelBackground: 'linear-gradient(180deg, rgba(241,251,236,0.2) 0%, rgba(207,233,193,0.14) 52%, rgba(176,217,160,0.1) 100%)',
    mainPanelBorder: '#d7efce',
    neutralTrackFill: '#f8fdf5',
    sideInputBackground: '#f6fcf1',
    sideInputBorder: '#9cc392',
    sidePanelBackground: 'linear-gradient(180deg, #f0fae8 0%, #d9efc9 50%, #c7e4b4 100%)',
    sidePanelBorder: '#d7efce',
  },
  'theme-desert': {
    accentPanelBackground: 'linear-gradient(180deg, #fff1df 0%, #f4dfbf 50%, #ebcfa6 100%)',
    badgeBackground: 'linear-gradient(180deg, #ffe9b8 0%, #e2ab5b 100%)',
    badgeBorder: '#a56a2f',
    badgeText: '#70431b',
    boardGlassGlow: 'rgba(255, 207, 145, 0.28)',
    boardGlassOverlay: 'linear-gradient(135deg, rgba(255,244,226,0.68) 0%, rgba(245,215,176,0.42) 54%, rgba(229,182,121,0.34) 100%)',
    boardGlassSheen: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,246,232,0.18) 34%, rgba(255,255,255,0.04) 100%)',
    boardGridOverlay:
      'linear-gradient(to right, rgba(118, 79, 39, 0.26) 1px, transparent 1px), linear-gradient(to bottom, rgba(118, 79, 39, 0.26) 1px, transparent 1px), repeating-linear-gradient(0deg, rgba(231, 191, 143, 0.12) 0, rgba(231, 191, 143, 0.12) 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 4px)',
    boardInnerBackground: '#f8ead4',
    boardOuterBackground:
      'repeating-linear-gradient(0deg, rgba(157,107,59,0.12) 0, rgba(157,107,59,0.12) 2px, rgba(252,232,204,0.1) 2px, rgba(252,232,204,0.1) 4px), linear-gradient(120deg, #f1d3a5 0%, #e4bc81 32%, #fae7c5 64%, #d8a66a 100%)',
    boardOuterBorder: '#c58d4f',
    diceLauncherActiveBackground: 'rgba(141, 93, 49, 0.88)',
    diceLauncherBorder: '#ffe7b8',
    diceLauncherIdleBackground: 'rgba(141, 93, 49, 0.42)',
    diceLauncherRing: '0 0 0 3px rgba(240,193,117,0.28)',
    diceLauncherText: '#fff5da',
    headerBackground: 'linear-gradient(90deg, rgba(155,99,53,0.54) 0%, rgba(182,119,66,0.44) 50%, rgba(136,85,45,0.5) 100%)',
    headerBorder: '#714420',
    headerText: '#fff1d7',
    hudAvatarBackground: '#fff7ec',
    hudCardBackground: 'rgba(255, 243, 222, 0.92)',
    hudCardBorder: 'rgba(177, 125, 72, 0.34)',
    hudCardText: '#6d4620',
    hudPillBackground: 'rgba(223, 177, 118, 0.18)',
    hudPillBorder: 'rgba(177, 125, 72, 0.28)',
    hudPillText: '#8c5f35',
    mainPanelBackground: 'linear-gradient(180deg, rgba(252,242,223,0.22) 0%, rgba(241,214,178,0.16) 52%, rgba(223,180,127,0.12) 100%)',
    mainPanelBorder: '#f2dbb9',
    neutralTrackFill: '#fff9f0',
    sideInputBackground: '#fff9ef',
    sideInputBorder: '#d4ab74',
    sidePanelBackground: 'linear-gradient(180deg, #fff5e6 0%, #f4dfbd 50%, #e7c89a 100%)',
    sidePanelBorder: '#f2dbb9',
  },
  'theme-night': {
    accentPanelBackground: 'linear-gradient(180deg, #dbe4ff 0%, #c4d0f1 50%, #b0bfeb 100%)',
    badgeBackground: 'linear-gradient(180deg, #d9ecff 0%, #9cc2e9 100%)',
    badgeBorder: '#5871a4',
    badgeText: '#2d4372',
    boardGlassGlow: 'rgba(154, 181, 255, 0.28)',
    boardGlassOverlay: 'linear-gradient(135deg, rgba(240,246,255,0.68) 0%, rgba(193,210,247,0.42) 54%, rgba(137,162,220,0.34) 100%)',
    boardGlassSheen: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(242,247,255,0.18) 34%, rgba(255,255,255,0.04) 100%)',
    boardGridOverlay:
      'linear-gradient(to right, rgba(52, 66, 98, 0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(52, 66, 98, 0.28) 1px, transparent 1px), repeating-linear-gradient(0deg, rgba(168, 184, 224, 0.12) 0, rgba(168, 184, 224, 0.12) 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
    boardInnerBackground: '#dfe8fb',
    boardOuterBackground:
      'repeating-linear-gradient(0deg, rgba(68,82,122,0.12) 0, rgba(68,82,122,0.12) 2px, rgba(226,235,255,0.1) 2px, rgba(226,235,255,0.1) 4px), linear-gradient(120deg, #b9c7ea 0%, #a3b2da 32%, #e5edff 64%, #8e9fca 100%)',
    boardOuterBorder: '#7f91bd',
    diceLauncherActiveBackground: 'rgba(59, 76, 119, 0.9)',
    diceLauncherBorder: '#dbe7ff',
    diceLauncherIdleBackground: 'rgba(59, 76, 119, 0.48)',
    diceLauncherRing: '0 0 0 3px rgba(170,193,244,0.34)',
    diceLauncherText: '#eef5ff',
    headerBackground: 'linear-gradient(90deg, rgba(65,89,133,0.56) 0%, rgba(86,113,164,0.46) 50%, rgba(59,79,120,0.52) 100%)',
    headerBorder: '#314261',
    headerText: '#eef4ff',
    hudAvatarBackground: '#f4f7ff',
    hudCardBackground: 'rgba(226, 234, 250, 0.92)',
    hudCardBorder: 'rgba(95, 113, 154, 0.34)',
    hudCardText: '#324767',
    hudPillBackground: 'rgba(137, 156, 199, 0.18)',
    hudPillBorder: 'rgba(95, 113, 154, 0.28)',
    hudPillText: '#51688e',
    mainPanelBackground: 'linear-gradient(180deg, rgba(235,241,255,0.2) 0%, rgba(195,209,239,0.15) 52%, rgba(164,184,223,0.1) 100%)',
    mainPanelBorder: '#dbe4f9',
    neutralTrackFill: '#f5f8ff',
    sideInputBackground: '#f5f8ff',
    sideInputBorder: '#9eb1d7',
    sidePanelBackground: 'linear-gradient(180deg, #e8eefb 0%, #d0daf2 50%, #bcc9e7 100%)',
    sidePanelBorder: '#dbe4f9',
  },
  'theme-volcano': {
    accentPanelBackground: 'linear-gradient(180deg, #ffe3d5 0%, #f8c5b1 50%, #efab90 100%)',
    badgeBackground: 'linear-gradient(180deg, #ffd48f 0%, #ef9057 100%)',
    badgeBorder: '#9b4a26',
    badgeText: '#652c16',
    boardGlassGlow: 'rgba(255, 154, 110, 0.3)',
    boardGlassOverlay: 'linear-gradient(135deg, rgba(255,245,240,0.64) 0%, rgba(255,197,170,0.42) 50%, rgba(235,113,70,0.32) 100%)',
    boardGlassSheen: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,244,239,0.18) 34%, rgba(255,255,255,0.04) 100%)',
    boardGridOverlay:
      'linear-gradient(to right, rgba(108, 52, 32, 0.26) 1px, transparent 1px), linear-gradient(to bottom, rgba(108, 52, 32, 0.26) 1px, transparent 1px), repeating-linear-gradient(0deg, rgba(243, 176, 148, 0.12) 0, rgba(243, 176, 148, 0.12) 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
    boardInnerBackground: '#fde7dc',
    boardOuterBackground:
      'repeating-linear-gradient(0deg, rgba(151,72,40,0.12) 0, rgba(151,72,40,0.12) 2px, rgba(255,233,221,0.1) 2px, rgba(255,233,221,0.1) 4px), linear-gradient(120deg, #f7c4ad 0%, #ed9d7c 32%, #ffe7dc 64%, #d87c58 100%)',
    boardOuterBorder: '#d88761',
    diceLauncherActiveBackground: 'rgba(137, 58, 34, 0.88)',
    diceLauncherBorder: '#ffd9bf',
    diceLauncherIdleBackground: 'rgba(137, 58, 34, 0.44)',
    diceLauncherRing: '0 0 0 3px rgba(255,180,138,0.28)',
    diceLauncherText: '#fff1e6',
    headerBackground: 'linear-gradient(90deg, rgba(148,71,42,0.56) 0%, rgba(184,96,57,0.46) 50%, rgba(126,55,31,0.52) 100%)',
    headerBorder: '#692918',
    headerText: '#fff2e8',
    hudAvatarBackground: '#fff7f1',
    hudCardBackground: 'rgba(255, 236, 227, 0.92)',
    hudCardBorder: 'rgba(183, 100, 71, 0.34)',
    hudCardText: '#6a311d',
    hudPillBackground: 'rgba(228, 143, 111, 0.18)',
    hudPillBorder: 'rgba(183, 100, 71, 0.28)',
    hudPillText: '#8b4d35',
    mainPanelBackground: 'linear-gradient(180deg, rgba(255,239,233,0.2) 0%, rgba(246,196,173,0.15) 52%, rgba(230,146,113,0.1) 100%)',
    mainPanelBorder: '#f3d4c4',
    neutralTrackFill: '#fff7f3',
    sideInputBackground: '#fff7f1',
    sideInputBorder: '#d49a81',
    sidePanelBackground: 'linear-gradient(180deg, #ffece3 0%, #f9ccb8 50%, #efb093 100%)',
    sidePanelBorder: '#f3d4c4',
  },
  'theme-legend': {
    accentPanelBackground: 'linear-gradient(180deg, #fff5de 0%, #f1e3c0 50%, #e7d4a5 100%)',
    badgeBackground: 'linear-gradient(180deg, #fff2c8 0%, #d8b46d 100%)',
    badgeBorder: '#8c6c37',
    badgeText: '#5f4520',
    boardGlassGlow: 'rgba(240, 212, 143, 0.28)',
    boardGlassOverlay: 'linear-gradient(135deg, rgba(255,248,233,0.7) 0%, rgba(244,228,186,0.44) 54%, rgba(222,196,132,0.36) 100%)',
    boardGlassSheen: 'linear-gradient(180deg, rgba(255,255,255,0.44) 0%, rgba(255,250,238,0.2) 34%, rgba(255,255,255,0.04) 100%)',
    boardGridOverlay:
      'linear-gradient(to right, rgba(103, 88, 59, 0.24) 1px, transparent 1px), linear-gradient(to bottom, rgba(103, 88, 59, 0.24) 1px, transparent 1px), repeating-linear-gradient(0deg, rgba(237, 223, 182, 0.12) 0, rgba(237, 223, 182, 0.12) 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
    boardInnerBackground: '#f8f0da',
    boardOuterBackground:
      'repeating-linear-gradient(0deg, rgba(152,129,79,0.12) 0, rgba(152,129,79,0.12) 2px, rgba(255,244,220,0.1) 2px, rgba(255,244,220,0.1) 4px), linear-gradient(120deg, #efdcae 0%, #d9bd7f 32%, #fff2d7 64%, #c5a462 100%)',
    boardOuterBorder: '#c5a56a',
    diceLauncherActiveBackground: 'rgba(115, 89, 45, 0.88)',
    diceLauncherBorder: '#fff0cb',
    diceLauncherIdleBackground: 'rgba(115, 89, 45, 0.44)',
    diceLauncherRing: '0 0 0 3px rgba(232,206,141,0.28)',
    diceLauncherText: '#fff8eb',
    headerBackground: 'linear-gradient(90deg, rgba(135,97,51,0.54) 0%, rgba(169,127,73,0.44) 50%, rgba(111,81,45,0.5) 100%)',
    headerBorder: '#5c431f',
    headerText: '#fff6df',
    hudAvatarBackground: '#fff9ee',
    hudCardBackground: 'rgba(255, 248, 232, 0.92)',
    hudCardBorder: 'rgba(173, 142, 84, 0.34)',
    hudCardText: '#624a25',
    hudPillBackground: 'rgba(225, 198, 133, 0.18)',
    hudPillBorder: 'rgba(173, 142, 84, 0.28)',
    hudPillText: '#84663a',
    mainPanelBackground: 'linear-gradient(180deg, rgba(255,246,228,0.22) 0%, rgba(240,224,183,0.16) 52%, rgba(222,197,138,0.12) 100%)',
    mainPanelBorder: '#f1e1bb',
    neutralTrackFill: '#fffaf1',
    sideInputBackground: '#fff9ef',
    sideInputBorder: '#d4b67c',
    sidePanelBackground: 'linear-gradient(180deg, #fff6e1 0%, #efdfbb 50%, #e3ca95 100%)',
    sidePanelBorder: '#f1e1bb',
  },
}

const boardThemeIds = new Set<BoardThemeId>(boardThemeCatalog.map((theme) => theme.id))

export const normalizeBoardThemeId = (value: unknown): BoardThemeId => {
  if (typeof value === 'string' && boardThemeIds.has(value as BoardThemeId)) {
    return value as BoardThemeId
  }

  return 'theme-classic'
}

export const normalizeOwnedBoardThemeIds = (value: unknown, selectedBoardThemeId: BoardThemeId): BoardThemeId[] => {
  const provided = Array.isArray(value) ? value.map((entry) => normalizeBoardThemeId(entry)) : []
  const unique = new Set<BoardThemeId>(['theme-classic', selectedBoardThemeId, ...provided])
  return Array.from(unique)
}

export const getBoardThemeDefinition = (themeId: BoardThemeId) =>
  boardThemeCatalog.find((theme) => theme.id === themeId) || boardThemeCatalog[0]

export const getBoardThemeSurfacePalette = (themeId: BoardThemeId) => surfacePaletteByThemeId[themeId]

export const boardThemeIndexFromId = (themeId: BoardThemeId): number =>
  boardThemeCatalog.findIndex((theme) => theme.id === themeId)

export const boardThemeIdFromIndex = (index: number): BoardThemeId =>
  boardThemeCatalog[index]?.id || 'theme-classic'

export const getBoardThemeName = (themeId: BoardThemeId, language: ShopLanguage) =>
  localizeShopText(boardThemeCopyById[themeId]?.name || boardThemeCopyById['theme-classic'].name, language)

export const getBoardThemeSubtitle = (themeId: BoardThemeId, language: ShopLanguage) =>
  localizeShopText(boardThemeCopyById[themeId]?.subtitle || boardThemeCopyById['theme-classic'].subtitle, language)

export const getBoardThemeRarityLabel = (themeId: BoardThemeId, language: ShopLanguage) =>
  localizeShopRarity(boardThemeCopyById[themeId]?.rarityKey || 'common', language)
