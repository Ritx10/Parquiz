import type { SessionPolicies } from '@cartridge/presets'
import { appEnv } from '../../config/env'

const configEntrypoints = [
  {
    label: 'Create Game Config',
    entrypoint: 'create_game_config',
    description: 'Creates a reusable ParQuiz rules preset',
  },
  {
    label: 'Update Game Config',
    entrypoint: 'update_game_config',
    description: 'Updates a draft game preset before locking it',
  },
  {
    label: 'Lock Game Config',
    entrypoint: 'lock_game_config',
    description: 'Locks a preset to keep in-game rules immutable',
  },
  {
    label: 'Disable Game Config',
    entrypoint: 'disable_game_config',
    description: 'Disables a preset from new lobbies',
  },
  {
    label: 'Set Board Square',
    entrypoint: 'set_board_square',
    description: 'Updates board safe-space metadata per config',
  },
] as const

const lobbyEntrypoints = [
  {
    label: 'Create Lobby',
    entrypoint: 'create_lobby',
    description: 'Creates a new lobby linked to a config id',
  },
  {
    label: 'Join Lobby',
    entrypoint: 'join_lobby_by_code',
    description: 'Joins a lobby using a generated code hash',
  },
  {
    label: 'Join Public Matchmaking',
    entrypoint: 'join_public_matchmaking',
    description: 'Joins or creates the shared public waiting lobby for a config',
  },
  {
    label: 'Set Ready',
    entrypoint: 'set_ready',
    description: 'Updates player readiness in lobby state',
  },
  {
    label: 'Start Game',
    entrypoint: 'start_game',
    description: 'Starts the game when the lobby is ready',
  },
  {
    label: 'Leave Lobby',
    entrypoint: 'leave_lobby',
    description: 'Leaves an existing lobby before game start',
  },
] as const

const turnEntrypoints = [
  {
    label: 'Roll + Question',
    entrypoint: 'roll_two_dice_and_draw_question',
    description: 'Starts turn flow with VRF dice and random question',
  },
  {
    label: 'Submit Answer',
    entrypoint: 'submit_answer',
    description: 'Submits answer proof before movement phase',
  },
  {
    label: 'Apply Move',
    entrypoint: 'apply_move',
    description: 'Applies one validated move resource on-chain',
  },
  {
    label: 'End Turn',
    entrypoint: 'end_turn',
    description: 'Ends movement phase and advances to next player',
  },
  {
    label: 'Submit Answer + Moves',
    entrypoint: 'submit_answer_and_moves',
    description: 'Sends answer proof and move plan in one action',
  },
  {
    label: 'Force Skip Turn',
    entrypoint: 'force_skip_turn',
    description: 'Skips stalled turns after the on-chain deadline',
  },
] as const

const customizationEntrypoints = [
  {
    label: 'Set Player Customization',
    entrypoint: 'set_player_customization',
    description: 'Updates the player cosmetic profile used across lobbies and matches',
  },
  {
    label: 'Set Player Loadout',
    entrypoint: 'set_player_loadout',
    description: 'Updates the authoritative equipped avatar, dice, token, and board theme',
  },
] as const

const profileEntrypoints = [
  {
    label: 'Ensure Player Profile',
    entrypoint: 'ensure_player_profile',
    description: 'Initializes the on-chain player profile and starter inventory when missing',
  },
  {
    label: 'Purchase Cosmetic',
    entrypoint: 'purchase_cosmetic',
    description: 'Purchases an on-chain cosmetic from the catalog using persistent coins',
  },
] as const

const vrfEntrypoints = [
  {
    label: 'Request Random',
    entrypoint: 'request_random',
    description: 'Requests Cartridge VRF randomness for roll flow',
  },
] as const

const adminEntrypoints = [
  {
    label: 'Set Global Defaults',
    entrypoint: 'set_global_defaults',
    description: 'Updates global guardrails for new game configs',
  },
  {
    label: 'Set Question Set',
    entrypoint: 'set_question_set',
    description: 'Registers or updates an on-chain question set root',
  },
  {
    label: 'Set VRF Provider',
    entrypoint: 'set_vrf_provider',
    description: 'Updates the VRF provider address used by turn flow',
  },
] as const

const egsEntrypoints = [
  {
    label: 'Bind EGS Token',
    entrypoint: 'bind_egs_token',
    description: 'Links a playable tournament token to one on-chain ParQuiz match',
  },
  {
    label: 'Publish EGS Settings',
    entrypoint: 'publish_egs_settings',
    description: 'Publishes a locked config as EGS settings from the registered adapter',
  },
] as const

const asMethods = <T extends ReadonlyArray<{ label: string; entrypoint: string; description: string }>>(
  entrypoints: T,
) =>
  entrypoints.map((entrypoint) => ({
    name: entrypoint.label,
    description: entrypoint.description,
    entrypoint: entrypoint.entrypoint,
  }))

const contracts: NonNullable<SessionPolicies['contracts']> = {}

if (appEnv.configSystemAddress) {
  contracts[appEnv.configSystemAddress] = {
    description: 'ParQuiz config system permissions',
    methods: asMethods(configEntrypoints),
  }
}

if (appEnv.lobbySystemAddress) {
  contracts[appEnv.lobbySystemAddress] = {
    description: 'ParQuiz lobby system permissions',
    methods: asMethods(lobbyEntrypoints),
  }
}

if (appEnv.turnSystemAddress) {
  contracts[appEnv.turnSystemAddress] = {
    description: 'ParQuiz turn system permissions',
    methods: asMethods(turnEntrypoints),
  }
}

if (appEnv.customizationSystemAddress) {
  contracts[appEnv.customizationSystemAddress] = {
    description: 'ParQuiz customization system permissions',
    methods: asMethods(customizationEntrypoints),
  }
}

if (appEnv.profileSystemAddress) {
  contracts[appEnv.profileSystemAddress] = {
    description: 'ParQuiz profile system permissions',
    methods: asMethods(profileEntrypoints),
  }
}

if (appEnv.vrfProviderAddress) {
  contracts[appEnv.vrfProviderAddress] = {
    description: 'Cartridge VRF provider permissions',
    methods: asMethods(vrfEntrypoints),
  }
}

if (appEnv.adminSystemAddress) {
  contracts[appEnv.adminSystemAddress] = {
    description: 'ParQuiz admin system permissions',
    methods: asMethods(adminEntrypoints),
  }
}

if (appEnv.egsSystemAddress) {
  contracts[appEnv.egsSystemAddress] = {
    description: 'ParQuiz EGS token binding permissions',
    methods: asMethods(egsEntrypoints),
  }
}

export const sessionPolicies: SessionPolicies =
  Object.keys(contracts).length > 0
    ? {
        contracts,
      }
    : {}
