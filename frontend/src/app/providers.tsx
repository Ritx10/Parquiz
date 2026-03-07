import type { ReactNode } from 'react'
import { devnet, mainnet, sepolia, type Chain } from '@starknet-react/chains'
import { StarknetConfig, cartridge, jsonRpcProvider } from '@starknet-react/core'
import { appEnv } from '../config/env'
import { controllerConnector } from '../lib/starknet/controller-connector'

const supportedChains = appEnv.defaultNetwork === 'katana' ? [devnet, sepolia, mainnet] : [mainnet, sepolia]

const provider = jsonRpcProvider({
  rpc: (chain: Chain) => {
    if (chain.id === mainnet.id) {
      return { nodeUrl: appEnv.mainnetRpcUrl }
    }

    if (appEnv.defaultNetwork === 'katana' && chain.id === devnet.id) {
      return { nodeUrl: appEnv.katanaRpcUrl }
    }

    return { nodeUrl: appEnv.sepoliaRpcUrl }
  },
})

const defaultChainId =
  appEnv.defaultNetwork === 'mainnet'
    ? mainnet.id
    : appEnv.defaultNetwork === 'katana'
      ? devnet.id
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
