import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppSettingsStore } from '../store/app-settings-store'
import { usePlayerProfile } from './use-player-profile'

export type SoundEffectId =
  | 'button'
  | 'capture'
  | 'correct'
  | 'experience'
  | 'icon'
  | 'gameStart'
  | 'incorrect'
  | 'podium'
  | 'winner'

const soundEffectPathById: Record<SoundEffectId, string> = {
  button: '/sonidos-juego/Botones.mp3',
  capture: '/sonidos-juego/ComerFicha.mp3',
  correct: '/sonidos-juego/RespuestaCorrecta.mp3',
  experience: '/sonidos-juego/Experiencia.mp3',
  icon: '/sonidos-juego/Icono.mp3',
  gameStart: '/sonidos-juego/Inicio.mp3',
  incorrect: '/sonidos-juego/RespuestaIncorrecta.mp3',
  podium: '/sonidos-juego/Podios.mp3',
  winner: '/sonidos-juego/Ganadores.mp3',
}

const audioCache = new Map<SoundEffectId, HTMLAudioElement>()
let introAudio: HTMLAudioElement | null = null
let splashAudio: HTMLAudioElement | null = null

const gameplaySoundIds: SoundEffectId[] = ['capture', 'correct', 'experience', 'incorrect', 'podium', 'winner']

const createAudio = (soundId: SoundEffectId) => {
  const audio = new Audio(soundEffectPathById[soundId])
  audio.preload = 'auto'
  return audio
}

const getIntroAudio = () => {
  if (!introAudio) {
    introAudio = createAudio('gameStart')
    introAudio.loop = true
  }

  return introAudio
}

const getSplashAudio = () => {
  if (!splashAudio) {
    splashAudio = createAudio('icon')
    splashAudio.loop = true
  }

  return splashAudio
}

export const playSoundEffect = (soundId: SoundEffectId) => {
  if (typeof window === 'undefined') {
    return
  }

  if (!useAppSettingsStore.getState().soundEnabled) {
    return
  }

  const cachedAudio = audioCache.get(soundId) || createAudio(soundId)
  audioCache.set(soundId, cachedAudio)

  try {
    cachedAudio.pause()
    cachedAudio.currentTime = 0
    void cachedAudio.play().catch(() => undefined)
  } catch {
    const fallbackAudio = createAudio(soundId)
    audioCache.set(soundId, fallbackAudio)
    void fallbackAudio.play().catch(() => undefined)
  }
}

export const stopSoundEffect = (soundId: SoundEffectId) => {
  const audio = audioCache.get(soundId)

  if (!audio) {
    return
  }

  audio.pause()
  audio.currentTime = 0
}

export const stopGameplaySoundEffects = () => {
  gameplaySoundIds.forEach((soundId) => {
    stopSoundEffect(soundId)
  })
}

export const playIntroSoundtrack = () => {
  if (typeof window === 'undefined' || !useAppSettingsStore.getState().soundEnabled) {
    return
  }

  const audio = getIntroAudio()

  if (!audio.paused) {
    return
  }

  void audio.play().catch(() => undefined)
}

export const playSplashSoundtrack = () => {
  if (typeof window === 'undefined' || !useAppSettingsStore.getState().soundEnabled) {
    return
  }

  const audio = getSplashAudio()

  if (!audio.paused) {
    return
  }

  void audio.play().catch(() => undefined)
}

export const stopIntroSoundtrack = () => {
  if (!introAudio) {
    return
  }

  introAudio.pause()
  introAudio.currentTime = 0
}

export const stopSplashSoundtrack = () => {
  if (!splashAudio) {
    return
  }

  splashAudio.pause()
  splashAudio.currentTime = 0
}

export function useGlobalButtonSound() {
  const soundEnabled = useAppSettingsStore((state) => state.soundEnabled)

  useEffect(() => {
    if (!soundEnabled) {
      return
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const clickable = target.closest('button, [role="button"], a[href], input[type="button"], input[type="submit"]')

      if (!clickable || clickable.hasAttribute('data-no-ui-sound')) {
        return
      }

      playSoundEffect('button')
    }

    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [soundEnabled])
}

export function useRouteIntroSoundtrack() {
  const location = useLocation()

  useEffect(() => {
    stopSplashSoundtrack()

    const isMatchRoute = location.pathname === '/board' || location.pathname === '/board-mock'

    if (isMatchRoute) {
      stopIntroSoundtrack()
      return
    }

    stopGameplaySoundEffects()
    playIntroSoundtrack()
  }, [location.pathname])
}

export function useSplashIntroSoundtrack(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      stopSplashSoundtrack()
      return
    }

    stopIntroSoundtrack()
    playSplashSoundtrack()

    return () => {
      stopSplashSoundtrack()
    }
  }, [enabled])
}

export function useProfileExperienceSound() {
  const profile = usePlayerProfile()
  const initializedRef = useRef(false)
  const previousXpRef = useRef(profile.xp)
  const previousLevelRef = useRef(profile.level)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      previousXpRef.current = profile.xp
      previousLevelRef.current = profile.level
      return
    }

    const gainedXp = profile.level > previousLevelRef.current || profile.xp > previousXpRef.current

    if (gainedXp) {
      playSoundEffect('experience')
    }

    previousXpRef.current = profile.xp
    previousLevelRef.current = profile.level
  }, [profile.level, profile.xp])
}
