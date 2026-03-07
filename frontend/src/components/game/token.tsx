import type { CSSProperties } from 'react'
import type { MatchToken } from './match-types'

const tokenClasses: Record<MatchToken['color'], string> = {
  red: 'from-[#ff8a75] to-[#ce2f24] border-[#7f1e15]',
  blue: 'from-[#82c6ff] to-[#2f79ce] border-[#19457b]',
  yellow: 'from-[#ffe693] to-[#d2a018] border-[#8e6700]',
  green: 'from-[#a3ed74] to-[#4a9f28] border-[#2c6117]',
}

type TokenProps = {
  token: MatchToken
  style: CSSProperties
  isMovable: boolean
  isSelected: boolean
  tooltipText: string
  isAnimating: boolean
  onClick: (tokenId: string) => void
  onHoverStart?: (tokenId: string) => void
}

export function Token({
  token,
  style,
  isMovable,
  isSelected,
  tooltipText,
  isAnimating,
  onClick,
  onHoverStart,
}: TokenProps) {
  return (
    <button
      aria-label={`Ficha ${token.label}`}
      className={`pointer-events-auto group absolute h-[24px] w-[24px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] bg-gradient-to-b shadow-[0_2px_0_rgba(24,18,12,0.45)] transition-all duration-300 ${tokenClasses[token.color]} ${
        isMovable
          ? 'ring-2 ring-[#8dd9ff] ring-offset-1 ring-offset-transparent'
          : 'opacity-90 saturate-[0.95]'
      } ${isSelected ? 'scale-[1.08] ring-[#ffe188]' : ''} ${isAnimating ? 'animate-pulse' : ''}`}
      onFocus={() => onHoverStart?.(token.id)}
      onClick={() => onClick(token.id)}
      onMouseEnter={() => onHoverStart?.(token.id)}
      style={style}
      title={tooltipText}
      type="button"
    >
      <span className="pointer-events-none absolute -bottom-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[#11315f] bg-[#082650] px-2 py-1 text-[10px] font-bold text-[#e7f7ff] shadow-lg group-hover:block">
        {tooltipText}
      </span>
    </button>
  )
}
