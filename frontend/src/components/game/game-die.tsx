import { getDiceSkinDefinition, type DiceSkinId } from '../../lib/dice-cosmetics'

type DiceFaceValue = 1 | 2 | 3 | 4 | 5 | 6

type GameDieProps = {
  className?: string
  rolling?: boolean
  skinId: DiceSkinId
  value: null | number
}

const dicePipLayout: Record<DiceFaceValue, Array<{ left: string; top: string }>> = {
  1: [{ left: '50%', top: '50%' }],
  2: [
    { left: '28%', top: '28%' },
    { left: '72%', top: '72%' },
  ],
  3: [
    { left: '28%', top: '28%' },
    { left: '50%', top: '50%' },
    { left: '72%', top: '72%' },
  ],
  4: [
    { left: '28%', top: '28%' },
    { left: '72%', top: '28%' },
    { left: '28%', top: '72%' },
    { left: '72%', top: '72%' },
  ],
  5: [
    { left: '28%', top: '28%' },
    { left: '72%', top: '28%' },
    { left: '50%', top: '50%' },
    { left: '28%', top: '72%' },
    { left: '72%', top: '72%' },
  ],
  6: [
    { left: '28%', top: '24%' },
    { left: '72%', top: '24%' },
    { left: '28%', top: '50%' },
    { left: '72%', top: '50%' },
    { left: '28%', top: '76%' },
    { left: '72%', top: '76%' },
  ],
}

const normalizeDiceFace = (value: null | number): DiceFaceValue => {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6) {
    return value
  }

  return 5
}

export function GameDie({ className = 'h-11 w-11', rolling = false, skinId, value }: GameDieProps) {
  const skin = getDiceSkinDefinition(skinId)
  const face = normalizeDiceFace(value)

  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-[11px] border shadow-[0_5px_0_rgba(53,74,107,0.32)] ${skin.shellClass} ${className} ${rolling ? 'animate-spin' : ''}`}
    >
      <span className={`absolute inset-[7%] rounded-[8px] ${skin.faceClass}`} />
      <span className={`absolute inset-[12%] rounded-[7px] ${skin.sparkleClass || 'bg-white/10'}`} />
      <span className="absolute left-[16%] top-[12%] h-[16%] w-[40%] rotate-[-18deg] rounded-full bg-white/40 blur-[1px]" />

      {dicePipLayout[face].map((pip, index) => (
        <span
          className={`absolute h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full ${skin.pipClass}`}
          key={`${skin.id}-${face}-${index}`}
          style={{ left: pip.left, top: pip.top }}
        />
      ))}

      {skin.symbol ? (
        <span className="absolute right-[6%] top-[6%] inline-flex h-[24%] w-[24%] items-center justify-center rounded-full border border-white/55 bg-[#4a2b15]/70 text-[32%] font-black leading-none text-white shadow-[0_1px_4px_rgba(34,18,10,0.35)]">
          {skin.symbol}
        </span>
      ) : null}
    </span>
  )
}
