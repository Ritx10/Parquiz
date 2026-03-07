import { appEnv } from './env'

export type DojoRuntimeConfig = {
  worldAddress: string
  toriiUrl: string
  relayUrl: string
  manifestPath: string
  namespace: string
}

export const dojoRuntimeConfig: DojoRuntimeConfig = {
  worldAddress: appEnv.dojoWorldAddress,
  toriiUrl: appEnv.dojoToriiUrl,
  relayUrl: appEnv.dojoRelayUrl,
  manifestPath: appEnv.dojoManifestPath,
  namespace: appEnv.namespace,
}

export const isDojoConfigured =
  dojoRuntimeConfig.worldAddress.length > 0 &&
  dojoRuntimeConfig.toriiUrl.length > 0 &&
  dojoRuntimeConfig.manifestPath.length > 0
