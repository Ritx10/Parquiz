import type { SelectedDie } from '../../store/game-ui-store'

type DicePanelProps = {
  canRoll: boolean
  dieA: number | null
  dieB: number | null
  selectedDie: SelectedDie
  consumed: {
    dieA: boolean
    dieB: boolean
    sum: boolean
    bonus: boolean
  }
  allowSumDice: boolean
  hasSumMove: boolean
  bonusPending: number | null
  onRoll: () => void
  onSelectDie: (die: Exclude<SelectedDie, null>) => void
  onUndo: () => void
  onToggleLog: () => void
}

type DieButtonProps = {
  label: string
  value: number | null
  active: boolean
  consumed: boolean
  disabled: boolean
  onClick: () => void
}

function DieButton({ label, value, active, consumed, disabled, onClick }: DieButtonProps) {
  return (
    <button
      className={`relative flex min-h-[86px] flex-col items-center justify-center rounded-2xl border-2 px-3 py-2 text-center transition-all ${
        disabled
          ? 'cursor-not-allowed border-[#9ca8b7] bg-[#dce5ef] text-[#6f7f92]'
          : active
            ? 'border-[#2d79d3] bg-[#eaf5ff] text-[#143f74] shadow-[0_0_0_3px_rgba(124,196,255,0.55)]'
            : 'border-[#d4a94f] bg-[#fff8dd] text-[#4d3308] hover:-translate-y-0.5'
      } ${consumed ? 'opacity-45 saturate-[0.55]' : ''}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="text-xs font-black uppercase tracking-wide">{label}</span>
      <span className="mt-1 font-display text-4xl leading-none">{value ?? '-'}</span>
      {consumed ? (
        <span className="absolute right-1 top-1 rounded-full border border-[#8a3b22] bg-[#df6030] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
          Usado
        </span>
      ) : null}
    </button>
  )
}

export function DicePanel({
  canRoll,
  dieA,
  dieB,
  selectedDie,
  consumed,
  allowSumDice,
  hasSumMove,
  bonusPending,
  onRoll,
  onSelectDie,
  onUndo,
  onToggleLog,
}: DicePanelProps) {
  const sumValue = dieA && dieB ? dieA + dieB : null
  const diceEnabled = typeof dieA === 'number' && typeof dieB === 'number'

  return (
    <section className="game-panel bg-gradient-to-b from-[#ffefc8] via-[#ffe39d] to-[#ffd26b]">
      <div className="game-wood px-4 py-2 text-center">
        <p className="font-display text-2xl uppercase tracking-wide">Panel de acciones</p>
      </div>

      <div className="mt-3 space-y-3">
        <button
          className={`action-button-primary ${canRoll ? '' : 'cursor-not-allowed opacity-60'}`}
          disabled={!canRoll}
          onClick={onRoll}
          type="button"
        >
          Tirar dados
        </button>

        <div className="grid grid-cols-2 gap-2">
          <DieButton
            active={selectedDie === 'dieA'}
            consumed={consumed.dieA}
            disabled={!diceEnabled || consumed.dieA}
            label="dieA"
            onClick={() => onSelectDie('dieA')}
            value={dieA}
          />
          <DieButton
            active={selectedDie === 'dieB'}
            consumed={consumed.dieB}
            disabled={!diceEnabled || consumed.dieB}
            label="dieB"
            onClick={() => onSelectDie('dieB')}
            value={dieB}
          />
        </div>

        {allowSumDice ? (
          <button
            className={`w-full rounded-2xl border-2 px-4 py-3 text-left transition-all ${
              selectedDie === 'sum'
                ? 'border-[#225ea9] bg-[#2f86ff] text-white shadow-[0_0_0_3px_rgba(124,196,255,0.45)]'
                : 'border-[#d0a755] bg-[#fff4cd] text-[#4a320d]'
            } ${!diceEnabled || consumed.sum || !hasSumMove ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5'}`}
            disabled={!diceEnabled || consumed.sum || !hasSumMove}
            onClick={() => onSelectDie('sum')}
            type="button"
          >
            <p className="font-display text-2xl uppercase leading-none">SUM</p>
            <p className="text-xs font-bold uppercase tracking-wide">{sumValue ?? '-'} pasos</p>
          </button>
        ) : null}

        <div className="rounded-2xl border border-[#d6af50] bg-[#fff6dd] p-3 text-xs font-bold uppercase tracking-wide text-board-night">
          Bono pendiente:{' '}
          {bonusPending ? (
            <span className="rounded-full border border-[#2a6c12] bg-[#79cf43] px-2 py-1 text-white">
              +{bonusPending}
            </span>
          ) : (
            <span className="text-board-night/60">ninguno</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-[#d6af50] bg-[#fff6dd] p-2 text-[10px] font-black uppercase tracking-wide text-board-night">
          <span className={consumed.dieA ? 'text-[#ad4b1d]' : 'text-[#2d7a16]'}>
            dieA: {consumed.dieA ? 'usado' : 'activo'}
          </span>
          <span className={consumed.dieB ? 'text-[#ad4b1d]' : 'text-[#2d7a16]'}>
            dieB: {consumed.dieB ? 'usado' : 'activo'}
          </span>
          <span className={consumed.sum ? 'text-[#ad4b1d]' : 'text-[#2d7a16]'}>
            SUM: {consumed.sum ? 'usado' : 'activo'}
          </span>
          <span className={consumed.bonus ? 'text-[#ad4b1d]' : 'text-[#2d7a16]'}>
            BONUS:{' '}
            {consumed.bonus ? 'usado' : bonusPending ? 'pendiente' : 'inactivo'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className="action-button-secondary" onClick={onUndo} type="button">
            Undo
          </button>
          <button className="action-button-secondary" onClick={onToggleLog} type="button">
            Log
          </button>
        </div>
      </div>
    </section>
  )
}
