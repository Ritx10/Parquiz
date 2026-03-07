type BridgeProps = {
  orientation: 'horizontal' | 'vertical' | 'diagonal'
}

export function Bridge({ orientation }: BridgeProps) {
  const isVertical = orientation === 'vertical'
  const isDiagonal = orientation === 'diagonal'

  return (
    <span
      className={`pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#4e2f14] bg-gradient-to-b from-[#8c5b2f] to-[#5a3618] shadow-[0_2px_0_rgba(36,19,7,0.55)] ${
        isVertical
          ? 'h-[72%] w-[20%]'
          : isDiagonal
            ? 'h-[20%] w-[72%] rotate-45'
            : 'h-[20%] w-[72%]'
      }`}
    />
  )
}
