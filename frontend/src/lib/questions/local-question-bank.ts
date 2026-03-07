import { hash } from 'starknet'

type LocalQuestionSeed = {
  questionIndex: number
  category: number
  difficulty: 0 | 1 | 2
  prompt: string
  options: [string, string, string, string]
  correctOption: 0 | 1 | 2 | 3
}

export type HydratedQuestion = LocalQuestionSeed & {
  merkleProof: string[]
  merkleDirections: Array<0 | 1>
}

const QUESTION_SEEDS: LocalQuestionSeed[] = [
  {
    questionIndex: 0,
    category: 0,
    difficulty: 0,
    prompt: 'What planet is known as the Red Planet?',
    options: ['Mars', 'Venus', 'Jupiter', 'Mercury'],
    correctOption: 0,
  },
  {
    questionIndex: 0,
    category: 0,
    difficulty: 1,
    prompt: 'Which planet is called the Red Planet because of iron oxide on its surface?',
    options: ['Saturn', 'Mars', 'Neptune', 'Earth'],
    correctOption: 1,
  },
  {
    questionIndex: 0,
    category: 0,
    difficulty: 2,
    prompt: 'The Red Planet gets its color primarily from which oxidized mineral compound?',
    options: ['Copper sulfate', 'Iron oxide', 'Magnesium carbonate', 'Silicon dioxide'],
    correctOption: 1,
  },
  {
    questionIndex: 1,
    category: 0,
    difficulty: 0,
    prompt: 'What gas do plants absorb from the atmosphere?',
    options: ['Oxygen', 'Hydrogen', 'Carbon dioxide', 'Nitrogen'],
    correctOption: 2,
  },
  {
    questionIndex: 1,
    category: 0,
    difficulty: 1,
    prompt: 'Photosynthesis relies on plants absorbing which atmospheric gas?',
    options: ['Carbon dioxide', 'Helium', 'Hydrogen', 'Argon'],
    correctOption: 0,
  },
  {
    questionIndex: 1,
    category: 0,
    difficulty: 2,
    prompt: 'Which molecule from the atmosphere supplies the carbon used to build glucose in photosynthesis?',
    options: ['Methane', 'Carbon dioxide', 'Ozone', 'Nitrous oxide'],
    correctOption: 1,
  },
  {
    questionIndex: 2,
    category: 0,
    difficulty: 0,
    prompt: 'Which ocean is the largest on Earth?',
    options: ['Atlantic Ocean', 'Pacific Ocean', 'Indian Ocean', 'Arctic Ocean'],
    correctOption: 1,
  },
  {
    questionIndex: 2,
    category: 0,
    difficulty: 1,
    prompt: 'Earth\'s largest and deepest ocean basin is which one?',
    options: ['Pacific Ocean', 'Southern Ocean', 'Atlantic Ocean', 'Indian Ocean'],
    correctOption: 0,
  },
  {
    questionIndex: 2,
    category: 0,
    difficulty: 2,
    prompt: 'Which ocean contains the Mariana Trench and covers more surface area than all land combined?',
    options: ['Indian Ocean', 'Atlantic Ocean', 'Pacific Ocean', 'Southern Ocean'],
    correctOption: 2,
  },
  {
    questionIndex: 3,
    category: 0,
    difficulty: 0,
    prompt: 'How many continents are there on Earth?',
    options: ['Five', 'Six', 'Seven', 'Eight'],
    correctOption: 2,
  },
  {
    questionIndex: 3,
    category: 0,
    difficulty: 1,
    prompt: 'In the standard geographic model taught globally, Earth is divided into how many continents?',
    options: ['Seven', 'Six', 'Five', 'Eight'],
    correctOption: 0,
  },
  {
    questionIndex: 3,
    category: 0,
    difficulty: 2,
    prompt: 'Using the seven-continent convention, how many continents are recognized on Earth?',
    options: ['Six', 'Seven', 'Eight', 'Nine'],
    correctOption: 1,
  },
]

const normalizeHex = (value: string) => `0x${BigInt(value).toString(16)}`

const hashPair = (left: string, right: string) =>
  normalizeHex(hash.computePoseidonHashOnElements([left, right]))

const buildQuestionLeafHash = (seed: LocalQuestionSeed) =>
  normalizeHex(
    hash.computePoseidonHashOnElements([
      seed.questionIndex.toString(),
      seed.category.toString(),
      seed.difficulty.toString(),
      seed.correctOption.toString(),
    ]),
  )

const buildMerkleArtifacts = (seeds: LocalQuestionSeed[]) => {
  const leaves = seeds.map((seed) => buildQuestionLeafHash(seed))
  const proofs = Array.from({ length: seeds.length }, () => ({
    merkleProof: [] as string[],
    merkleDirections: [] as Array<0 | 1>,
  }))

  let level = leaves.map((hashValue, index) => ({ hashValue, indexes: [index] }))

  while (level.length > 1) {
    const nextLevel: Array<{ hashValue: string; indexes: number[] }> = []

    for (let index = 0; index < level.length; index += 2) {
      const left = level[index]
      const right = level[index + 1]

      if (!right) {
        nextLevel.push(left)
        continue
      }

      for (const leafIndex of left.indexes) {
        proofs[leafIndex].merkleProof.push(right.hashValue)
        proofs[leafIndex].merkleDirections.push(0)
      }

      for (const leafIndex of right.indexes) {
        proofs[leafIndex].merkleProof.push(left.hashValue)
        proofs[leafIndex].merkleDirections.push(1)
      }

      nextLevel.push({
        hashValue: hashPair(left.hashValue, right.hashValue),
        indexes: [...left.indexes, ...right.indexes],
      })
    }

    level = nextLevel
  }

  return {
    root: level[0]?.hashValue ?? '0x0',
    hydratedQuestions: seeds.map((seed, index) => ({
      ...seed,
      merkleProof: proofs[index].merkleProof,
      merkleDirections: proofs[index].merkleDirections,
    })),
  }
}

const questionIndexCount = new Set(QUESTION_SEEDS.map((seed) => seed.questionIndex)).size
const artifacts = buildMerkleArtifacts(QUESTION_SEEDS)

export const LOCAL_QUESTION_SET_ID = 1n
export const LOCAL_QUESTION_SET_COUNT = questionIndexCount
export const LOCAL_QUESTION_SET_ROOT = artifacts.root
export const LOCAL_QUESTION_SET_VERSION = 1

export const LOCAL_QUESTION_SET = artifacts.hydratedQuestions

export const getHydratedQuestion = (
  questionIndex: number,
  category: number,
  difficulty: number,
): HydratedQuestion | null => {
  return (
    LOCAL_QUESTION_SET.find(
      (question) =>
        question.questionIndex === questionIndex &&
        question.category === category &&
        question.difficulty === difficulty,
    ) ?? null
  )
}
