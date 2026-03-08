import { lookupAddresses } from '@cartridge/controller'
import { useEffect, useMemo, useState } from 'react'

const normalizeAddress = (value: null | string | undefined) => {
  if (!value) {
    return '0x0'
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return '0x0'
  }

  try {
    return `0x${BigInt(trimmed).toString(16)}`
  } catch {
    return trimmed.toLowerCase()
  }
}

type UseControllerUsernamesParams = {
  addresses: string[]
  selfAddress?: string
  selfUsername?: string
}

export function useControllerUsernames({
  addresses,
  selfAddress,
  selfUsername,
}: UseControllerUsernamesParams) {
  const [resolvedUsernames, setResolvedUsernames] = useState<Record<string, string>>({})

  const normalizedAddresses = useMemo(() => {
    return Array.from(
      new Set(addresses.map((address) => normalizeAddress(address)).filter((address) => address !== '0x0')),
    ).sort()
  }, [addresses])

  const normalizedAddressesKey = normalizedAddresses.join('|')

  useEffect(() => {
    let cancelled = false

    const loadUsernames = async () => {
      if (normalizedAddresses.length === 0) {
        return
      }

      try {
        const lookup = await lookupAddresses(normalizedAddresses)

        if (cancelled) {
          return
        }

        const nextEntries = Array.from(lookup.entries()).map(([address, username]) => [normalizeAddress(address), username] as const)

        setResolvedUsernames((current) => {
          let changed = false
          const nextState = { ...current }

          for (const [address, username] of nextEntries) {
            if (nextState[address] !== username) {
              nextState[address] = username
              changed = true
            }
          }

          return changed ? nextState : current
        })
      } catch {
        // keep previously resolved usernames and fallback to address rendering
      }
    }

    void loadUsernames()

    return () => {
      cancelled = true
    }
  }, [normalizedAddressesKey])

  return useMemo(() => {
    const usernamesByAddress = { ...resolvedUsernames }

    if (selfAddress && selfUsername) {
      usernamesByAddress[normalizeAddress(selfAddress)] = selfUsername
    }

    return {
      getUsername: (address: string) => usernamesByAddress[normalizeAddress(address)],
      usernamesByAddress,
    }
  }, [resolvedUsernames, selfAddress, selfUsername])
}
