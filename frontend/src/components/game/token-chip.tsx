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

export function TokenChip({
  skinId,
  avatar,
  alt = 'Ficha',
  className = '',
  symbolPlacement = 'center',
  variant = 'board',
}: TokenChipProps) {
  const skin = getTokenSkinDefinition(skinId)

  void symbolPlacement
  void variant

  return (
    <span
      className={`relative inline-flex h-full w-full items-center justify-center overflow-hidden rounded-full border bg-gradient-to-b shadow-[0_3px_0_rgba(24,18,12,0.38)] ${skin.shellClass} ${className}`}
    >
      <span className={`absolute inset-[10%] rounded-full border shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] ${skin.innerClass}`} />
      {skin.textureClass ? <span className={`absolute inset-[14%] rounded-full ${skin.textureClass}`} /> : null}
      <span
        className={`absolute inset-[18%] rounded-full ${skin.shineClass || 'bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.85),rgba(255,255,255,0.18)_48%,transparent_70%)]'}`}
      />
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

    </span>
  )
}
