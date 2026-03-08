import { useAccount } from '@starknet-react/core'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setPlayerCustomization } from '../api'
import { GameAvatar } from '../components/game/game-avatar'
import { GameDie } from '../components/game/game-die'
import { boardThemeCatalog, type BoardThemeId } from '../lib/board-themes'
import { TokenChip } from '../components/game/token-chip'
import { diceSkinCatalog, diceSkinIndexFromId, type DiceSkinId } from '../lib/dice-cosmetics'
import { appEnv } from '../config/env'
import { getPlayerVisualTheme } from '../lib/player-color-themes'
import { tokenSkinCatalog, tokenSkinIndexFromId, type TokenSkinId } from '../lib/token-cosmetics'
import { getPlayerSkinSrc, playerSkinIndexFromId, playerSkins } from '../lib/player-skins'
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
  boardThemeId?: BoardThemeId
  diceSkinId?: DiceSkinId
  id: string
  icon?: string
  isBoardThemeItem?: boolean
  isDiceItem?: boolean
  isStarterSkin?: boolean
  isSkinItem?: boolean
  isTokenItem?: boolean
  mediaSrc?: string
  previewImageSrc?: string
  name?: string
  subtitle?: string
  price: number
  rarityLabel?: string
  tokenSkinId?: TokenSkinId
  toneClass: string
}

type DifficultyOption = {
  id: AiDifficulty
  labelKey: 'difficultyEasy' | 'difficultyMedium' | 'difficultyHard'
}

const medalIcons = [
  { icon: '★', tone: 'from-[#f4c54e] to-[#d7900f]' },
  { icon: '⚽', tone: 'from-[#eb78c8] to-[#a53d8b]' },
  { icon: '✦', tone: 'from-[#79d47c] to-[#26865b]' },
  { icon: '🎲', tone: 'from-[#6fc8ef] to-[#2f7cb8]' },
  { icon: '➟', tone: 'from-[#bf85e6] to-[#8249b8]' },
] as const

const panelIconRows = [
  ['🪙', '⚽', '🧠', '🎯', '🎵'],
  ['🪙', '🎉', '🤝', '🧩', '✨'],
  ['🪙', '📘', '🧠', '⭐', '🎯'],
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
    ...tokenSkinCatalog.map((skin) => ({
      id: `token-${skin.id}`,
      isTokenItem: true,
      name: skin.name,
      price: skin.price,
      rarityLabel: skin.rarityLabel,
      subtitle: skin.rarityLabel === 'Especial' ? 'Edicion especial' : 'Ficha equipable',
      tokenSkinId: skin.id,
      toneClass: skin.previewToneClass,
    })),
  ],
  dice: [
    ...diceSkinCatalog.map((skin) => ({
      id: `dice-${skin.id}`,
      isDiceItem: true,
      name: skin.name,
      price: skin.price,
      rarityLabel: skin.rarityLabel,
      subtitle: skin.subtitle,
      diceSkinId: skin.id,
      toneClass: skin.previewToneClass,
    })),
  ],
  themes: [
    ...boardThemeCatalog.map((theme) => ({
      id: theme.id,
      icon: theme.icon,
      isBoardThemeItem: true,
      name: theme.name,
      price: theme.price,
      previewImageSrc: theme.previewImageSrc,
      rarityLabel: theme.rarityLabel,
      subtitle: theme.subtitle,
      boardThemeId: theme.id,
      toneClass: theme.previewToneClass,
    })),
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
    buyItem: 'COMPRAR',
    equipItem: 'EQUIPAR',
    equippedItem: 'EQUIPADA',
    levelLabel: 'Nivel',
    prestigeLabel: 'Prestigio',
    starterSkin: 'INICIAL',
    premiumSkin: 'CATALOGO',
    tokenEquippedBadge: 'EQUIPADA',
    cosmeticsSynced: 'Cosmeticos sincronizados on-chain.',
    cosmeticsSyncing: 'Sincronizando cosmeticos...',
    cosmeticsLocalOnly: 'Cosmeticos guardados localmente. Falta sincronizacion on-chain.',
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
    buyItem: 'BUY',
    equipItem: 'EQUIP',
    equippedItem: 'EQUIPPED',
    levelLabel: 'Level',
    prestigeLabel: 'Prestige',
    starterSkin: 'STARTER',
    premiumSkin: 'CATALOG',
    tokenEquippedBadge: 'EQUIPPED',
    cosmeticsSynced: 'Cosmetics synced on-chain.',
    cosmeticsSyncing: 'Syncing cosmetics...',
    cosmeticsLocalOnly: 'Cosmetics saved locally. On-chain sync is still pending.',
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
  const { account } = useAccount()
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
  const setQuestionDifficulty = useAppSettingsStore((state) => state.setQuestionDifficulty)
  const language = useAppSettingsStore((state) => state.language)
  const ownedBoardThemeIds = useAppSettingsStore((state) => state.ownedBoardThemeIds)
  const ownedDiceSkinIds = useAppSettingsStore((state) => state.ownedDiceSkinIds)
  const ownedTokenSkinIds = useAppSettingsStore((state) => state.ownedTokenSkinIds)
  const selectedBoardThemeId = useAppSettingsStore((state) => state.selectedBoardThemeId)
  const selectedDiceSkinId = useAppSettingsStore((state) => state.selectedDiceSkinId)
  const selectedSkinId = useAppSettingsStore((state) => state.selectedSkinId)
  const selectedTokenSkinId = useAppSettingsStore((state) => state.selectedTokenSkinId)
  const setSelectedBoardThemeId = useAppSettingsStore((state) => state.setSelectedBoardThemeId)
  const setSelectedDiceSkinId = useAppSettingsStore((state) => state.setSelectedDiceSkinId)
  const setSelectedSkinId = useAppSettingsStore((state) => state.setSelectedSkinId)
  const setSelectedTokenSkinId = useAppSettingsStore((state) => state.setSelectedTokenSkinId)
  const unlockBoardTheme = useAppSettingsStore((state) => state.unlockBoardTheme)
  const unlockDiceSkin = useAppSettingsStore((state) => state.unlockDiceSkin)
  const unlockTokenSkin = useAppSettingsStore((state) => state.unlockTokenSkin)
  const { isConnected, username } = useControllerWallet()
  const playerProfile = usePlayerProfile()
  const ui = homeCopyByLanguage[language]
  const selectedSkinSrc = getPlayerSkinSrc(selectedSkinId)
  const selectedTokenTheme = getPlayerVisualTheme(selectedTokenSkinId)
  const ownedBoardThemeSet = new Set(ownedBoardThemeIds)
  const ownedDiceSkinSet = new Set(ownedDiceSkinIds)
  const ownedTokenSkinSet = new Set(ownedTokenSkinIds)
  const displayUsername = playerProfile.username || username || 'PARQUIZ_PLAYER_77'
  const levelLabel = `${ui.levelLabel} ${playerProfile.level}`
  const prestigeLabel = `${ui.prestigeLabel} ${playerProfile.prestige}`
  const shopItems = shopItemsByTab[activeShopTab]
  const coinBalance = playerProfile.coins
  const coinLabel = coinBalance.toLocaleString('en-US')
  const [cosmeticsSyncMessage, setCosmeticsSyncMessage] = useState<null | string>(null)
  const [cosmeticsSyncPending, setCosmeticsSyncPending] = useState(false)

  const syncCustomization = useCallback(
    async (nextSkinId: null | string, nextDiceSkinId: DiceSkinId, nextTokenSkinId: TokenSkinId) => {
      if (!isConnected || !account || !appEnv.customizationSystemAddress) {
        setCosmeticsSyncMessage(isConnected ? ui.cosmeticsLocalOnly : null)
        return
      }

      setCosmeticsSyncPending(true)
      setCosmeticsSyncMessage(ui.cosmeticsSyncing)

      try {
        const transactionHash = await setPlayerCustomization(
          account,
          playerSkinIndexFromId(nextSkinId),
          diceSkinIndexFromId(nextDiceSkinId),
          tokenSkinIndexFromId(nextTokenSkinId),
        )
        await account.waitForTransaction(transactionHash)
        setCosmeticsSyncMessage(ui.cosmeticsSynced)
      } catch {
        setCosmeticsSyncMessage(ui.cosmeticsLocalOnly)
      } finally {
        setCosmeticsSyncPending(false)
      }
    },
    [account, isConnected, ui.cosmeticsLocalOnly, ui.cosmeticsSynced, ui.cosmeticsSyncing],
  )

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
      className="relative isolate min-h-screen overflow-hidden px-4 pb-8 pt-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/home-background.jpg')",
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(34,18,9,0.2)_0%,rgba(24,12,7,0.28)_46%,rgba(17,9,6,0.42)_100%)]" />
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,241,210,0.3),transparent_56%),radial-gradient(circle_at_50%_108%,rgba(15,8,5,0.58),transparent_60%)]" />

      <div className="relative z-20 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <article className="w-full max-w-[470px] rounded-[26px] border border-[#784325] bg-gradient-to-b from-[#a86739] via-[#8f5832] to-[#754827] p-[3px] shadow-[0_10px_24px_rgba(60,31,10,0.36)]">
            <div className="rounded-[22px] border border-[#c99766]/60 bg-gradient-to-r from-[#6e3d2a] via-[#5e3426] to-[#4f2d22] px-3 py-2.5 text-[#ffe6bf]">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#ffefc4] bg-gradient-to-b ${selectedTokenTheme.avatarToneClass} text-lg font-black text-white shadow-[0_4px_10px_rgba(12,22,43,0.4)]`}
                >
                  <GameAvatar
                    alt="Avatar del jugador"
                    avatar={selectedSkinSrc || me?.avatar || 'PQ'}
                    imageClassName="h-full w-full object-contain p-1"
                    textClassName="text-lg font-black text-white"
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-2xl uppercase leading-none text-[#fff4d4]">
                    {displayUsername}
                  </p>

                  <div className="mt-1.5 rounded-full border border-[#b07f53] bg-[#3f2341] p-1">
                    <div className="h-3 rounded-full bg-gradient-to-r from-[#44d0ff] via-[#66c9ff] to-[#3d79ce]" style={{ width: `${levelProgress}%` }} />
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[13px] font-black uppercase tracking-wide text-[#ffe7a7]">
                    <span>{levelLabel}</span>
                    <span className="text-[#ffca75]">|</span>
                    <span>{prestigeLabel}</span>
                  </div>

                  {cosmeticsSyncMessage ? (
                    <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#d8edff]">
                      {cosmeticsSyncMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </article>

          <div className="flex flex-wrap items-start justify-end gap-2">
            <div className="rounded-full border border-[#7f4a25] bg-gradient-to-b from-[#784825] to-[#5b331c] px-5 py-1 text-[42px] font-black leading-none text-[#fff7dd] shadow-[0_6px_14px_rgba(54,28,12,0.36)]">
              {coinLabel} <span className="text-[#ffd34d]">●</span>
            </div>

            <button
              aria-label={ui.shop}
              className="inline-flex min-w-[132px] items-center justify-center rounded-[20px] border border-[#7f4a25] bg-gradient-to-b from-[#ffea95] via-[#f4c049] to-[#cb8621] px-5 py-2 text-[#5d320f] shadow-[inset_0_2px_0_rgba(255,244,181,0.85),0_8px_16px_rgba(83,45,12,0.35)]"
              onClick={openShopPanel}
              title={ui.shop}
              type="button"
            >
              <span className="sr-only">{ui.shop}</span>
              <svg aria-hidden="true" className="h-10 w-10 drop-shadow-[0_2px_0_rgba(93,50,15,0.35)]" fill="none" viewBox="0 0 48 48">
                <path d="M10 17.5h28l-3.6-7.5H13.6L10 17.5Z" fill="#FFF3B5" stroke="#734216" strokeLinejoin="round" strokeWidth="2.6" />
                <path d="M13 17h22v19a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V17Z" fill="#8B4F26" stroke="#734216" strokeLinejoin="round" strokeWidth="2.6" />
                <path d="M19 22h10v16H19z" fill="#FFE1A0" stroke="#734216" strokeLinejoin="round" strokeWidth="2.6" />
                <path d="M11 17h26" stroke="#734216" strokeLinecap="round" strokeWidth="2.6" />
                <path d="M15 10h4l1.8 7.5h-4L15 10Zm12 0h4l-1.8 7.5h-4L27 10Z" fill="#FF7E5F" stroke="#734216" strokeLinejoin="round" strokeWidth="2.6" />
                <circle cx="33.5" cy="32.5" r="5.5" fill="#FFD34D" stroke="#734216" strokeWidth="2.6" />
                <path d="M33.5 29.8v5.4M30.8 32.5h5.4" stroke="#734216" strokeLinecap="round" strokeWidth="2.2" />
              </svg>
            </button>

            <div className="flex flex-col items-center gap-1">
              <button
                className="rounded-full border border-[#8e5b32] bg-gradient-to-b from-[#f2f4f8] to-[#b8b9bd] p-4 text-3xl shadow-[inset_0_2px_0_rgba(255,255,255,0.85),0_8px_14px_rgba(42,37,30,0.35)] transition hover:-translate-y-0.5"
                onClick={openConfigPanel}
                title="Abrir configuracion"
                type="button"
              >
                ⚙
              </button>
              <span className="text-[12px] font-black uppercase tracking-wide text-white">{ui.settings}</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {medalIcons.map((medal) => (
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#ffe9bf] bg-gradient-to-b ${medal.tone} text-xl text-white shadow-[0_4px_10px_rgba(40,22,8,0.28)] sm:h-12 sm:w-12`}
                key={medal.icon}
              >
                {medal.icon}
              </span>
            ))}
          </div>

          <div className="mx-auto mt-1 w-fit rounded-[22px] border border-[#8d532d] bg-gradient-to-b from-[#b77844] via-[#915731] to-[#6d4327] px-6 py-2 shadow-[inset_0_2px_0_rgba(255,216,172,0.55),0_8px_16px_rgba(64,33,12,0.34)]">
            <img alt="ParQuiz" className="h-14 w-auto drop-shadow-[0_4px_10px_rgba(23,14,8,0.45)] sm:h-16" src="/parquiz-logo.png" />
          </div>

          <div className="mx-auto -mt-2 w-fit rounded-full border border-[#6f3f1f] bg-gradient-to-b from-[#8f5532] to-[#5d341d] px-8 py-1 text-center font-display text-2xl uppercase tracking-wide text-[#ffe8bd] shadow-[0_6px_14px_rgba(58,28,10,0.3)]">
            {ui.center}
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl rounded-[34px] border-[4px] border-[#744225] bg-gradient-to-b from-[#a86a3d] via-[#8d5936] to-[#6a4228] p-2.5 shadow-[inset_0_4px_0_rgba(255,212,156,0.5),0_14px_30px_rgba(57,28,9,0.36)] sm:p-4">
          <span className="pointer-events-none absolute inset-x-6 top-2 h-8 rounded-full bg-white/12 blur-sm" />

          <div className="grid gap-3 lg:grid-cols-3">
            <article className="rounded-[24px] border-2 border-[#7d4a2b] bg-gradient-to-b from-[#fff7ea] to-[#f3e8d6] shadow-[0_6px_14px_rgba(42,23,10,0.26)]">
              <header className="rounded-t-[22px] border-b border-[#9a5f40] bg-gradient-to-r from-[#8c46bc] via-[#a14fce] to-[#7c6ae1] px-4 py-3 text-center">
                <h3 className="font-display text-[25px] uppercase leading-none text-white drop-shadow-[0_2px_0_rgba(42,19,64,0.5)] sm:text-[34px]">
                  {ui.playOnline}
                </h3>
              </header>

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-center gap-3 text-4xl">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#7a4da3] bg-gradient-to-b from-[#f9d4ff] to-[#be82dd] shadow-inner">
                    🧑
                  </span>
                  <span className="font-display text-[30px] text-[#6d338f] sm:text-[42px]">VS</span>
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#347dbb] bg-gradient-to-b from-[#c7f4ff] to-[#7bd0f2] shadow-inner">
                    🌍
                  </span>
                </div>

                <p className="text-center text-[20px] font-black leading-tight text-[#302013] sm:text-[28px]">
                  {ui.onlineDescription}
                </p>

                <button
                  className="w-full rounded-full border border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] px-3 py-2 font-display text-[24px] uppercase tracking-wide text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_6px_0_rgba(38,95,22,0.9)] sm:text-[34px]"
                  onClick={onOnlinePlay}
                  type="button"
                >
                  {ui.playNow}
                </button>

                <div className="flex justify-center gap-1.5 pt-1 text-lg">
                  {panelIconRows[0].map((icon) => (
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#8e623a] bg-[#f9edcb]"
                      key={icon}
                    >
                      {icon}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-[24px] border-2 border-[#7d4a2b] bg-gradient-to-b from-[#fff7ea] to-[#f3e8d6] shadow-[0_6px_14px_rgba(42,23,10,0.26)]">
              <header className="rounded-t-[22px] border-b border-[#a36b44] bg-gradient-to-r from-[#e18d46] via-[#f0a354] to-[#d27a32] px-4 py-3 text-center">
                <h3 className="font-display text-[25px] uppercase leading-none text-white drop-shadow-[0_2px_0_rgba(76,39,11,0.5)] sm:text-[34px]">
                  {ui.friendsMode}
                </h3>
              </header>

              <div className="space-y-3 p-4">
                <div className="rounded-2xl border border-[#d09f71] bg-gradient-to-b from-[#fff2dc] to-[#f3debe] p-3">
                  <div className="flex items-center justify-center gap-2 text-[34px]">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#9c5f38] bg-gradient-to-b from-[#ffd2bf] to-[#ee936f] shadow-[0_4px_8px_rgba(18,18,18,0.2)]">
                      👩
                    </span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#9c5f38] bg-[#ffe7bf] text-xl">
                      🤝
                    </span>
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#9c5f38] bg-gradient-to-b from-[#d2e6ff] to-[#87b8ef] shadow-[0_4px_8px_rgba(18,18,18,0.2)]">
                      👨
                    </span>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#9c5f38] bg-gradient-to-b from-[#dafcc8] to-[#8ad16a] shadow-[0_4px_8px_rgba(18,18,18,0.2)]">
                      🌐
                    </span>
                  </div>
                </div>

                <p className="text-center text-[20px] font-black leading-tight text-[#302013] sm:text-[27px]">
                  {ui.friendsDescription}
                </p>

                <button
                  className="w-full rounded-full border border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] px-3 py-2 font-display text-[22px] uppercase tracking-wide text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_6px_0_rgba(38,95,22,0.9)] sm:text-[32px]"
                  onClick={onInviteJoin}
                  type="button"
                >
                  {me?.ready ? ui.ready : ui.inviteJoin}
                </button>

                <div className="flex justify-center gap-1.5 pt-1 text-lg">
                  {panelIconRows[1].map((icon) => (
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#8e623a] bg-[#f9edcb]"
                      key={icon}
                    >
                      {icon}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-[24px] border-2 border-[#7d4a2b] bg-gradient-to-b from-[#fff7ea] to-[#f3e8d6] shadow-[0_6px_14px_rgba(42,23,10,0.26)]">
              <header className="rounded-t-[22px] border-b border-[#2e5f9b] bg-gradient-to-r from-[#2f8cd6] via-[#3799e7] to-[#2f7ec4] px-4 py-3 text-center">
                <h3 className="font-display text-[25px] uppercase leading-none text-white drop-shadow-[0_2px_0_rgba(19,45,79,0.52)] sm:text-[34px]">
                  {ui.aiPractice}
                </h3>
              </header>

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-center gap-3 text-4xl">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#2f74aa] bg-gradient-to-b from-[#d3f2ff] to-[#75bbe3] shadow-inner">
                    🧑
                  </span>
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#2f74aa] bg-gradient-to-b from-[#e6ecff] to-[#97b7ff] shadow-inner">
                    🧠
                  </span>
                </div>

                <p className="text-center text-[20px] font-black leading-tight text-[#302013] sm:text-[27px]">
                  {ui.aiDescription}
                </p>

                <button
                  className="w-full rounded-full border border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] px-3 py-2 font-display text-[24px] uppercase tracking-wide text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_6px_0_rgba(38,95,22,0.9)] sm:text-[34px]"
                  onClick={onPracticeWithAi}
                  type="button"
                >
                  {ui.practiceNow}
                </button>

                <div className="rounded-full border border-[#c9a877] bg-[#f7e5cd] p-1">
                  <div className="grid grid-cols-3 gap-1">
                    {difficultyOptions.map((option) => {
                      const isActive = aiDifficulty === option.id

                      return (
                        <button
                          className={`rounded-full border px-2 py-1 text-center text-[13px] font-black uppercase tracking-wide transition-all sm:text-[15px] ${
                            isActive
                              ? 'border-[#b37a2b] bg-gradient-to-b from-[#ffe39d] to-[#efbc59] text-[#5f3817] shadow-[0_0_0_2px_rgba(243,186,78,0.3)]'
                              : 'border-[#d6b88c] bg-[#f7e9d3] text-[#8a6038] hover:brightness-95'
                          }`}
                          key={option.id}
                          onClick={() => {
                            setAiDifficulty(option.id)
                            setQuestionDifficulty(option.id)
                          }}
                          type="button"
                        >
                          {ui[option.labelKey]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-center gap-1.5 pt-1 text-lg">
                  {panelIconRows[2].map((icon) => (
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#8e623a] bg-[#f9edcb]"
                      key={icon}
                    >
                      {icon}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>

      </div>

      {isShopOpen ? (
        <div className="fixed inset-0 z-[142] flex items-center justify-center p-2 sm:p-5">
          <button
            aria-label={ui.closeShop}
            className="absolute inset-0 bg-[#150a03]/55 backdrop-blur-[2px]"
            onClick={closeShopPanel}
            type="button"
          />

          <div className="relative z-10 w-full max-w-[1050px]">
            <div className="relative rounded-[34px] border-[5px] border-[#7b4828] bg-gradient-to-b from-[#bc7c49] via-[#956036] to-[#6f4428] p-2 shadow-[0_24px_48px_rgba(32,16,7,0.56)] sm:p-3">
              <div className="absolute right-5 top-2 rounded-full border-2 border-[#8b5332] bg-gradient-to-b from-[#7b4b2f] to-[#58331f] px-4 py-1.5 text-[26px] font-black tracking-wide text-[#fff2d4] shadow-[inset_0_1px_0_rgba(255,228,178,0.38)]">
                <span className="mr-2 text-[#ffd24e]">🪙</span>
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
                        const isOwnedBoardTheme = Boolean(item.boardThemeId && ownedBoardThemeSet.has(item.boardThemeId))
                        const isEquippedBoardTheme = Boolean(item.boardThemeId && item.boardThemeId === selectedBoardThemeId)
                        const isEquippedSkin = item.isSkinItem && item.id === selectedSkinId
                        const isOwnedDice = Boolean(item.diceSkinId && ownedDiceSkinSet.has(item.diceSkinId))
                        const isEquippedDice = Boolean(item.diceSkinId && item.diceSkinId === selectedDiceSkinId)
                        const isOwnedToken = Boolean(item.tokenSkinId && ownedTokenSkinSet.has(item.tokenSkinId))
                        const isEquippedToken = Boolean(item.tokenSkinId && item.tokenSkinId === selectedTokenSkinId)
                        const isEquippedItem = isEquippedBoardTheme || isEquippedSkin || isEquippedDice || isEquippedToken

                        const handleItemAction = () => {
                          if (item.boardThemeId) {
                            if (!isOwnedBoardTheme) {
                              unlockBoardTheme(item.boardThemeId)
                            }

                            setSelectedBoardThemeId(item.boardThemeId)
                            return
                          }

                          if (item.isSkinItem) {
                            setSelectedSkinId(item.id)
                            void syncCustomization(item.id, selectedDiceSkinId, selectedTokenSkinId)
                            return
                          }

                          if (item.diceSkinId) {
                            if (!isOwnedDice) {
                              unlockDiceSkin(item.diceSkinId)
                            }

                            setSelectedDiceSkinId(item.diceSkinId)
                            void syncCustomization(selectedSkinId, item.diceSkinId, selectedTokenSkinId)
                            return
                          }

                          if (!item.tokenSkinId) {
                            return
                          }

                          if (!isOwnedToken) {
                            unlockTokenSkin(item.tokenSkinId)
                          }

                          setSelectedTokenSkinId(item.tokenSkinId)
                          void syncCustomization(selectedSkinId, selectedDiceSkinId, item.tokenSkinId)
                        }

                        const actionLabel = item.isSkinItem
                          ? isEquippedSkin
                            ? ui.equippedItem
                            : ui.equipItem
                          : item.boardThemeId
                            ? !isOwnedBoardTheme
                              ? ui.buyItem
                              : isEquippedBoardTheme
                                ? ui.equippedItem
                                : ui.equipItem
                          : item.diceSkinId
                            ? !isOwnedDice
                              ? ui.buyItem
                              : isEquippedDice
                                ? ui.equippedItem
                                : ui.equipItem
                          : !item.tokenSkinId
                            ? null
                            : !isOwnedToken
                              ? ui.buyItem
                              : isEquippedToken
                                ? ui.equippedItem
                                : ui.equipItem

                        return (
                      <article
                        className={`rounded-[20px] border-2 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] ${
                          isEquippedItem
                            ? 'border-[#e0b54f] bg-gradient-to-b from-[#fff7d6] to-[#f2dda5] shadow-[0_0_0_3px_rgba(247,202,88,0.28)]'
                            : 'border-[#d7b889] bg-gradient-to-b from-[#fff8e8] to-[#f3dfba]'
                        }`}
                        key={item.id}
                      >
                        <div className={`relative flex h-28 items-center justify-center rounded-[16px] bg-gradient-to-b ${item.toneClass} text-[70px] sm:text-[76px]`}>
                          {item.mediaSrc ? (
                            <GameAvatar alt={item.name || item.id} avatar={item.mediaSrc} imageClassName="h-full w-full object-contain p-2" />
                          ) : item.boardThemeId ? (
                            <div className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-[16px] bg-gradient-to-b ${item.toneClass}`}>
                              {item.previewImageSrc ? (
                                <img
                                  alt={item.name || item.id}
                                  className="absolute inset-0 h-full w-full object-cover"
                                  src={item.previewImageSrc}
                                />
                              ) : null}
                              <div className="absolute inset-0 bg-white/10" />
                              <div className="absolute inset-[8%] rounded-[18px] border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]" />
                            </div>
                          ) : item.diceSkinId ? (
                            <GameDie className="h-20 w-20 sm:h-24 sm:w-24" skinId={item.diceSkinId} value={5} />
                          ) : item.tokenSkinId ? (
                            <TokenChip className="h-20 w-20 border-[4px] sm:h-24 sm:w-24" skinId={item.tokenSkinId} variant="shop" />
                          ) : (
                            item.icon
                          )}

                          {isEquippedBoardTheme || isEquippedDice || isEquippedToken ? (
                            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-[#2f7a20] bg-gradient-to-b from-[#7ce05f] to-[#3fa326] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-[0_0_16px_rgba(88,181,56,0.4)]">
                              <span>✓</span>
                              {ui.equippedItem}
                            </span>
                          ) : null}
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
                              ) : item.isBoardThemeItem && item.rarityLabel ? (
                                <span className="rounded-full border border-[#b98236] bg-gradient-to-b from-[#ffe28f] to-[#f3b949] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#5f3817]">
                                  {item.rarityLabel}
                                </span>
                              ) : item.isDiceItem && item.rarityLabel ? (
                                <span className="rounded-full border border-[#b98236] bg-gradient-to-b from-[#ffe28f] to-[#f3b949] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#5f3817]">
                                  {item.rarityLabel}
                                </span>
                              ) : item.isTokenItem && item.rarityLabel ? (
                                <span className="rounded-full border border-[#b98236] bg-gradient-to-b from-[#ffe28f] to-[#f3b949] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#5f3817]">
                                  {item.rarityLabel}
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
                          <span className="mr-1 text-[#f6be2f]">🪙</span>
                          {item.price}
                        </div>
                        {actionLabel ? (
                          <button
                            className={`mt-2 w-full rounded-full border px-3 py-1.5 font-display text-lg uppercase tracking-wide transition ${
                              isEquippedItem
                                ? 'border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] text-white shadow-[inset_0_2px_0_rgba(210,255,195,0.8),0_4px_0_rgba(38,95,22,0.85)]'
                                : 'border-[#8f562f] bg-gradient-to-b from-[#a46539] to-[#7a4727] text-[#f7ddad] shadow-[inset_0_1px_0_rgba(255,225,189,0.45),0_4px_0_rgba(102,58,29,0.88)] hover:brightness-105'
                            }`}
                            disabled={cosmeticsSyncPending}
                            onClick={handleItemAction}
                            type="button"
                          >
                            {actionLabel}
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
