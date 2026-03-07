import { ControllerConnector } from '@cartridge/connector'
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core'
import { useEffect, useMemo, useState } from 'react'

export const shortenAddress = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`

export const formatChain = (chainId?: bigint) => {
  if (!chainId) {
    return 'Sin red'
  }

  return `0x${chainId.toString(16)}`
}

export function useControllerWallet() {
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { address, chainId, isConnected, status } = useAccount()
  const [usernamesByAddress, setUsernamesByAddress] = useState<Record<string, string>>({})

  const controller = useMemo(() => {
    try {
      return ControllerConnector.fromConnectors(connectors)
    } catch {
      return undefined
    }
  }, [connectors])

  const username = address ? usernamesByAddress[address] : undefined

  useEffect(() => {
    let cancelled = false

    if (!address || !controller) {
      return () => {
        cancelled = true
      }
    }

    const usernamePromise = controller.username()

    if (!usernamePromise) {
      return () => {
        cancelled = true
      }
    }

    usernamePromise
      .then((nextUsername) => {
        if (!cancelled) {
          setUsernamesByAddress((current) => ({
            ...current,
            [address]: nextUsername,
          }))
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [address, controller])

  return {
    address,
    chainId,
    isConnected,
    status,
    isPending,
    username,
    canConnectController: Boolean(controller),
    connectController: () => {
      if (controller) {
        connect({ connector: controller })
      }
    },
    disconnectController: () => disconnect(),
  }
}
