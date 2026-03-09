interface ImportMetaEnv {
  readonly VITE_PARQUIZ_NAMESPACE?: string
  readonly VITE_PARCHIS_NAMESPACE?: string
  readonly VITE_STARKNET_NETWORK?: 'mainnet' | 'sepolia' | 'katana'
  readonly VITE_USE_LIVE_RPC?: string
  readonly VITE_STARKNET_MAINNET_RPC_URL?: string
  readonly VITE_STARKNET_SEPOLIA_RPC_URL?: string
  readonly VITE_STARKNET_KATANA_RPC_URL?: string
  readonly VITE_DOJO_WORLD_ADDRESS?: string
  readonly VITE_CONFIG_SYSTEM_ADDRESS?: string
  readonly VITE_LOBBY_SYSTEM_ADDRESS?: string
  readonly VITE_TURN_SYSTEM_ADDRESS?: string
  readonly VITE_CUSTOMIZATION_SYSTEM_ADDRESS?: string
  readonly VITE_PROFILE_SYSTEM_ADDRESS?: string
  readonly VITE_ADMIN_SYSTEM_ADDRESS?: string
  readonly VITE_EGS_SYSTEM_ADDRESS?: string
  readonly VITE_VRF_PROVIDER_ADDRESS?: string
  readonly VITE_DOJO_TORII_URL?: string
  readonly VITE_DOJO_RELAY_URL?: string
  readonly VITE_DOJO_MANIFEST_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
