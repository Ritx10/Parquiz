import type { UiToast } from '../../store/game-ui-store'

const toneClass: Record<UiToast['tone'], string> = {
  info: 'border-[#2f74c7] bg-[#dff0ff] text-[#0f3b70]',
  success: 'border-[#2f7c1a] bg-[#e4f9da] text-[#1f5b10]',
  warning: 'border-[#ad4b1d] bg-[#ffe8d7] text-[#7a2a08]',
}

type EventToastProps = {
  toast: UiToast
  onDismiss: (id: string) => void
}

export function EventToast({ toast, onDismiss }: EventToastProps) {
  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${toneClass[toast.tone]}`}
      role="status"
    >
      <p className="text-sm font-bold">{toast.message}</p>
      <button
        className="ml-auto rounded-full border border-current px-2 py-0.5 text-[10px] font-black uppercase"
        onClick={() => onDismiss(toast.id)}
        type="button"
      >
        Cerrar
      </button>
    </div>
  )
}
