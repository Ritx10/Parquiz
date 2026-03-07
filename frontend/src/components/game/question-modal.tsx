import { useState } from 'react'

type QuestionModalProps = {
  open: boolean
  onAnswerResolved: (correct: boolean) => void
  onClose: () => void
}

const options = [
  { id: 'a', label: 'Fotosintesis', reward: 16, correct: true },
  { id: 'b', label: 'Fermentacion', reward: 10, correct: false },
  { id: 'c', label: 'Magnetismo', reward: 10, correct: false },
  { id: 'd', label: 'Combustion', reward: 10, correct: false },
]

export function QuestionModal({ open, onAnswerResolved, onClose }: QuestionModalProps) {
  const [selected, setSelected] = useState<string | null>(null)

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#081a39]/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[26px] border-2 border-[#fce29f] bg-gradient-to-b from-[#1f5ea4] via-[#1a4a8a] to-[#133667] p-4 text-white shadow-board">
        <header className="game-wood px-4 py-2 text-center">
          <p className="font-display text-3xl uppercase">Pregunta del turno</p>
        </header>

        <article className="mt-3 rounded-2xl border border-[#88d9ff] bg-[#0f3765]/80 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8fcfff]">Historia natural</p>
          <p className="mt-2 text-xl font-bold leading-tight">
            Como se llama el proceso mediante el cual las plantas elaboran su propio
            alimento?
          </p>
        </article>

        <ul className="mt-3 space-y-2">
          {options.map((option) => {
            const isSelected = selected === option.id

            return (
              <li key={option.id}>
                <button
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition-all ${
                    isSelected
                      ? 'border-[#ffe288] bg-[#fff2c2] text-[#523000]'
                      : 'border-[#e7c875] bg-[#fffbeb] text-[#2f3a53] hover:bg-white'
                  }`}
                  onClick={() => setSelected(option.id)}
                  type="button"
                >
                  <span className="font-display text-2xl">{option.label}</span>
                  <span className="coin-pill">{option.reward}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            className="action-button-secondary max-w-[180px]"
            onClick={() => {
              setSelected(null)
              onClose()
            }}
            type="button"
          >
            Cerrar
          </button>
          <button
            className="action-button-primary max-w-[240px] disabled:opacity-50"
            disabled={!selected}
            onClick={() => {
              const chosen = options.find((option) => option.id === selected)
              setSelected(null)
              onAnswerResolved(Boolean(chosen?.correct))
            }}
            type="button"
          >
            Confirmar respuesta
          </button>
        </div>
      </div>
    </div>
  )
}
