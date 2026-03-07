import { ControllerConnector } from '@cartridge/connector'
import { appEnv } from '../../config/env'
import { sessionPolicies } from './session-policies'

const connectorChains =
  appEnv.defaultNetwork === 'mainnet'
    ? [{ rpcUrl: appEnv.mainnetRpcUrl }]
    : appEnv.defaultNetwork === 'katana'
      ? [{ rpcUrl: appEnv.katanaRpcUrl }]
      : [{ rpcUrl: appEnv.sepoliaRpcUrl }]

export const controllerConnector = new ControllerConnector({
  chains: connectorChains,
  defaultChainId: appEnv.controllerDefaultChainId,
  rpcUrl: appEnv.activeRpcUrl,
  policies: sessionPolicies,
  lazyload: true,
  propagateSessionErrors: true,
  signupOptions: ['webauthn', 'google', 'discord'],
})
