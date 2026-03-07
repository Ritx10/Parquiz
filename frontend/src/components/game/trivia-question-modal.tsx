import { GameAvatar } from './game-avatar'
import type { MatchPlayer } from './match-types'
import type { TriviaDifficulty, TriviaQuestion, TriviaQuestionTheme } from '../../lib/trivia-engine'
import { useAppSettingsStore } from '../../store/app-settings-store'

type TriviaAnswerState = 'correct' | 'incorrect' | 'idle' | 'timeout'

type TriviaQuestionModalProps = {
  answerState: TriviaAnswerState
  difficulty: TriviaDifficulty
  isAiTurn: boolean
  onSelectOption: (optionIndex: number) => void
  player?: MatchPlayer
  question: TriviaQuestion
  secondsLeft: number
  selectedOption: number | null
}

const themeClassByQuestion: Record<TriviaQuestionTheme, string> = {
  blue: 'from-[#0e3b82] via-[#1c62bb] to-[#3191e3]',
  green: 'from-[#146239] via-[#24975a] to-[#4ec676]',
  orange: 'from-[#8c4b11] via-[#cf7e26] to-[#efb547]',
  pink: 'from-[#73308e] via-[#9c4bc1] to-[#d56bf1]',
}

const optionToneByIndex = [
  'from-[#44d74e] to-[#208f2d]',
  'from-[#3f87ff] to-[#1f54c4]',
  'from-[#ffd43d] to-[#d39a08]',
  'from-[#ff6a5c] to-[#d53328]',
] as const

const triviaModalCopyByLanguage = {
  es: {
    aiAnswering: 'Bot respondiendo',
    currentTurn: 'Turno actual',
    difficultyLabel: {
      easy: 'Facil',
      medium: 'Media',
      hard: 'Dificil',
    } as Record<TriviaDifficulty, string>,
    feedbackCopy: {
      correct: 'Respuesta correcta. Puedes mover tus fichas.',
      incorrect: 'Respuesta incorrecta. El turno pasa al siguiente jugador.',
      timeout: 'Se agoto el tiempo. El turno pasa al siguiente jugador.',
    } as Record<Exclude<TriviaAnswerState, 'idle'>, string>,
    optionLabel: 'Opcion',
    playerPrompt: 'Acierta para mover. Si fallas, pierdes el turno.',
    resultLabel: {
      correct: 'Correcto',
      incorrect: 'Incorrecto',
      timeout: 'Tiempo agotado',
    } as Record<Exclude<TriviaAnswerState, 'idle'>, string>,
  },
  en: {
    aiAnswering: 'Bot answering',
    currentTurn: 'Current turn',
    difficultyLabel: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    } as Record<TriviaDifficulty, string>,
    feedbackCopy: {
      correct: 'Correct answer. You can move your tokens.',
      incorrect: 'Wrong answer. The turn passes to the next player.',
      timeout: 'Time is up. The turn passes to the next player.',
    } as Record<Exclude<TriviaAnswerState, 'idle'>, string>,
    optionLabel: 'Option',
    playerPrompt: 'Answer correctly to move. If you fail, you lose the turn.',
    resultLabel: {
      correct: 'Correct',
      incorrect: 'Incorrect',
      timeout: 'Time up',
    } as Record<Exclude<TriviaAnswerState, 'idle'>, string>,
  },
} as const

export function TriviaQuestionModal({
  answerState,
  difficulty,
  isAiTurn,
  onSelectOption,
  player,
  question,
  secondsLeft,
  selectedOption,
}: TriviaQuestionModalProps) {
  const language = useAppSettingsStore((state) => state.language)
  const ui = triviaModalCopyByLanguage[language]
  const answersLocked = answerState !== 'idle' || isAiTurn

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center px-3 py-5 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,227,133,0.24),rgba(15,7,4,0.86)_64%,rgba(7,3,1,0.92)_100%)] backdrop-blur-[7px]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 14 }).map((_, index) => (
          <span
            className="absolute h-3 w-3 rounded-full bg-white/25"
            key={`trivia-spark-${index}`}
            style={{
              boxShadow: index % 2 === 0 ? '0 0 16px rgba(255,224,122,0.65)' : '0 0 18px rgba(111,208,255,0.55)',
              left: `${6 + ((index * 7) % 86)}%`,
              top: `${8 + ((index * 11) % 74)}%`,
            }}
          />
        ))}
      </div>

      <article className="relative z-10 w-full max-w-[940px] rounded-[34px] border-[5px] border-[#7a441f] bg-gradient-to-b from-[#e0a85f] via-[#bf772f] to-[#8b4d21] p-2 shadow-[0_28px_60px_rgba(0,0,0,0.5)]">
        <div className="rounded-[28px] border-[3px] border-[#f0d18e] bg-gradient-to-b from-[#ffeab9] via-[#ffd975] to-[#f4bd47] p-3 sm:p-4">
          <div className={`rounded-[24px] border-[3px] border-[#6c3714] bg-gradient-to-r ${themeClassByQuestion[question.theme]} p-4 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.3)] sm:p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-full border-2 border-white/55 bg-black/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#fff5d5]">
                  {question.category}
                </span>
                <span className="rounded-full border-2 border-[#ffefb1] bg-[#5d2f0f]/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffe88a]">
                  {ui.difficultyLabel[difficulty]}
                </span>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border-[3px] border-[#8a560d] bg-gradient-to-b from-[#ffe889] to-[#f1b833] px-4 py-1.5 text-lg font-black text-[#5b3306] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:text-2xl">
                <span>⏱</span>
                <span>{secondsLeft}</span>
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 sm:w-[190px] sm:flex-col sm:justify-center">
                <div className="flex h-[122px] w-[122px] items-center justify-center rounded-[30px] border-[4px] border-[#f7d68d] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.72),rgba(255,255,255,0.08)_42%,rgba(0,0,0,0.12)_100%)] text-[72px] shadow-[0_10px_24px_rgba(0,0,0,0.28)]">
                  {question.icon}
                </div>

                {player ? (
                  <div className="flex min-w-0 items-center gap-2 rounded-[18px] border-2 border-white/25 bg-black/20 px-3 py-2">
                    <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#fff0ca] bg-[#fff4dc]">
                      <GameAvatar
                        alt={player.name}
                        avatar={player.avatar}
                        imageClassName="h-full w-full object-contain p-1"
                        textClassName="text-xs font-black text-[#2c190d]"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-[#ffeeb6]">
                        {isAiTurn ? ui.aiAnswering : ui.currentTurn}
                      </p>
                      <p className="truncate font-display text-xl leading-none text-white">{player.name}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 flex-1 rounded-[26px] border-[3px] border-white/20 bg-[#12305f]/40 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:px-6 sm:py-5">
                <p className="text-center font-display text-[30px] leading-tight text-[#fff9ea] drop-shadow-[0_2px_0_rgba(7,20,47,0.36)] sm:text-[42px]">
                  {question.prompt}
                </p>
                <p className="mt-3 text-center text-[11px] font-black uppercase tracking-[0.22em] text-[#d8edff] sm:text-[12px]">
                  {isAiTurn ? ui.playerPrompt : ui.playerPrompt}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {question.options.map((option, index) => {
              const isCorrectOption = answerState !== 'idle' && index === question.correctIndex
              const isSelectedOption = selectedOption === index
              const isWrongSelection = answerState !== 'idle' && isSelectedOption && !isCorrectOption

              return (
                <button
                  className={`rounded-[22px] border-[4px] px-4 py-4 text-left shadow-[0_8px_0_rgba(87,42,8,0.45)] transition duration-150 sm:px-5 sm:py-5 ${
                    !answersLocked
                      ? `border-[#f9ebbe] bg-gradient-to-b ${optionToneByIndex[index]} text-white hover:-translate-y-0.5 hover:brightness-105`
                      : isCorrectOption
                        ? 'border-[#ffe8a0] bg-gradient-to-b from-[#6bf46f] to-[#239d2d] text-white'
                        : isWrongSelection
                          ? 'border-[#ffd0ca] bg-gradient-to-b from-[#ff897f] to-[#db3f35] text-white opacity-95'
                          : 'border-[#e4cf9d] bg-gradient-to-b from-[#dcc598] to-[#c6aa73] text-[#5d4120] opacity-80'
                  } ${answerState !== 'idle' ? 'cursor-default' : ''}`}
                  disabled={answersLocked}
                  key={`${question.id}-${option}`}
                  onClick={() => onSelectOption(index)}
                  type="button"
                >
                  <span className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-90">{ui.optionLabel} {index + 1}</span>
                  <span className="mt-1 block font-display text-[28px] leading-tight sm:text-[34px]">{option}</span>
                </button>
              )
            })}
          </div>

          {answerState !== 'idle' ? (
            <div className={`mt-4 rounded-[22px] border-[4px] px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ${
              answerState === 'correct'
                ? 'border-[#4e9a29] bg-gradient-to-b from-[#d8ffc8] to-[#8fe263] text-[#19470c]'
                : 'border-[#b04736] bg-gradient-to-b from-[#ffe0d6] to-[#ffb098] text-[#6a1d12]'
            }`}>
              <p className="font-display text-[28px] uppercase leading-none sm:text-[34px]">
                {ui.resultLabel[answerState]}
              </p>
              <p className="mt-1 text-sm font-black uppercase tracking-[0.12em]">{ui.feedbackCopy[answerState]}</p>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  )
}
