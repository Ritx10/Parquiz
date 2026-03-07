import { getTokenSkinDefinition, type TokenSkinId } from '../../lib/token-cosmetics'
import { GameAvatar } from './game-avatar'

type TokenChipProps = {
  skinId: TokenSkinId
  avatar?: string
  alt?: string
  className?: string
  symbolPlacement?: 'center' | 'corner'
  variant?: 'board' | 'shop'
}

const badgeClassByVariant = {
  board: {
    center: 'left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-[9px]',
    corner: 'right-[7%] top-[7%] h-3.5 w-3.5 text-[8px]',
  },
  shop: {
    center: 'left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-xl',
    corner: 'right-[9%] top-[9%] h-7 w-7 text-sm',
  },
} as const

export function TokenChip({
  skinId,
  avatar,
  alt = 'Ficha',
  className = '',
  symbolPlacement = 'center',
  variant = 'board',
}: TokenChipProps) {
  const skin = getTokenSkinDefinition(skinId)
  const badgeClass = badgeClassByVariant[variant][symbolPlacement]

  return (
    <span
      className={`relative inline-flex h-full w-full items-center justify-center overflow-hidden rounded-full border bg-gradient-to-b shadow-[0_3px_0_rgba(24,18,12,0.38)] ${skin.shellClass} ${className}`}
    >
      <span className={`absolute inset-[10%] rounded-full border shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] ${skin.innerClass}`} />
      <span className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.85),rgba(255,255,255,0.18)_48%,transparent_70%)]" />
      <span className="absolute left-[18%] top-[12%] h-[20%] w-[44%] rotate-[-18deg] rounded-full bg-white/40 blur-[1px]" />

      {avatar ? (
        <span className="relative z-10 flex h-[72%] w-[72%] items-center justify-center overflow-hidden rounded-full border border-white/55 bg-white/15">
          <GameAvatar
            alt={alt}
            avatar={avatar}
            imageClassName="h-full w-full object-contain p-[1px]"
            textClassName="flex h-full w-full items-center justify-center text-[8px] font-black text-[#2c190d]"
          />
        </span>
      ) : null}

      {skin.symbol ? (
        <span
          className={`absolute z-20 inline-flex items-center justify-center rounded-full border border-white/55 bg-[#4a2b15]/80 font-black uppercase leading-none text-white shadow-[0_2px_6px_rgba(34,18,10,0.35)] ${badgeClass}`}
        >
          {skin.symbol}
        </span>
      ) : null}
    </span>
  )
}
