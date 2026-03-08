import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LOCAL_QUESTION_SET_COUNT,
  LOCAL_QUESTION_SET_ID,
  LOCAL_QUESTION_SET_ROOT,
  LOCAL_QUESTION_SET_VERSION,
} from '../src/lib/questions/local-question-bank'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const engineDir = resolve(scriptDir, '../../engine')

const profile = process.argv[2]?.trim() || 'release'
const enabled = process.argv[3]?.trim() === '0' ? '0' : '1'

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

const signerConfigured = () => {
  if (process.env.DOJO_PRIVATE_KEY?.trim()) {
    return true
  }

  if (process.env.DOJO_KEYSTORE_PASSWORD !== undefined) {
    return true
  }

  return false
}

const printFallbackCommand = () => {
  const baseCommand = [
    'sozo',
    'execute',
    '--profile',
    profile,
    '--wait',
    'parquiz-admin_system',
    'set_question_set',
    LOCAL_QUESTION_SET_ID.toString(),
    LOCAL_QUESTION_SET_ROOT,
    LOCAL_QUESTION_SET_COUNT.toString(),
    LOCAL_QUESTION_SET_VERSION.toString(),
    enabled,
  ]

  console.log('\nFallback command:')
  console.log(baseCommand.join(' '))
}

if (!existsSync(resolve(engineDir, 'Scarb.toml'))) {
  console.error(`Could not find engine directory at ${engineDir}`)
  process.exit(1)
}

console.log(`Seeding QuestionSet ${LOCAL_QUESTION_SET_ID.toString()} from local bank`)
console.log(`- root: ${LOCAL_QUESTION_SET_ROOT}`)
console.log(`- count: ${LOCAL_QUESTION_SET_COUNT}`)
console.log(`- version: ${LOCAL_QUESTION_SET_VERSION}`)
console.log(`- enabled: ${enabled}`)

if (!signerConfigured()) {
  console.error('\nMissing signer credentials for the live admin write.')
  console.error('Set `DOJO_KEYSTORE_PASSWORD` to use the release keystore, or provide `DOJO_ACCOUNT_ADDRESS` + `DOJO_PRIVATE_KEY`.')
  printFallbackCommand()
  process.exit(1)
}

const executeArgs = [
  'execute',
  ...commonArgs(),
  '--wait',
  'parquiz-admin_system',
  'set_question_set',
  LOCAL_QUESTION_SET_ID.toString(),
  LOCAL_QUESTION_SET_ROOT,
  LOCAL_QUESTION_SET_COUNT.toString(),
  LOCAL_QUESTION_SET_VERSION.toString(),
  enabled,
]

const executeResult = Bun.spawnSync({
  cmd: ['sozo', ...executeArgs],
  cwd: engineDir,
  stdout: 'inherit',
  stderr: 'inherit',
  env: process.env,
})

if (executeResult.exitCode !== 0) {
  console.error('\nQuestion set write failed.')
  printFallbackCommand()
  process.exit(executeResult.exitCode)
}

const verifyArgs = [
  'model',
  'get',
  ...commonArgs(),
  'parquiz-QuestionSet',
  LOCAL_QUESTION_SET_ID.toString(),
]

const verifyResult = Bun.spawnSync({
  cmd: ['sozo', ...verifyArgs],
  cwd: engineDir,
  stdout: 'inherit',
  stderr: 'inherit',
  env: process.env,
})

if (verifyResult.exitCode !== 0) {
  console.error('\nQuestion set write succeeded, but verification failed.')
  process.exit(verifyResult.exitCode)
}

console.log('\nQuestion set is now seeded and verified.')
