import { existsSync, readdirSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { boardThemeCatalog } from '../src/lib/board-themes'
import { diceSkinCatalog } from '../src/lib/dice-cosmetics'
import { tokenSkinShopCatalog } from '../src/lib/token-cosmetics'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const engineDir = resolve(scriptDir, '../../engine')
const profile = process.argv[2]?.trim() || 'dev'

const supportedSkinExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif'])

const optionalFlag = (args: string[], flag: string, value: string | undefined) => {
  const normalized = value?.trim()
  if (normalized) {
    args.push(flag, normalized)
  }
}

const commonArgs = () => {
  const args = ['--profile', profile]
  optionalFlag(args, '--world', process.env.DOJO_WORLD_ADDRESS)
  optionalFlag(args, '--rpc-url', process.env.STARKNET_RPC_URL)
  optionalFlag(args, '--account-address', process.env.DOJO_ACCOUNT_ADDRESS)
  optionalFlag(args, '--private-key', process.env.DOJO_PRIVATE_KEY)
  optionalFlag(args, '--keystore', process.env.DOJO_KEYSTORE_PATH)

  if (process.env.DOJO_KEYSTORE_PASSWORD !== undefined) {
    args.push('--password', process.env.DOJO_KEYSTORE_PASSWORD)
  }

  return args
}

const executeSozo = (args: string[], label: string) => {
  console.log(`\n${label}`)
  const result = Bun.spawnSync({
    cmd: ['sozo', ...args],
    cwd: engineDir,
    stdout: 'inherit',
    stderr: 'inherit',
    env: process.env,
  })

  if (result.exitCode !== 0) {
    throw new Error(`${label} failed with exit code ${result.exitCode}`)
  }
}

const listSkinFiles = (folder: string) => {
  if (!existsSync(folder)) {
    throw new Error(`Missing skin folder: ${folder}`)
  }

  return readdirSync(folder)
    .filter((fileName) => supportedSkinExtensions.has(extname(fileName).toLowerCase()))
    .sort((left, right) => left.localeCompare(right, 'en'))
}

const buildAvatarDefinitions = () => {
  const freeDir = resolve(scriptDir, '../src/assets/player-skins/free')
  const premiumDir = resolve(scriptDir, '../src/assets/player-skins/premium')
  const rewardDir = resolve(scriptDir, '../src/assets/player-skins/reward')

  const freeFiles = listSkinFiles(freeDir)
  const premiumFiles = listSkinFiles(premiumDir).filter((fileName) => !fileName.startsWith('pasted-graphic-9.'))
  const rewardFiles = listSkinFiles(rewardDir)

  const definitions: Array<{ enabled: boolean; itemId: number; kind: number; priceCoins: number; purchasable: boolean; requiredLevel: number }> = []

  freeFiles.forEach((_, index) => {
    definitions.push({
      enabled: true,
      itemId: index,
      kind: 0,
      priceCoins: 0,
      purchasable: false,
      requiredLevel: 1,
    })
  })

  premiumFiles.forEach((_, index) => {
    definitions.push({
      enabled: true,
      itemId: freeFiles.length + index,
      kind: 0,
      priceCoins: 1200 + index * 100,
      purchasable: true,
      requiredLevel: 1,
    })
  })

  rewardFiles.forEach((_, index) => {
    definitions.push({
      enabled: true,
      itemId: freeFiles.length + premiumFiles.length + index,
      kind: 0,
      priceCoins: 0,
      purchasable: false,
      requiredLevel: 10,
    })
  })

  return {
    definitions,
    specialRewardAvatarSkinId: freeFiles.length + premiumFiles.length,
  }
}

if (!existsSync(resolve(engineDir, 'Scarb.toml'))) {
  console.error(`Could not find engine directory at ${engineDir}`)
  process.exit(1)
}

const { definitions: avatarDefinitions, specialRewardAvatarSkinId } = buildAvatarDefinitions()

const diceDefinitions = diceSkinCatalog.map((skin, index) => ({
  enabled: true,
  itemId: index,
  kind: 1,
  priceCoins: skin.price,
  purchasable: skin.price > 0,
  requiredLevel: 1,
}))

const tokenDefinitions = tokenSkinShopCatalog.map((skin) => ({
  enabled: true,
  itemId: skin.index,
  kind: 2,
  priceCoins: skin.price,
  purchasable: skin.price > 0,
  requiredLevel: 1,
}))

const themeDefinitions = boardThemeCatalog.map((theme, index) => ({
  enabled: true,
  itemId: index,
  kind: 3,
  priceCoins: theme.price,
  purchasable: theme.price > 0,
  requiredLevel: 1,
}))

const cosmeticDefinitions = [...avatarDefinitions, ...diceDefinitions, ...tokenDefinitions, ...themeDefinitions]

try {
  console.log(`Seeding profile config and cosmetics using Dojo profile \`${profile}\``)
  console.log(`- avatars: ${avatarDefinitions.length}`)
  console.log(`- dice: ${diceDefinitions.length}`)
  console.log(`- tokens: ${tokenDefinitions.length}`)
  console.log(`- themes: ${themeDefinitions.length}`)
  console.log(`- special reward avatar: ${specialRewardAvatarSkinId}`)

  const placementRewards = [
    { baseCoins: 100, baseXp: 120, place: 1 },
    { baseCoins: 60, baseXp: 80, place: 2 },
    { baseCoins: 40, baseXp: 50, place: 3 },
    { baseCoins: 20, baseXp: 30, place: 4 },
  ]

  placementRewards.forEach((reward) => {
    executeSozo(
      [
        'execute',
        ...commonArgs(),
        '--wait',
        'parquiz-admin_system',
        'set_placement_reward',
        reward.place.toString(),
        reward.baseXp.toString(),
        reward.baseCoins.toString(),
      ],
      `Writing placement reward for place ${reward.place}`,
    )
  })

  cosmeticDefinitions.forEach((definition) => {
    executeSozo(
      [
        'execute',
        ...commonArgs(),
        '--wait',
        'parquiz-admin_system',
        'set_cosmetic_definition',
        definition.kind.toString(),
        definition.itemId.toString(),
        definition.priceCoins.toString(),
        definition.requiredLevel.toString(),
        definition.enabled ? '1' : '0',
        definition.purchasable ? '1' : '0',
      ],
      `Writing cosmetic definition kind=${definition.kind} item=${definition.itemId}`,
    )
  })

  executeSozo(
    [
      'execute',
      ...commonArgs(),
      '--wait',
      'parquiz-admin_system',
      'set_progression_config',
      '100',
      '50',
      '50',
      '10',
      '5',
      '15',
      '20',
      '10',
      '10',
      '10',
      specialRewardAvatarSkinId.toString(),
    ],
    'Writing progression config',
  )

  console.log('\nProfile config and cosmetic catalog seeded successfully.')
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
