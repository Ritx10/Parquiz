import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'

const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.heic'])

const slugify = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[-\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

const listFilesRecursive = (directoryPath: string): string[] => {
  return readdirSync(directoryPath)
    .sort((left, right) => left.localeCompare(right, 'en'))
    .flatMap((entryName) => {
    if (entryName.startsWith('.')) {
      return []
    }

    const entryPath = join(directoryPath, entryName)
    const entryStats = statSync(entryPath)

    if (entryStats.isDirectory()) {
      return listFilesRecursive(entryPath)
    }

    return SUPPORTED_EXTENSIONS.has(extname(entryName).toLowerCase()) ? [entryPath] : []
    })
}

const findProjectDirectory = (name: string) => {
  if (!existsSync(projectRoot)) {
    return null
  }

  const normalizedTarget = name.toLowerCase()
  const directMatch = readdirSync(projectRoot).find((entryName) => entryName.toLowerCase() === normalizedTarget)

  return directMatch ? join(projectRoot, directMatch) : null
}

const ensureEmptyDirectory = (directoryPath: string) => {
  rmSync(directoryPath, { force: true, recursive: true })
  mkdirSync(directoryPath, { recursive: true })
}

let heicConvertPromise: Promise<{
  default?: (options: { buffer: ArrayBufferLike; format: 'PNG' }) => Promise<ArrayBuffer>
}> | null = null

const getHeicConverter = async () => {
  heicConvertPromise ??= import('heic-convert')
  const module = await heicConvertPromise

  if (!module.default) {
    throw new Error('Failed to load the HEIC conversion module.')
  }

  return module.default
}

const copyOrConvertFile = async (sourcePath: string, destinationPath: string) => {
  if (extname(sourcePath).toLowerCase() === '.heic') {
    if (process.platform === 'darwin') {
      const result = spawnSync('sips', ['-s', 'format', 'png', sourcePath, '--out', destinationPath], {
        stdio: 'pipe',
      })

      if (result.status === 0) {
        return
      }
    }

    try {
      const convertHeic = await getHeicConverter()
      const convertedBuffer = await convertHeic({
        buffer: readFileSync(sourcePath),
        format: 'PNG',
      })

      writeFileSync(destinationPath, Buffer.from(convertedBuffer))
    } catch {
      throw new Error(`Failed to convert HEIC file: ${basename(sourcePath)}`)
    }

    return
  }

  copyFileSync(sourcePath, destinationPath)
}

const syncSkinGroup = async ({
  destinationDirectory,
  groupName,
  sourceDirectories,
}: {
  destinationDirectory: string
  groupName: string
  sourceDirectories: string[]
}) => {
  ensureEmptyDirectory(destinationDirectory)

  const seenHashes = new Set<string>()
  const seenSlugs = new Set<string>()
  let syncedCount = 0

  for (const directoryPath of sourceDirectories) {
    for (const filePath of listFilesRecursive(directoryPath)) {
      const fileHash = createHash('sha1').update(readFileSync(filePath)).digest('hex')

      if (seenHashes.has(fileHash)) {
        continue
      }

      seenHashes.add(fileHash)

      const rawSlug = slugify(basename(filePath, extname(filePath))) || `${groupName}-${syncedCount + 1}`
      let nextSlug = rawSlug
      let suffix = 2

      while (seenSlugs.has(nextSlug)) {
        nextSlug = `${rawSlug}-${suffix}`
        suffix += 1
      }

      seenSlugs.add(nextSlug)

      const destinationExtension = extname(filePath).toLowerCase() === '.heic' ? '.png' : extname(filePath).toLowerCase()
      const destinationPath = join(destinationDirectory, `${nextSlug}${destinationExtension}`)
      await copyOrConvertFile(filePath, destinationPath)
      syncedCount += 1
    }
  }

  return syncedCount
}

const projectRoot = resolve(import.meta.dir, '..')
const assetsRoot = join(projectRoot, 'src', 'assets', 'player-skins')
const freeDestination = join(assetsRoot, 'free')
const premiumDestination = join(assetsRoot, 'premium')
const rewardDestination = join(assetsRoot, 'reward')
const downloadsRoot = join(homedir(), 'Downloads')

const freeSource = findProjectDirectory('CapisGratis')
const premiumSource = findProjectDirectory('CapisPago')
const downloadsRewardSource = join(downloadsRoot, 'CapiEspecial')
const specialPremiumSource = existsSync(downloadsRewardSource)
  ? downloadsRewardSource
  : findProjectDirectory('CapiEspecial')

if (!freeSource) {
  throw new Error('Missing source folder in repository: frontend/CapisGratis')
}

if (!premiumSource) {
  throw new Error('Missing source folder in repository: frontend/CapisPago')
}

const premiumSourceDirectories = [premiumSource]

const freeCount = await syncSkinGroup({
  destinationDirectory: freeDestination,
  groupName: 'gratis',
  sourceDirectories: [freeSource],
})

const premiumCount = await syncSkinGroup({
  destinationDirectory: premiumDestination,
  groupName: 'premium',
  sourceDirectories: premiumSourceDirectories,
})

const rewardCount = specialPremiumSource
  ? await syncSkinGroup({
      destinationDirectory: rewardDestination,
      groupName: 'especial',
      sourceDirectories: [specialPremiumSource],
    })
  : 0

console.log(`Synced ${freeCount} free capi skins from ${freeSource.replace(`${projectRoot}/`, '')}`)
console.log(`Synced ${premiumCount} premium capi skins from ${premiumSource.replace(`${projectRoot}/`, '')}`)

if (specialPremiumSource) {
  console.log(`Synced ${rewardCount} reward capi skins from ${specialPremiumSource.replace(`${projectRoot}/`, '')}`)
} else {
  console.log('Optional CapiEspecial folder was not found in ~/Downloads or frontend; no reward skins were imported.')
}
