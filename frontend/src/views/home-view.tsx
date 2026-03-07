import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameAvatar } from '../components/game/game-avatar'
import { ArcadeIcon, type ArcadeIconName } from '../components/ui/arcade-icon'
import { getPlayerSkinSrc, playerSkins } from '../lib/player-skins'
import { useControllerWallet } from '../lib/starknet/use-controller-wallet'
import { usePlayerProfile } from '../lib/use-player-profile'
import { GameConfigView } from './game-config-view'
import { type AiDifficulty, useAppSettingsStore } from '../store/app-settings-store'

type LobbySeat = {
  id: string
  name: string
  avatar: string
  color: 'red' | 'blue' | 'yellow' | 'green'
  ready: boolean
  isHost?: boolean
}

type LobbyConfig = {
  exitHomeRule: '5' | 'even' | '6'
  allowSumDice: boolean
  requiresExactHome: boolean
}

type LobbyEntry = {
  id: string
  name: string
  minPlayers: number
  maxPlayers: number
  seats: LobbySeat[]
  config: LobbyConfig
}

type ShopTab = 'avatars' | 'tokens' | 'dice' | 'themes'

type ShopItem = {
  id: string
  icon?: ArcadeIconName
  iconClassName?: string
  isStarterSkin?: boolean
  isSkinItem?: boolean
  mediaSrc?: string
  name?: string
  subtitle?: string
  price: number
  toneClass: string
}

type DifficultyOption = {
  id: AiDifficulty
  labelKey: 'difficultyEasy' | 'difficultyMedium' | 'difficultyHard'
}

const seatGradientClass: Record<LobbySeat['color'], string> = {
  red: 'from-[#f88272] to-[#cb3d2f]',
  blue: 'from-[#89d7ff] to-[#3a92dd]',
  yellow: 'from-[#ffe58b] to-[#d4a518]',
  green: 'from-[#9ce88f] to-[#349a5c]',
}

const panelIconRows = [
  ['coin', 'ball', 'brain', 'target', 'music'],
  ['coin', 'fireworks', 'handshake', 'puzzle', 'sparkle'],
  ['coin', 'book', 'brain', 'star', 'target'],
] as const

const shopTabs: { id: ShopTab; labelKey: 'shopTabAvatars' | 'shopTabTokens' | 'shopTabDice' | 'shopTabThemes' }[] = [
  { id: 'avatars', labelKey: 'shopTabAvatars' },
  { id: 'tokens', labelKey: 'shopTabTokens' },
  { id: 'dice', labelKey: 'shopTabDice' },
  { id: 'themes', labelKey: 'shopTabThemes' },
]

const difficultyOptions: DifficultyOption[] = [
  { id: 'easy', labelKey: 'difficultyEasy' },
  { id: 'medium', labelKey: 'difficultyMedium' },
  { id: 'hard', labelKey: 'difficultyHard' },
]

const shopItemsByTab: Record<ShopTab, ShopItem[]> = {
  avatars: [
    ...playerSkins.map((skin, index) => ({
      id: skin.id,
      isStarterSkin: skin.price === 0,
      isSkinItem: true,
      mediaSrc: skin.src,
      name: skin.name,
      subtitle: skin.subtitle,
      price: skin.price,
      toneClass:
        index % 3 === 0
          ? 'from-[#ffefdb] to-[#fddcab]'
          : index % 3 === 1
            ? 'from-[#eff2ff] to-[#d8dbfb]'
            : 'from-[#e8fbff] to-[#cbf1ff]',
    })),
  ],
  tokens: [
    { id: 'token-ruby', icon: 'token-red', price: 300, toneClass: 'from-[#ffe5df] to-[#ffc5b8]' },
    { id: 'token-sapphire', icon: 'token-blue', price: 300, toneClass: 'from-[#e3f0ff] to-[#bcd9ff]' },
    { id: 'token-emerald', icon: 'token-green', price: 300, toneClass: 'from-[#e6ffe9] to-[#c0efc8]' },
    { id: 'token-gold', icon: 'token-yellow', price: 300, toneClass: 'from-[#fff6d9] to-[#f6e09a]' },
    { id: 'token-fire', icon: 'fire', iconClassName: 'text-[#c85417]', price: 700, toneClass: 'from-[#ffe9d6] to-[#ffca9d]' },
    { id: 'token-ice', icon: 'snowflake', iconClassName: 'text-[#4a94d8]', price: 700, toneClass: 'from-[#edf7ff] to-[#cee7fb]' },
    { id: 'token-jungle', icon: 'leaf', iconClassName: 'text-[#3a9e53]', price: 900, toneClass: 'from-[#ecffe6] to-[#c8efb8]' },
    { id: 'token-royal', icon: 'crown', iconClassName: 'text-[#af7914]', price: 1200, toneClass: 'from-[#fff4d7] to-[#f0d18f]' },
  ],
  dice: [
    { id: 'dice-wood', icon: 'dice', iconClassName: 'text-[#8f5a32]', price: 250, toneClass: 'from-[#f5ecdf] to-[#e2d3bf]' },
    { id: 'dice-neon', icon: 'dice', iconClassName: 'text-[#2c7dd9]', price: 400, toneClass: 'from-[#e7f1ff] to-[#c8ddff]' },
    { id: 'dice-galaxy', icon: 'dice', iconClassName: 'text-[#715ad2]', price: 650, toneClass: 'from-[#eee6ff] to-[#d3c6f9]' },
    { id: 'dice-candy', icon: 'dice', iconClassName: 'text-[#d35a9f]', price: 350, toneClass: 'from-[#ffeaf2] to-[#ffd0e2]' },
    { id: 'dice-lucky', icon: 'clover', iconClassName: 'text-[#449e4c]', price: 800, toneClass: 'from-[#e9ffe7] to-[#c8f1c4]' },
    { id: 'dice-gold', icon: 'medal', iconClassName: 'text-[#b57a15]', price: 1000, toneClass: 'from-[#fff4d5] to-[#eac87d]' },
    { id: 'dice-lightning', icon: 'bolt', iconClassName: 'text-[#c88700]', price: 900, toneClass: 'from-[#fff5d5] to-[#f5de9c]' },
    { id: 'dice-crown', icon: 'crown', iconClassName: 'text-[#b57a15]', price: 1400, toneClass: 'from-[#fff1d7] to-[#edcf92]' },
  ],
  themes: [
    { id: 'theme-classic', icon: 'flag', iconClassName: 'text-[#80614a]', price: 300, toneClass: 'from-[#f7eddf] to-[#e4d4c2]' },
    { id: 'theme-rainbow', icon: 'rainbow', iconClassName: 'text-[#4386df]', price: 550, toneClass: 'from-[#edf8ff] to-[#d2eeff]' },
    { id: 'theme-castle', icon: 'castle', iconClassName: 'text-[#7d67cc]', price: 900, toneClass: 'from-[#eee9ff] to-[#d8d0fa]' },
    { id: 'theme-jungle', icon: 'palm', iconClassName: 'text-[#4a9658]', price: 800, toneClass: 'from-[#efffe9] to-[#cdeebf]' },
    { id: 'theme-desert', icon: 'desert', iconClassName: 'text-[#b37b3d]', price: 700, toneClass: 'from-[#fff0df] to-[#f5d0aa]' },
    { id: 'theme-night', icon: 'moon', iconClassName: 'text-[#6675ce]', price: 850, toneClass: 'from-[#e9ebff] to-[#cfd5fa]' },
    { id: 'theme-volcano', icon: 'volcano', iconClassName: 'text-[#c15f32]', price: 950, toneClass: 'from-[#ffe8dd] to-[#f9c2ad]' },
    { id: 'theme-legend', icon: 'wand', iconClassName: 'text-[#b8861f]', price: 1500, toneClass: 'from-[#fff2d9] to-[#efd29f]' },
  ],
}

const homeCopyByLanguage = {
  es: {
    shop: 'TIENDA',
    settings: 'CONFIGURACION',
    center: 'CENTRO DE PARTIDAS',
    playOnline: 'JUGAR ONLINE',
    friendsMode: 'CREAR/UNIRSE CON AMIGOS',
    aiPractice: 'PRACTICA CON AI',
    onlineDescription: 'Encuentra un rival rapido y demuestra tu saber.',
    friendsDescription: 'Invita a tus amigos por codigo o unete a su partida.',
    aiDescription: 'Entrena contra oponentes inteligentes y mejora tus habilidades.',
    playNow: '!A JUGAR!',
    inviteJoin: 'INVITAR/UNIRSE',
    ready: 'LISTO',
    roomCode: 'CODIGO DE PARTIDA',
    practiceNow: '!PRACTICAR!',
    difficultyEasy: 'FACIL',
    difficultyMedium: 'MEDIO',
    difficultyHard: 'DIFICIL',
    shopModalTitle: 'TIENDA PARQUIZ',
    shopTabAvatars: 'SKINS DE CAPIS',
    shopTabTokens: 'FICHAS',
    shopTabDice: 'DADOS',
    shopTabThemes: 'TEMAS',
    closeShop: 'CERRAR TIENDA',
    equipSkin: 'EQUIPAR',
    equippedSkin: 'EQUIPADA',
    levelLabel: 'Nivel',
    prestigeLabel: 'Prestigio',
    starterSkin: 'INICIAL',
    premiumSkin: 'CATALOGO',
  },
  en: {
    shop: 'SHOP',
    settings: 'SETTINGS',
    center: 'MATCH CENTER',
    playOnline: 'PLAY ONLINE',
    friendsMode: 'CREATE/JOIN WITH FRIENDS',
    aiPractice: 'PRACTICE WITH AI',
    onlineDescription: 'Find a quick rival and prove your skills.',
    friendsDescription: 'Invite your friends by code or join their room.',
    aiDescription: 'Train against smart opponents and level up your skills.',
    playNow: 'PLAY NOW!',
    inviteJoin: 'INVITE/JOIN',
    ready: 'READY',
    roomCode: 'MATCH CODE',
    practiceNow: 'PRACTICE!',
    difficultyEasy: 'EASY',
    difficultyMedium: 'MEDIUM',
    difficultyHard: 'HARD',
    shopModalTitle: 'PARQUIZ SHOP',
    shopTabAvatars: 'CAPI SKINS',
    shopTabTokens: 'TOKENS',
    shopTabDice: 'DICE',
    shopTabThemes: 'THEMES',
    closeShop: 'CLOSE SHOP',
    equipSkin: 'EQUIP',
    equippedSkin: 'EQUIPPED',
    levelLabel: 'Level',
    prestigeLabel: 'Prestige',
    starterSkin: 'STARTER',
    premiumSkin: 'CATALOG',
  },
} as const

const currentUserId = 'you-player'

const initialLobbies: LobbyEntry[] = [
  {
    id: 'LOB-248A',
    name: 'Sala Clasica #248A',
    minPlayers: 2,
    maxPlayers: 4,
    config: {
      exitHomeRule: '5',
      allowSumDice: true,
      requiresExactHome: true,
    },
    seats: [
      {
        id: 'you-player',
        name: 'Tu Jugador',
        avatar: 'TU',
        color: 'green',
        ready: false,
        isHost: true,
      },
      {
        id: 'bot-red',
        name: 'RedBot',
        avatar: 'RB',
        color: 'red',
        ready: true,
      },
    ],
  },
  {
    id: 'LOB-91CZ',
    name: 'Sala Rapida #91CZ',
    minPlayers: 2,
    maxPlayers: 4,
    config: {
      exitHomeRule: 'even',
      allowSumDice: false,
      requiresExactHome: true,
    },
    seats: [
      {
        id: 'host-blue',
        name: 'BlueHost',
        avatar: 'BH',
        color: 'blue',
        ready: true,
        isHost: true,
      },
      {
        id: 'yellow-pro',
        name: 'YellowPro',
        avatar: 'YP',
        color: 'yellow',
        ready: false,
      },
      {
        id: 'guest-1',
        name: 'Guest',
        avatar: 'GS',
        color: 'green',
        ready: false,
      },
    ],
  },
]

export function HomeView() {
  const navigate = useNavigate()
  const selectedLobby = initialLobbies[0]
  const activePlayers = selectedLobby.seats
  const me = activePlayers.find((player) => player.id === currentUserId)
  const readyCount = activePlayers.filter((seat) => seat.ready).length
  const levelProgress = Math.min(100, 42 + readyCount * 16 + (me?.ready ? 14 : 0))

  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [activeShopTab, setActiveShopTab] = useState<ShopTab>('avatars')
  const aiDifficulty = useAppSettingsStore((state) => state.aiDifficulty)
  const setAiDifficulty = useAppSettingsStore((state) => state.setAiDifficulty)
  const language = useAppSettingsStore((state) => state.language)
  const selectedSkinId = useAppSettingsStore((state) => state.selectedSkinId)
  const setSelectedSkinId = useAppSettingsStore((state) => state.setSelectedSkinId)
  const { username } = useControllerWallet()
  const playerProfile = usePlayerProfile()
  const ui = homeCopyByLanguage[language]
  const selectedSkinSrc = getPlayerSkinSrc(selectedSkinId)
  const displayUsername = playerProfile.username || username || 'PARQUIZ_PLAYER_77'
  const levelLabel = `${ui.levelLabel} ${playerProfile.level}`
  const prestigeLabel = `${ui.prestigeLabel} ${playerProfile.prestige}`
  const shopItems = shopItemsByTab[activeShopTab]
  const coinBalance = 125000
  const coinLabel = coinBalance.toLocaleString('en-US')

  const onOnlinePlay = () => {
    navigate('/lobby')
  }

  const onInviteJoin = () => {
    navigate('/lobby-friends')
  }

  const onPracticeWithAi = () => {
    navigate(`/board-mock?mode=ai&difficulty=${aiDifficulty}`)
  }

  const openConfigPanel = () => {
    setIsConfigOpen(true)
  }

  const openShopPanel = () => {
    setIsShopOpen(true)
  }

  const closeConfigPanel = () => {
    setIsConfigOpen(false)
  }

  const closeShopPanel = () => {
    setIsShopOpen(false)
  }

  useEffect(() => {
    if (!isConfigOpen && !isShopOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isConfigOpen) {
          setIsConfigOpen(false)
          return
        }

        if (isShopOpen) {
          setIsShopOpen(false)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isConfigOpen, isShopOpen])

  return (
    <section
      className="relative isolate flex min-h-screen flex-col overflow-hidden px-4 pb-8 pt-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/home-background.jpg')",
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      {/* Darkening overlay to match lighting */}
      <span className="pointer-events-none absolute inset-0 bg-[#351e10]/30" />
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,233,193,0.3),transparent_40%),radial-gradient(circle_at_90%_60%,rgba(255,200,100,0.25),transparent_40%)]" />

      {/* Fake Lamp Glow on the right side */}
      <div className="pointer-events-none absolute bottom-[10%] right-[2%] hidden h-[400px] w-[300px] lg:block xl:right-[4%]">
        <span className="absolute left-[50px] top-[100px] h-[200px] w-[200px] rounded-full bg-[#ffda85]/40 blur-[50px]" />
      </div>

      <div className="relative z-20 mx-auto flex w-full max-w-[1400px] flex-1 flex-col">
        {/* HEADER */}
        <header className="flex flex-col items-center justify-between gap-4 xl:flex-row xl:items-start">
          {/* Left: Player Profile */}
          <article className="flex h-[76px] items-center rounded-full border-[3px] border-[#a3704b] bg-gradient-to-b from-[#8f5a35] to-[#59341b] pr-6 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
            <div className={`relative -ml-2 -my-2 flex h-[90px] w-[90px] items-center justify-center rounded-full border-[4px] border-[#ffdf91] bg-gradient-to-b ${seatGradientClass[me?.color || 'blue']} shadow-[0_6px_12px_rgba(0,0,0,0.4)]`}>
              <GameAvatar
                alt="Avatar"
                avatar={selectedSkinSrc || me?.avatar || 'PQ'}
                imageClassName="h-full w-full object-contain p-1.5"
                textClassName="text-2xl font-black text-white"
              />
            </div>
            <div className="ml-3 flex flex-col justify-center">
              <p className="font-display text-[28px] uppercase leading-none text-[#fff4d4] drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                {displayUsername}
              </p>
              <div className="mt-1.5 h-3.5 w-48 rounded-full border-2 border-[#432314] bg-[#2a131b] p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#44d0ff] to-[#3d79ce]"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <div className="mt-1 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#ffda8e]">
                <span>{levelLabel}</span>
                <span className="opacity-50">|</span>
                <span>{prestigeLabel}</span>
              </div>
            </div>
          </article>

          {/* Center: Logo and Gems */}
          <div className="flex flex-col items-center xl:mt-[-10px]">
            <div className="relative flex flex-col items-center rounded-[30px] border-[4px] border-[#8e857e] bg-gradient-to-b from-[#76716e] to-[#474341] px-10 py-3 shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
              <img alt="ParQuiz" className="h-16 w-auto drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] sm:h-20" src="/parquiz-logo.png" />
              
              <div className="mt-3 flex gap-2.5">
                {[
                  { icon: 'star', bg: 'from-[#ffda75] to-[#c68919]', border: 'border-[#915e12]' },
                  { icon: 'puzzle', bg: 'from-[#e483d3] to-[#8d2777]', border: 'border-[#611651]' },
                  { icon: 'brain', bg: 'from-[#65b2f2] to-[#22579b]', border: 'border-[#143666]' },
                  { icon: 'leaf', bg: 'from-[#82db61] to-[#2c771f]', border: 'border-[#184a10]' },
                  { icon: 'wand', bg: 'from-[#b074e8] to-[#5b2496]', border: 'border-[#3f156b]' },
                ].map((gem, i) => (
                  <span key={i} className={`flex h-11 w-11 items-center justify-center rounded-full border-[3px] ${gem.border} bg-gradient-to-b ${gem.bg} shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.4)]`}>
                    <ArcadeIcon name={gem.icon as ArcadeIconName} className="h-6 w-6 text-white drop-shadow-md" />
                  </span>
                ))}
              </div>
            </div>

            <div className="relative -mt-5 rounded-full border-[3px] border-[#a47b52] bg-gradient-to-b from-[#fce4ba] via-[#e2be84] to-[#c29656] px-12 py-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
              <p className="font-display text-[22px] uppercase text-[#5a3116] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                {ui.center}
              </p>
            </div>
          </div>

          {/* Right: Coins, Shop, Settings */}
          <div className="flex items-start gap-4">
            <div className="flex h-[60px] items-center gap-2 rounded-full border-[3px] border-[#915e38] bg-gradient-to-b from-[#5c3116] to-[#3a1a09] pl-6 pr-2 shadow-[0_8px_16px_rgba(0,0,0,0.5)] mt-2">
              <span className="font-display text-[32px] leading-none text-[#ffebba] drop-shadow-md">{coinLabel}</span>
              <ArcadeIcon className="h-10 w-10 text-[#f7cc4c]" name="coin" />
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <button
                className="flex h-[76px] w-[76px] items-center justify-center rounded-[20px] border-[3px] border-[#c0904a] bg-gradient-to-b from-[#ffeaba] to-[#d69f45] shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition hover:brightness-110"
                onClick={openShopPanel}
                title={ui.shop}
                type="button"
              >
                <ArcadeIcon className="h-10 w-10 text-[#7d481b]" name="store" />
              </button>
              <span className="font-display text-[15px] uppercase text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                {ui.shop}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <button
                className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-[3px] border-[#a1a1a1] bg-gradient-to-b from-[#e8e8e8] to-[#8f8f8f] shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition hover:brightness-110"
                onClick={openConfigPanel}
                title={ui.settings}
                type="button"
              >
                <ArcadeIcon className="h-9 w-9 text-[#4a4a4a]" name="settings" />
              </button>
              <span className="font-display text-[15px] uppercase text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                {ui.settings}
              </span>
            </div>
          </div>
        </header>

        {/* CENTER PANEL */}
        <main className="mx-auto mt-10 w-full max-w-[1240px] flex-1">
          <div className="rounded-[36px] border-[5px] border-[#5e371c] bg-gradient-to-b from-[#c08655] to-[#8b552d] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
            <div className="grid gap-3 rounded-[26px] border-[4px] border-[#7d4a2b] bg-[#4a2712] p-3 lg:grid-cols-3">
              
              {/* CARD 1: JUGAR ONLINE */}
              <article className="flex flex-col rounded-[22px] border-4 border-[#a3704b] bg-[#fbf1dc] shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                <header className="rounded-t-[16px] border-b-4 border-[#855130] bg-gradient-to-b from-[#cd9e71] to-[#b17947] p-4 text-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]">
                  <h3 className="font-display text-[30px] uppercase leading-none text-[#4a2711] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    {ui.playOnline}
                  </h3>
                </header>
                <div className="flex flex-1 flex-col items-center px-6 py-8">
                  <div className="flex items-center justify-center gap-4">
                    <span className="flex h-[80px] w-[80px] items-center justify-center rounded-full border-4 border-[#9a5839] bg-gradient-to-b from-[#e6b47f] to-[#b45737] shadow-[0_6px_12px_rgba(0,0,0,0.3)]">
                      <ArcadeIcon className="h-10 w-10 text-white" name="user" />
                    </span>
                    <span className="font-display text-[40px] text-[#8c5738]">VS</span>
                    <span className="flex h-[80px] w-[80px] items-center justify-center rounded-full border-4 border-[#3274a8] bg-gradient-to-b from-[#b5edff] to-[#2f7bbc] shadow-[0_6px_12px_rgba(0,0,0,0.3)]">
                      <ArcadeIcon className="h-10 w-10 text-white" name="globe" />
                    </span>
                  </div>
                  <p className="mt-8 text-center text-[22px] font-black leading-tight text-[#4a3424]">
                    {ui.onlineDescription}
                  </p>
                  <div className="mt-auto pt-8 w-full">
                    <button
                      className="w-full rounded-full border-b-[6px] border-[#1e5215] bg-gradient-to-b from-[#7bc05b] to-[#3a7c24] py-3 font-display text-[36px] uppercase leading-none text-white shadow-[0_8px_16px_rgba(0,0,0,0.4)] transition hover:translate-y-1 hover:border-b-[2px] hover:shadow-[0_4px_8px_rgba(0,0,0,0.4)] active:border-b-0 active:translate-y-2"
                      onClick={onOnlinePlay}
                      type="button"
                    >
                      {ui.playNow}
                    </button>
                    <div className="mt-6 flex justify-center gap-3">
                      {panelIconRows[0].map((icon) => (
                        <span key={icon} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#d1ab80] bg-[#efe1c2] shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]">
                          <ArcadeIcon className="h-5 w-5 text-[#89643d]" name={icon as ArcadeIconName} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              {/* CARD 2: CREAR/UNIRSE CON AMIGOS */}
              <article className="flex flex-col rounded-[22px] border-4 border-[#a3704b] bg-[#fbf1dc] shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                <header className="rounded-t-[16px] border-b-4 border-[#855130] bg-gradient-to-b from-[#cd9e71] to-[#b17947] p-4 text-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]">
                  <h3 className="font-display text-[30px] uppercase leading-none text-[#4a2711] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    {ui.friendsMode}
                  </h3>
                </header>
                <div className="flex flex-1 flex-col items-center px-6 py-8">
                  <div className="flex items-center justify-center gap-2">
                    <span className="flex h-[70px] w-[70px] items-center justify-center rounded-full border-4 border-[#9a5839] bg-gradient-to-b from-[#e6b47f] to-[#b45737] shadow-[0_6px_12px_rgba(0,0,0,0.3)]">
                      <ArcadeIcon className="h-9 w-9 text-white" name="users" />
                    </span>
                    <span className="flex h-[40px] w-[40px] items-center justify-center rounded-full border-2 border-[#b88a55] bg-[#fff4dd] shadow-sm">
                      <ArcadeIcon className="h-5 w-5 text-[#7c532a]" name="link" />
                    </span>
                    <span className="flex h-[70px] w-[70px] items-center justify-center rounded-full border-4 border-[#5e8fc1] bg-gradient-to-b from-[#d6ecff] to-[#4e86c0] shadow-[0_6px_12px_rgba(0,0,0,0.3)]">
                      <ArcadeIcon className="h-9 w-9 text-white" name="users" />
                    </span>
                    <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-4 border-[#3274a8] bg-gradient-to-b from-[#b5edff] to-[#2f7bbc] shadow-[0_6px_12px_rgba(0,0,0,0.3)]">
                      <ArcadeIcon className="h-8 w-8 text-white" name="globe" />
                    </span>
                  </div>
                  <p className="mt-8 text-center text-[22px] font-black leading-tight text-[#4a3424]">
                    {ui.friendsDescription}
                  </p>
                  <div className="mt-auto pt-8 w-full">
                    <button
                      className="w-full rounded-full border-b-[6px] border-[#1e5215] bg-gradient-to-b from-[#7bc05b] to-[#3a7c24] py-3 font-display text-[32px] uppercase leading-none text-white shadow-[0_8px_16px_rgba(0,0,0,0.4)] transition hover:translate-y-1 hover:border-b-[2px] hover:shadow-[0_4px_8px_rgba(0,0,0,0.4)] active:border-b-0 active:translate-y-2"
                      onClick={onInviteJoin}
                      type="button"
                    >
                      {me?.ready ? ui.ready : ui.inviteJoin}
                    </button>
                    <div className="mt-6 flex justify-center gap-3">
                      {panelIconRows[1].map((icon) => (
                        <span key={icon} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#d1ab80] bg-[#efe1c2] shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]">
                          <ArcadeIcon className="h-5 w-5 text-[#89643d]" name={icon as ArcadeIconName} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              {/* CARD 3: PRACTICA CON AI */}
              <article className="flex flex-col rounded-[22px] border-4 border-[#a3704b] bg-[#fbf1dc] shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                <header className="rounded-t-[16px] border-b-4 border-[#855130] bg-gradient-to-b from-[#cd9e71] to-[#b17947] p-4 text-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]">
                  <h3 className="font-display text-[30px] uppercase leading-none text-[#4a2711] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    {ui.aiPractice}
                  </h3>
                </header>
                <div className="flex flex-1 flex-col items-center px-6 py-8">
                  <div className="flex items-center justify-center gap-4">
                    <span className="flex h-[80px] w-[80px] items-center justify-center rounded-full border-4 border-[#2f75aa] bg-gradient-to-b from-[#cdeeff] to-[#2f7bbc] shadow-[0_6px_12px_rgba(0,0,0,0.3)]">
                      <ArcadeIcon className="h-10 w-10 text-white" name="robot" />
                    </span>
                    <span className="flex h-[80px] w-[80px] items-center justify-center rounded-full border-4 border-[#356aa6] bg-gradient-to-b from-[#e8edff] to-[#4f72bb] shadow-[0_6px_12px_rgba(0,0,0,0.3)]">
                      <ArcadeIcon className="h-10 w-10 text-white" name="brain" />
                    </span>
                  </div>
                  <p className="mt-8 text-center text-[22px] font-black leading-tight text-[#4a3424]">
                    {ui.aiDescription}
                  </p>
                  <div className="mt-auto pt-8 w-full">
                    <button
                      className="w-full rounded-full border-b-[6px] border-[#1e5215] bg-gradient-to-b from-[#7bc05b] to-[#3a7c24] py-3 font-display text-[36px] uppercase leading-none text-white shadow-[0_8px_16px_rgba(0,0,0,0.4)] transition hover:translate-y-1 hover:border-b-[2px] hover:shadow-[0_4px_8px_rgba(0,0,0,0.4)] active:border-b-0 active:translate-y-2"
                      onClick={onPracticeWithAi}
                      type="button"
                    >
                      {ui.practiceNow}
                    </button>
                    
                    <div className="mt-4 rounded-full border-2 border-[#d1b185] bg-[#ebd8b4] p-1 shadow-inner">
                      <div className="grid grid-cols-3 gap-1">
                        {difficultyOptions.map((option) => {
                          const isActive = aiDifficulty === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setAiDifficulty(option.id)}
                              className={`rounded-full py-1.5 text-center text-[13px] font-black uppercase tracking-wide transition-all sm:text-[14px] ${
                                isActive
                                  ? 'bg-gradient-to-b from-[#ffe39d] to-[#efbc59] text-[#5f3817] shadow-sm border border-[#bc7f2c]'
                                  : 'text-[#8a6038] hover:text-[#5a3a1f] border border-transparent'
                              }`}
                            >
                              {ui[option.labelKey]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-center gap-3">
                      {panelIconRows[2].map((icon) => (
                        <span key={icon} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#d1ab80] bg-[#efe1c2] shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]">
                          <ArcadeIcon className="h-5 w-5 text-[#89643d]" name={icon as ArcadeIconName} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </main>
      </div>

      {/* MODALS */}
      {isShopOpen ? (
        <div className="fixed inset-0 z-[142] flex items-center justify-center p-2 sm:p-5">
          <button
            aria-label={ui.closeShop}
            className="absolute inset-0 bg-[#150a03]/60 backdrop-blur-sm"
            onClick={closeShopPanel}
            type="button"
          />

          <div className="relative z-10 w-full max-w-[1050px]">
            <div className="relative rounded-[34px] border-[5px] border-[#7b4828] bg-gradient-to-b from-[#bc7c49] via-[#956036] to-[#6f4428] p-2 shadow-[0_24px_48px_rgba(32,16,7,0.56)] sm:p-3">
              <div className="absolute right-5 top-2 rounded-full border-2 border-[#8b5332] bg-gradient-to-b from-[#7b4b2f] to-[#58331f] px-4 py-1.5 text-[26px] font-black tracking-wide text-[#fff2d4] shadow-[inset_0_1px_0_rgba(255,228,178,0.38)]">
                <ArcadeIcon className="mr-2 inline-block h-6 w-6 text-[#ffd24e]" name="coin" />
                {coinLabel}
              </div>

              <div className="mx-auto mt-[-20px] w-fit rounded-[18px] border-[4px] border-[#8f562f] bg-gradient-to-b from-[#b77445] via-[#915731] to-[#6d4327] px-8 py-2 shadow-[inset_0_1px_0_rgba(255,225,189,0.66),0_4px_0_rgba(102,58,29,0.88)] sm:px-12">
                <p className="font-display text-4xl uppercase tracking-wide text-[#ffeac2] sm:text-5xl">
                  {ui.shopModalTitle}
                </p>
              </div>

              <div className="mt-3 rounded-[26px] border-2 border-[#9c633b] bg-gradient-to-b from-[#f4d9af] to-[#eac38e] p-3 sm:p-4">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {shopTabs.map((tab) => {
                    const isActive = activeShopTab === tab.id
                    return (
                      <button
                        className={`rounded-[16px] border px-5 py-2 font-display text-2xl uppercase tracking-wide transition sm:text-3xl ${
                          isActive
                            ? 'border-[#ccb188] bg-gradient-to-b from-[#fff4da] to-[#f7e2ba] text-[#4a2b15] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]'
                            : 'border-[#8f562f] bg-gradient-to-b from-[#a46539] to-[#7a4727] text-[#f7ddad] hover:brightness-105'
                        }`}
                        key={tab.id}
                        onClick={() => setActiveShopTab(tab.id)}
                        type="button"
                      >
                        {ui[tab.labelKey]}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 rounded-[24px] border-[3px] border-[#ceaf84] bg-gradient-to-b from-[#fff4dc] to-[#f6e0bc] p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {shopItems.map((item) => (
                      (() => {
                        const isEquippedSkin = item.isSkinItem && item.id === selectedSkinId

                        return (
                      <article
                        className={`rounded-[20px] border-2 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] ${
                          isEquippedSkin
                            ? 'border-[#e0b54f] bg-gradient-to-b from-[#fff7d6] to-[#f2dda5] shadow-[0_0_0_3px_rgba(247,202,88,0.28)]'
                            : 'border-[#d7b889] bg-gradient-to-b from-[#fff8e8] to-[#f3dfba]'
                        }`}
                        key={item.id}
                      >
                        <div className={`flex h-28 items-center justify-center rounded-[16px] bg-gradient-to-b ${item.toneClass} text-[70px] sm:text-[76px]`}>
                          {item.mediaSrc ? (
                            <GameAvatar alt={item.name || item.id} avatar={item.mediaSrc} imageClassName="h-full w-full object-contain p-2" />
                          ) : (
                            item.icon ? <ArcadeIcon className={`h-16 w-16 ${item.iconClassName || 'text-[#6a4324]'}`} name={item.icon} /> : null
                          )}
                        </div>
                        {item.name ? (
                          <>
                            <div className="mt-2 flex items-center justify-center gap-2">
                              <p className="text-center text-[12px] font-black uppercase tracking-wide text-[#6d4324] sm:text-[13px]">
                                {item.name}
                              </p>
                              {item.isSkinItem ? (
                                <span className="rounded-full border border-[#b98236] bg-gradient-to-b from-[#ffe28f] to-[#f3b949] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#5f3817]">
                                  {item.isStarterSkin ? ui.starterSkin : ui.premiumSkin}
                                </span>
                              ) : null}
                            </div>
                            {item.subtitle ? (
                              <p className="mt-1 text-center text-[10px] font-black uppercase tracking-[0.12em] text-[#91633d] sm:text-[11px]">
                                {item.subtitle}
                              </p>
                            ) : null}
                          </>
                        ) : null}
                        <div className="mt-2 rounded-full border border-[#d2b083] bg-[#e8cfaa] px-3 py-1 text-center font-display text-[34px] leading-none text-[#5a3417] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                          <ArcadeIcon className="mr-1 inline-block h-6 w-6 text-[#f6be2f]" name="coin" />
                          {item.price}
                        </div>
                        {item.isSkinItem ? (
                          <button
                            className={`mt-2 w-full rounded-full border px-3 py-1.5 font-display text-lg uppercase tracking-wide transition ${
                              isEquippedSkin
                                ? 'border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_4px_0_rgba(38,95,22,0.85)]'
                                : 'border-[#8f562f] bg-gradient-to-b from-[#a46539] to-[#7a4727] text-[#f7ddad] shadow-[inset_0_1px_0_rgba(255,225,189,0.45),0_4px_0_rgba(102,58,29,0.88)] hover:brightness-105'
                            }`}
                            onClick={() => setSelectedSkinId(item.id)}
                            type="button"
                          >
                            {isEquippedSkin ? ui.equippedSkin : ui.equipSkin}
                          </button>
                        ) : null}
                      </article>
                        )
                      })()
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-center pb-1">
                <button
                  className="rounded-full border-[3px] border-[#9f3f2c] bg-gradient-to-b from-[#f7785f] to-[#d2472d] px-10 py-2 font-display text-4xl uppercase tracking-wide text-[#ffe3bc] shadow-[inset_0_1px_0_rgba(255,220,188,0.72),0_7px_0_rgba(132,45,27,0.92)] sm:text-5xl"
                  onClick={closeShopPanel}
                  type="button"
                >
                  {ui.closeShop}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isConfigOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-5">
          <button
            aria-label="Cerrar configuracion"
            className="absolute inset-0 bg-[#120803]/70 backdrop-blur-[5px]"
            onClick={closeConfigPanel}
            type="button"
          />

          <div className="relative z-10 max-h-[96vh] w-full max-w-[1280px] overflow-y-auto drop-shadow-[0_30px_70px_rgba(16,8,3,0.55)]">
            <GameConfigView embedded onClose={closeConfigPanel} />
          </div>
        </div>
      ) : null}
    </section>
  )
}
