import { constants } from 'starknet'

export type StarknetNetwork = 'mainnet' | 'sepolia' | 'katana'

export const KATANA_CHAIN_ID = '0x4b4154414e41' as constants.StarknetChainId

const isBrowser = typeof window !== 'undefined'

const isInsecureLocalUrl = (value: string) => /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/.*)?$/i.test(value)

const normalizeUrl = (value: string) => value.replace(/\/$/, '')

const resolveLocalProxyUrl = (value: string, proxyPath: string) => {
  if (!isBrowser) {
    return value
  }

  if (!isInsecureLocalUrl(value)) {
    return normalizeUrl(value)
  }

  if (window.location.protocol !== 'https:') {
    return normalizeUrl(value)
  }

  return `${window.location.origin}${proxyPath}`
}

const defaultRpcUrls: Record<StarknetNetwork, string> = {
  mainnet: 'https://api.cartridge.gg/x/starknet/mainnet',
  sepolia: 'https://api.cartridge.gg/x/starknet/sepolia',
  katana: 'http://127.0.0.1:5050',
}

const normalizeNetwork = (value: string | undefined): StarknetNetwork => {
  const normalized = value?.toLowerCase()

  if (normalized === 'mainnet' || normalized === 'katana') {
    return normalized
  }

  return 'sepolia'
}

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) {
    return fallback
  }

  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

const parseAddress = (value: string | undefined): string => (value || '').trim()

const defaultNetwork = normalizeNetwork(import.meta.env.VITE_STARKNET_NETWORK)

const mainnetRpcUrl =
  import.meta.env.VITE_STARKNET_MAINNET_RPC_URL || defaultRpcUrls.mainnet
const sepoliaRpcUrl =
  import.meta.env.VITE_STARKNET_SEPOLIA_RPC_URL || defaultRpcUrls.sepolia
const katanaRpcUrl = resolveLocalProxyUrl(
  import.meta.env.VITE_STARKNET_KATANA_RPC_URL || defaultRpcUrls.katana,
  '/rpc',
)

const activeRpcUrlMap: Record<StarknetNetwork, string> = {
  mainnet: mainnetRpcUrl,
  sepolia: sepoliaRpcUrl,
  katana: katanaRpcUrl,
}

export const appEnv = {
  appName: 'ParQuiz',
  namespace:
    import.meta.env.VITE_PARQUIZ_NAMESPACE ||
    import.meta.env.VITE_PARCHIS_NAMESPACE ||
    'parquiz',
  defaultNetwork,
  liveRpcEnabled: parseBoolean(import.meta.env.VITE_USE_LIVE_RPC),
  mainnetRpcUrl,
  sepoliaRpcUrl,
  katanaRpcUrl,
  activeRpcUrl: activeRpcUrlMap[defaultNetwork],
  dojoWorldAddress: (import.meta.env.VITE_DOJO_WORLD_ADDRESS || '').trim(),
  configSystemAddress: parseAddress(import.meta.env.VITE_CONFIG_SYSTEM_ADDRESS),
  lobbySystemAddress: parseAddress(import.meta.env.VITE_LOBBY_SYSTEM_ADDRESS),
  turnSystemAddress: parseAddress(import.meta.env.VITE_TURN_SYSTEM_ADDRESS),
  customizationSystemAddress: parseAddress(import.meta.env.VITE_CUSTOMIZATION_SYSTEM_ADDRESS),
  profileSystemAddress: parseAddress(import.meta.env.VITE_PROFILE_SYSTEM_ADDRESS),
  adminSystemAddress: parseAddress(import.meta.env.VITE_ADMIN_SYSTEM_ADDRESS),
  egsSystemAddress: parseAddress(import.meta.env.VITE_EGS_SYSTEM_ADDRESS),
  vrfProviderAddress:
    parseAddress(import.meta.env.VITE_VRF_PROVIDER_ADDRESS) ||
    '0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f',
  dojoToriiUrl: resolveLocalProxyUrl(
    import.meta.env.VITE_DOJO_TORII_URL || 'http://127.0.0.1:8080',
    '/torii',
  ),
  dojoRelayUrl: import.meta.env.VITE_DOJO_RELAY_URL || '/ip4/127.0.0.1/tcp/9090',
  controllerDefaultChainId:
    defaultNetwork === 'mainnet'
      ? constants.StarknetChainId.SN_MAIN
      : defaultNetwork === 'katana'
        ? KATANA_CHAIN_ID
        : constants.StarknetChainId.SN_SEPOLIA,
} as const
