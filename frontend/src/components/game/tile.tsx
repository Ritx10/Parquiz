import type { CSSProperties } from 'react'

type TileProps = {
  style: CSSProperties
  number?: number
  className: string
  isSafe?: boolean
  isBlocked?: boolean
  isHighlighted?: boolean
}

export function Tile({
  style,
  number,
  className,
  isSafe = false,
  isBlocked = false,
  isHighlighted = false,
}: TileProps) {
  return (
    <div
      className={`relative z-20 flex items-center justify-center border border-[#1f140d] ${
        isSafe ? 'shadow-[inset_0_0_0_2px_rgba(233,186,64,0.75)]' : ''
      } ${className}`}
      style={style}
    >
      {typeof number === 'number' ? (
        <span className="relative z-10 text-[11px] font-semibold text-[#2f1d12] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]">
          {number}
        </span>
      ) : null}

      {isSafe ? (
        <span
          className="pointer-events-none absolute right-[2px] top-[2px] inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border border-[#5c3d16] bg-[#f8d771] text-[9px] font-black text-[#5a3718] opacity-95 shadow-[0_1px_0_rgba(0,0,0,0.25)]"
          title="Casilla segura"
        >
          S
        </span>
      ) : null}

      {isBlocked ? (
        <span
          className="absolute left-[2px] top-[2px] inline-flex h-[14px] w-[14px] items-center justify-center rounded-full border border-[#5a3618] bg-[#7e552d] text-[8px] font-black text-[#ffeab9]"
          title="Bloqueo por puente"
        >
          !
        </span>
      ) : null}

      {isHighlighted ? (
        <span className="pointer-events-none absolute inset-[1px] rounded-[2px] border-2 border-[#2f86ff]/80 shadow-[0_0_0_2px_rgba(150,214,255,0.45)]" />
      ) : null}
    </div>
  )
}
