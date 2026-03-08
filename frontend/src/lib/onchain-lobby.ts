import { hash } from 'starknet'
import { readLatestGameIdByPlayer, readLobbyCodeIndex, readPublicLobbyIndex } from '../api'

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export const parseBigNumberish = (value: string): bigint | null => {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  if (!/^0x[0-9a-f]+$/i.test(normalized) && !/^\d+$/.test(normalized)) {
    return null
  }

  try {
    return BigInt(normalized)
  } catch {
    return null
  }
}

export const normalizeAddressForCompare = (value: null | string | undefined) => {
  if (!value) {
    return '0x0'
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return '0x0'
  }

  if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
    try {
      return `0x${BigInt(trimmed).toString(16)}`
    } catch {
      return trimmed.toLowerCase()
    }
  }

  if (/^\d+$/.test(trimmed)) {
    return `0x${BigInt(trimmed).toString(16)}`
  }

  return trimmed.toLowerCase()
}

export const hashLobbyCode = (value: string) => {
  const normalized = value.trim().toUpperCase()

  if (!normalized) {
    return null
  }

  return hash.starknetKeccak(normalized)
}

export const mapStarknetErrorToMessage = (error: unknown) => {
  const raw = error instanceof Error ? error.message : `${error}`
  const normalized = raw.toLowerCase()

  if (normalized.includes('user rejected') || normalized.includes('rejected')) {
    return 'Transaccion cancelada en wallet.'
  }

  if (normalized.includes('config_missing')) {
    return 'Selecciona una configuracion valida antes de continuar.'
  }

  if (normalized.includes('not_waiting')) {
    return 'La sala ya no esta esperando jugadores.'
  }

  if (normalized.includes('already_joined')) {
    return 'Ya formas parte de esta sala.'
  }

  if (normalized.includes('lobby_missing') || normalized.includes('code_missing')) {
    return 'No se encontro una sala activa con ese codigo.'
  }

  if (normalized.includes('full')) {
    return 'La sala ya esta llena.'
  }

  if (normalized.includes('not_host')) {
    return 'Solo el host puede iniciar la partida.'
  }

  if (normalized.includes('min_players')) {
    return 'Todavia faltan jugadores para iniciar.'
  }

  if (normalized.includes('not_locked')) {
    return 'La configuracion debe estar bloqueada antes de crear la partida.'
  }

  return raw
}

export const waitForPublicLobbyGameId = async (configId: bigint, playerAddress?: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const publicLobby = await readPublicLobbyIndex(configId)
      if (publicLobby?.game_id && publicLobby.game_id > 0n) {
        return publicLobby.game_id
      }

      if (playerAddress) {
        const latestByPlayer = await readLatestGameIdByPlayer(playerAddress)
        if (latestByPlayer && latestByPlayer > 0n) {
          return latestByPlayer
        }
      }
    } catch {
      // wait for Torii/network recovery and retry
    }

    await sleep(1500)
  }

  return null
}

export const waitForPrivateLobbyGameId = async (codeHash: bigint, playerAddress?: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const privateLobby = await readLobbyCodeIndex(codeHash)
      if (privateLobby?.game_id && privateLobby.game_id > 0n) {
        return privateLobby.game_id
      }

      if (playerAddress) {
        const latestByPlayer = await readLatestGameIdByPlayer(playerAddress)
        if (latestByPlayer && latestByPlayer > 0n) {
          return latestByPlayer
        }
      }
    } catch {
      // wait for Torii/network recovery and retry
    }

    await sleep(1500)
  }

  return null
}
