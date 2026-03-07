import type { TurnActionItem } from '../../store/game-ui-store'

const resourceLabel: Record<TurnActionItem['resource'], string> = {
  dieA: 'dieA',
  dieB: 'dieB',
  sum: 'SUM',
  bonus: 'BONUS',
}

type TurnActionStackProps = {
  actions: TurnActionItem[]
}

export function TurnActionStack({ actions }: TurnActionStackProps) {
  return (
    <section className="game-panel bg-gradient-to-r from-[#18447d] via-[#1f5d9f] to-[#18447d] text-[#e9f4ff]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-display text-xl uppercase tracking-wide">Stack del turno</p>
        {actions.length === 0 ? (
          <span className="rounded-full border border-[#5f91c7] bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#b8dfff]">
            Sin acciones
          </span>
        ) : null}
      </div>

      {actions.length > 0 ? (
        <ol className="mt-2 grid gap-2 text-sm">
          {actions.map((action, index) => (
            <li
              className="rounded-xl border border-[#5f91c7] bg-white/10 px-3 py-2 font-semibold"
              key={action.id}
            >
              {index + 1}. {resourceLabel[action.resource]}={action.value} aplicado a {action.tokenLabel}{' '}
              en casilla {action.destination}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  )
}
