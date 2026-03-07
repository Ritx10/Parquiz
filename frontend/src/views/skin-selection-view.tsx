import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameAvatar } from '../components/game/game-avatar'
import { getStarterPlayerSkins } from '../lib/player-skins'
import { useAppSettingsStore } from '../store/app-settings-store'

const copy = {
  es: {
    title: 'ELIGE TU PERSONAJE',
    subtitle: 'Selecciona tu skin gratuita para comenzar a jugar',
    continue: 'CONTINUAR',
    selected: 'Seleccionada',
    free: 'Capi gratuita',
    ready: 'lista para jugar.',
  },
  en: {
    title: 'CHOOSE YOUR CHARACTER',
    subtitle: 'Select your free starter skin to begin playing',
    continue: 'CONTINUE',
    selected: 'Selected',
    free: 'Free capi skin',
    ready: 'is ready to play.',
  },
} as const

export function SkinSelectionView() {
  const navigate = useNavigate()
  const language = useAppSettingsStore((state) => state.language)
  const persistedSkinId = useAppSettingsStore((state) => state.selectedSkinId)
  const setSelectedSkinId = useAppSettingsStore((state) => state.setSelectedSkinId)
  const [selectedSkinId, setLocalSelectedSkinId] = useState<null | string>(persistedSkinId)
  const starterSkins = useMemo(() => getStarterPlayerSkins(), [])
  const ui = copy[language]

  useEffect(() => {
    if (persistedSkinId) {
      navigate('/', { replace: true })
    }
  }, [navigate, persistedSkinId])

  const selectedSkin = useMemo(
    () => starterSkins.find((skin) => skin.id === selectedSkinId) || null,
    [selectedSkinId, starterSkins],
  )

  const handleContinue = () => {
    if (!selectedSkinId) {
      return
    }

    setSelectedSkinId(selectedSkinId)
    navigate('/', { replace: true })
  }

  return (
    <section
      className="relative isolate min-h-screen overflow-hidden px-4 pb-10 pt-6 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/home-background.jpg')",
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(34,18,9,0.24)_0%,rgba(24,12,7,0.34)_48%,rgba(17,9,6,0.48)_100%)]" />
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,238,190,0.24),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(15,8,5,0.42),transparent_58%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto w-fit rounded-[24px] border-[4px] border-[#8f562f] bg-gradient-to-b from-[#b77445] via-[#915731] to-[#6d4327] px-8 py-3 shadow-[inset_0_1px_0_rgba(255,225,189,0.66),0_6px_0_rgba(102,58,29,0.88)] sm:px-12">
          <h1 className="font-display text-center text-[34px] uppercase tracking-wide text-[#ffeac2] sm:text-[52px]">
            {ui.title}
          </h1>
        </div>

        <p className="mt-5 text-center text-lg font-bold text-[#fff0d0] drop-shadow-[0_2px_8px_rgba(27,12,5,0.6)] sm:text-2xl">
          {ui.subtitle}
        </p>

        <div className="mx-auto mt-7 rounded-[34px] border-[4px] border-[#744225] bg-gradient-to-b from-[#a86a3d] via-[#8d5936] to-[#6a4228] p-3 shadow-[inset_0_4px_0_rgba(255,212,156,0.5),0_14px_30px_rgba(57,28,9,0.36)] sm:p-4">
          <div className="rounded-[28px] border-[3px] border-[#d1ab78] bg-gradient-to-b from-[#fff7ea] to-[#f3e8d6] p-4 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {starterSkins.map((skin, index) => {
                const isSelected = skin.id === selectedSkinId

                return (
                  <button
                    className={`group relative rounded-[26px] border-[3px] p-4 text-left transition-all duration-300 ${
                      isSelected
                        ? 'border-[#f4d168] bg-gradient-to-b from-[#fff6d7] to-[#f7e3af] shadow-[0_0_0_4px_rgba(255,220,104,0.35),0_14px_26px_rgba(62,34,10,0.26)]'
                        : 'border-[#d7b889] bg-gradient-to-b from-[#fff8e8] to-[#f3dfba] shadow-[0_8px_18px_rgba(42,23,10,0.18)] hover:-translate-y-1 hover:shadow-[0_14px_24px_rgba(42,23,10,0.24)]'
                    } ${isSelected ? 'animate-[skinPulse_1.8s_ease-in-out_infinite]' : ''}`}
                    key={skin.id}
                    onClick={() => setLocalSelectedSkinId(skin.id)}
                    style={{ animationDelay: `${index * 140}ms` }}
                    type="button"
                  >
                    <span className="absolute right-3 top-3 rounded-full border border-[#b98236] bg-gradient-to-b from-[#ffe28f] to-[#f3b949] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#5f3817] shadow-[inset_0_1px_0_rgba(255,250,210,0.7)]">
                      {isSelected ? ui.selected : ui.free}
                    </span>

                    <div className={`rounded-[22px] border-2 p-4 transition-transform duration-300 ${
                      isSelected
                        ? 'border-[#f1d36e] bg-[radial-gradient(circle_at_50%_35%,rgba(255,251,225,0.95),rgba(255,226,148,0.68)_60%,rgba(240,195,99,0.28)_100%)] shadow-[0_0_28px_rgba(255,214,102,0.35)]'
                        : 'border-[#ead6b3] bg-[radial-gradient(circle_at_50%_35%,rgba(255,251,225,0.95),rgba(255,240,210,0.7)_60%,rgba(234,213,174,0.24)_100%)] group-hover:scale-[1.03]'
                    }`}>
                      <div className={`mx-auto flex h-[180px] w-[180px] items-center justify-center rounded-full border-[4px] ${
                        isSelected
                          ? 'border-[#f2cf62] bg-gradient-to-b from-[#fff8e1] to-[#ffe7a9] shadow-[0_0_24px_rgba(255,209,94,0.3)]'
                          : 'border-[#c89967] bg-gradient-to-b from-[#fff4da] to-[#edd3a9]'
                      } ${isSelected ? 'animate-[skinBounce_580ms_ease-out]' : 'animate-[skinFloat_4.8s_ease-in-out_infinite]'} overflow-hidden p-4`}>
                        <GameAvatar
                          alt={skin.name}
                          avatar={skin.src}
                          imageClassName="h-full w-full object-contain drop-shadow-[0_12px_16px_rgba(82,45,16,0.24)]"
                        />
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <p className="font-display text-[26px] uppercase tracking-wide text-[#5a3417]">{skin.name}</p>
                      <p className="mt-1 text-sm font-black uppercase tracking-[0.16em] text-[#91633d]">{skin.subtitle}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-7 flex flex-col items-center gap-4">
              <div className="min-h-[24px] text-center text-base font-bold text-[#734722] sm:text-lg">
                {selectedSkin ? `${selectedSkin.name} ${ui.ready}` : ''}
              </div>

              <button
                className={`rounded-full border-[4px] px-12 py-3 font-display text-[28px] uppercase tracking-wide text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.55),0_8px_0_rgba(38,95,22,0.9)] transition ${
                  selectedSkinId
                    ? 'border-[#2a6719] bg-gradient-to-b from-[#73df58] to-[#3f9f22] hover:brightness-105'
                    : 'cursor-not-allowed border-[#8b8f95] bg-gradient-to-b from-[#c6c9cf] to-[#949aa5] shadow-[inset_0_2px_0_rgba(255,255,255,0.42),0_8px_0_rgba(95,101,110,0.9)] opacity-75'
                }`}
                disabled={!selectedSkinId}
                onClick={handleContinue}
                type="button"
              >
                {ui.continue}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes skinFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes skinBounce {
          0% { transform: scale(0.92); }
          55% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }

        @keyframes skinPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(255,220,104,0.2), 0 14px 26px rgba(62,34,10,0.26); }
          50% { box-shadow: 0 0 0 7px rgba(255,220,104,0.32), 0 18px 30px rgba(62,34,10,0.32); }
        }
      `}</style>
    </section>
  )
}
