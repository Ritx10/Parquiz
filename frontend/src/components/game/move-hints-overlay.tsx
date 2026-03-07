import type { SelectedDie } from '../../store/game-ui-store'
import type { TokenHint } from './match-types'

const resourceOrder = ['dieA', 'dieB', 'sum', 'bonus'] as const

const resourceLabel: Record<(typeof resourceOrder)[number], string> = {
  dieA: 'dieA',
  dieB: 'dieB',
  sum: 'SUM',
  bonus: 'BONUS',
}

type MoveHintsOverlayProps = {
  hints: TokenHint[]
  selectedDie: SelectedDie
}

export function MoveHintsOverlay({ hints, selectedDie }: MoveHintsOverlayProps) {
  return (
    <section className="game-panel bg-[#f2f8ff]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-display text-xl uppercase tracking-wide text-board-night">Jugadas legales</p>
        <span className="rounded-full border border-[#5d8ec4] bg-[#dcecff] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#174a80]">
          {selectedDie ? `Modo: ${resourceLabel[selectedDie]}` : 'Selecciona dado'}
        </span>
      </div>

      {hints.length === 0 ? (
        <p className="mt-2 rounded-xl border border-[#b6ccdf] bg-white px-3 py-2 text-sm font-semibold text-[#3e5874]">
          No hay jugadas legales para la seleccion actual.
        </p>
      ) : (
        <ul className="mt-2 grid gap-2 md:grid-cols-2">
          {hints.map((hint) => (
            <li className="rounded-xl border border-[#bfd5ea] bg-white px-3 py-2" key={hint.tokenId}>
              <p className="text-sm font-black text-board-night">{hint.tokenLabel}</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-board-night/70">
                Posicion {hint.position}
              </p>

              <div className="mt-1 flex flex-wrap gap-1">
                {resourceOrder.map((resource) => {
                  const moves = hint.movesByResource[resource]
                  const isSelected = selectedDie === resource

                  return (
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                        isSelected
                          ? 'border-[#1c5da6] bg-[#2f86ff] text-white'
                          : moves && moves.length > 0
                            ? 'border-[#2f7c1a] bg-[#e4f8da] text-[#1d5a0f]'
                            : 'border-[#c8d2df] bg-[#f4f7fb] text-[#64748b]'
                      }`}
                      key={`${hint.tokenId}-${resource}`}
                    >
                      {resourceLabel[resource]}: {moves?.join(', ') || '-'}
                    </span>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
