import { constants } from 'starknet'

export type StarknetNetwork = 'mainnet' | 'sepolia' | 'katana'

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
const katanaRpcUrl =
  import.meta.env.VITE_STARKNET_KATANA_RPC_URL || defaultRpcUrls.katana

const activeRpcUrlMap: Record<StarknetNetwork, string> = {
  mainnet: mainnetRpcUrl,
  sepolia: sepoliaRpcUrl,
  katana: katanaRpcUrl,
}

export const appEnv = {
  appName: 'Parchis Trivia',
  namespace: import.meta.env.VITE_PARCHIS_NAMESPACE || 'parchis_trivia',
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
  shopSystemAddress: parseAddress(import.meta.env.VITE_SHOP_SYSTEM_ADDRESS),
  adminSystemAddress: parseAddress(import.meta.env.VITE_ADMIN_SYSTEM_ADDRESS),
  egsSystemAddress: parseAddress(import.meta.env.VITE_EGS_SYSTEM_ADDRESS),
  egsTokenDataSystemAddress: parseAddress(import.meta.env.VITE_EGS_TOKEN_DATA_SYSTEM_ADDRESS),
  vrfProviderAddress:
    parseAddress(import.meta.env.VITE_VRF_PROVIDER_ADDRESS) ||
    '0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f',
  dojoToriiUrl: import.meta.env.VITE_DOJO_TORII_URL || 'http://127.0.0.1:8080',
  dojoRelayUrl: import.meta.env.VITE_DOJO_RELAY_URL || '/ip4/127.0.0.1/tcp/9090',
  dojoManifestPath:
    import.meta.env.VITE_DOJO_MANIFEST_PATH || '../manifest_dev.json',
  controllerDefaultChainId:
    defaultNetwork === 'mainnet'
      ? constants.StarknetChainId.SN_MAIN
      : constants.StarknetChainId.SN_SEPOLIA,
} as const
