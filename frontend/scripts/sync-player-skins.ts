import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, copyFileSync } from 'node:fs'
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
  return readdirSync(directoryPath).flatMap((entryName) => {
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

const findDownloadsDirectory = (name: string) => {
  const downloadsRoot = join(homedir(), 'Downloads')

  if (!existsSync(downloadsRoot)) {
    return null
  }

  const normalizedTarget = name.toLowerCase()
  const directMatch = readdirSync(downloadsRoot).find((entryName) => entryName.toLowerCase() === normalizedTarget)

  return directMatch ? join(downloadsRoot, directMatch) : null
}

const ensureEmptyDirectory = (directoryPath: string) => {
  rmSync(directoryPath, { force: true, recursive: true })
  mkdirSync(directoryPath, { recursive: true })
}

const copyOrConvertFile = (sourcePath: string, destinationPath: string) => {
  if (extname(sourcePath).toLowerCase() === '.heic') {
    const result = spawnSync('sips', ['-s', 'format', 'png', sourcePath, '--out', destinationPath], {
      stdio: 'pipe',
    })

    if (result.status !== 0) {
      throw new Error(`Failed to convert HEIC file: ${basename(sourcePath)}`)
    }

    return
  }

  copyFileSync(sourcePath, destinationPath)
}

const syncSkinGroup = ({
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

  sourceDirectories.forEach((directoryPath) => {
    listFilesRecursive(directoryPath).forEach((filePath) => {
      const fileHash = createHash('sha1').update(readFileSync(filePath)).digest('hex')

      if (seenHashes.has(fileHash)) {
        return
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
      copyOrConvertFile(filePath, destinationPath)
      syncedCount += 1
    })
  })

  return syncedCount
}

const projectRoot = resolve(import.meta.dir, '..')
const assetsRoot = join(projectRoot, 'src', 'assets', 'capis')
const freeDestination = join(assetsRoot, 'CapisGratis')
const premiumDestination = join(assetsRoot, 'CapisPago')

const freeSource = findDownloadsDirectory('CapisGratis')
const premiumSource = findDownloadsDirectory('CapisPago')
const extraPremiumSource = findDownloadsDirectory('Capi')

if (!freeSource) {
  throw new Error('Missing source folder in Downloads: CapisGratis')
}

if (!premiumSource) {
  throw new Error('Missing source folder in Downloads: CapisPago')
}

const premiumSourceDirectories = [premiumSource, extraPremiumSource].filter((entry): entry is string => Boolean(entry))

const freeCount = syncSkinGroup({
  destinationDirectory: freeDestination,
  groupName: 'gratis',
  sourceDirectories: [freeSource],
})

const premiumCount = syncSkinGroup({
  destinationDirectory: premiumDestination,
  groupName: 'premium',
  sourceDirectories: premiumSourceDirectories,
})

console.log(`Synced ${freeCount} free capi skins from Downloads/CapisGratis`)
console.log(`Synced ${premiumCount} premium capi skins from ${premiumSourceDirectories.map((path) => path.replace(`${homedir()}/`, '~/')).join(', ')}`)

if (!extraPremiumSource) {
  console.log('Optional Downloads/Capi folder was not found; no extra premium skins were imported.')
}
