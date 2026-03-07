import type { MatchPlayer } from './match-types'

const colorStripClass: Record<MatchPlayer['color'], string> = {
  red: 'bg-[#d74236]',
  blue: 'bg-[#3d96e7]',
  yellow: 'bg-[#e9c42a]',
  green: 'bg-[#208a77]',
}

type PlayersPanelProps = {
  players: MatchPlayer[]
  turnPlayerId: string
  selfPlayerId?: string
}

export function PlayersPanel({ players, turnPlayerId, selfPlayerId }: PlayersPanelProps) {
  return (
    <aside className="game-panel bg-gradient-to-b from-[#ffebbc] via-[#ffe09d] to-[#ffd67f]">
      <div className="game-wood px-4 py-2 text-center">
        <p className="font-display text-2xl uppercase tracking-wide">Jugadores</p>
      </div>

      <ul className="mt-3 space-y-2">
        {players.map((player) => {
          const isTurn = player.id === turnPlayerId
          const isSelf = player.id === selfPlayerId

          return (
            <li
              className={`rounded-2xl border px-3 py-2 text-board-night ${
                isTurn ? 'border-[#347cd7] bg-[#eef7ff]' : 'border-[#d3aa49] bg-[#fff8df]'
              }`}
              key={player.id}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-xl leading-none">{player.name}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-board-night/70">
                    {player.isHost ? 'Host' : 'Jugador'} {isSelf ? '- TU' : ''}
                  </p>
                </div>
                {isTurn ? (
                  <span className="rounded-full border border-[#1c5da6] bg-[#2f86ff] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                    Tu turno
                  </span>
                ) : null}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-bold uppercase tracking-wide text-board-night/70">
                <span className="rounded-lg bg-white/80 px-2 py-1">Casa: {player.tokensInBase}</span>
                <span className="rounded-lg bg-white/80 px-2 py-1">Meta: {player.tokensInGoal}</span>
              </div>

              <div className={`mt-2 h-2 rounded-full ${colorStripClass[player.color]}`} />
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
