import type { MatchLogEvent } from './match-types'

const typeIcon: Record<MatchLogEvent['type'], string> = {
  roll: 'DICE',
  move: 'MOVE',
  capture: '+20',
  home: '+10',
  bridge: 'BRDG',
  question: 'QUIZ',
}

const formatRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp

  if (diff < 60_000) {
    return 'hace segundos'
  }

  const minutes = Math.floor(diff / 60_000)

  if (minutes < 60) {
    return `hace ${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  return `hace ${hours}h`
}

type LogDrawerProps = {
  open: boolean
  events: MatchLogEvent[]
  onClose: () => void
}

export function LogDrawer({ open, events, onClose }: LogDrawerProps) {
  if (!open) {
    return null
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#04162f]/45" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l-2 border-[#22599b] bg-gradient-to-b from-[#eaf5ff] via-[#f5faff] to-[#dceeff] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#9dc6ef] px-4 py-3">
          <h3 className="font-display text-2xl uppercase tracking-wide text-[#103a6c]">Historial</h3>
          <button className="chip-button" onClick={onClose} type="button">
            Cerrar
          </button>
        </header>

        <ul className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {events.map((entry) => (
            <li
              className="rounded-xl border border-[#b4d2ed] bg-white px-3 py-2 text-sm text-[#1a3860]"
              key={entry.id}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-[#2f74c7] bg-[#e5f1ff] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#174a80]">
                  {typeIcon[entry.type]}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#57779f]">
                  {formatRelativeTime(entry.createdAt)}
                </span>
              </div>
              <p className="mt-1 font-semibold">{entry.message}</p>
            </li>
          ))}
        </ul>
      </aside>
    </>
  )
}
