type ResultModalProps = {
  open: boolean
  onClose: () => void
}

const leaderboard = [
  { name: 'Christa', coins: 1560 },
  { name: 'Hydeny', coins: 400 },
  { name: 'IA Bot', coins: 180 },
  { name: 'Tinotas', coins: 750 },
]

export function ResultModal({ open, onClose }: ResultModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0a1834]/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[26px] border-2 border-[#fce29f] bg-gradient-to-b from-[#1f5ea4] via-[#184886] to-[#12376a] p-4 text-white shadow-board">
        <header className="game-wood px-4 py-2 text-center">
          <p className="font-display text-4xl uppercase tracking-wide text-[#ffe888]">Ganaste!</p>
        </header>

        <div className="mt-4 rounded-2xl border border-[#f2cf7c] bg-[#fff8df] p-3">
          <ul className="space-y-2">
            {leaderboard.map((player, index) => (
              <li
                className="flex items-center justify-between rounded-xl border border-[#f2cf7c] bg-white px-3 py-2 text-board-night"
                key={player.name}
              >
                <p className="font-display text-2xl">
                  #{index + 1} {player.name}
                </p>
                <span className="coin-pill">{player.coins}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex justify-end">
          <button className="action-button-primary max-w-[220px]" onClick={onClose} type="button">
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
