import type { ReactNode } from 'react'
import { mainnet, sepolia, type Chain } from '@starknet-react/chains'
import { StarknetConfig, cartridge, jsonRpcProvider } from '@starknet-react/core'
import { appEnv, KATANA_CHAIN_ID } from '../config/env'
import { controllerConnector } from '../lib/starknet/controller-connector'

const katanaChain: Chain = {
  id: BigInt(KATANA_CHAIN_ID),
  network: 'katana',
  name: 'Katana Local',
  testnet: true,
  nativeCurrency: {
    address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [appEnv.katanaRpcUrl] },
    public: { http: [appEnv.katanaRpcUrl] },
  },
  paymasterRpcUrls: {
    avnu: { http: [appEnv.katanaRpcUrl] },
  },
}

const supportedChains = appEnv.defaultNetwork === 'katana' ? [katanaChain, mainnet] : [mainnet, sepolia]

const provider = jsonRpcProvider({
  rpc: (chain: Chain) => {
    if (chain.id === mainnet.id) {
      return { nodeUrl: appEnv.mainnetRpcUrl }
    }

    if (appEnv.defaultNetwork === 'katana' && chain.id === katanaChain.id) {
      return { nodeUrl: appEnv.katanaRpcUrl }
    }

    return { nodeUrl: appEnv.sepoliaRpcUrl }
  },
})

const defaultChainId =
  appEnv.defaultNetwork === 'mainnet'
    ? mainnet.id
    : appEnv.defaultNetwork === 'katana'
      ? katanaChain.id
      : sepolia.id

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <StarknetConfig
      autoConnect
      chains={supportedChains}
      defaultChainId={defaultChainId}
      provider={provider}
      connectors={[controllerConnector]}
      explorer={cartridge}
    >
      {children}
    </StarknetConfig>
  )
}
