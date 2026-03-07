import { useEffect, useState } from 'react'
import { useControllerWallet } from '../../lib/starknet/use-controller-wallet'

type ParquizSplashScreenProps = {
  onEnterHome: () => void
}

const LOGO_READY_MS = 1650
const EXIT_MS = 440
const PARQUIZ_LOGO_PATH = '/parquiz-logo.png'
const LOGIN_BUTTON_PATH = '/login-button.png'

export function ParquizSplashScreen({ onEnterHome }: ParquizSplashScreenProps) {
  const [isReady, setIsReady] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [loginRequested, setLoginRequested] = useState(false)

  const { isConnected, isPending, canConnectController, connectController } = useControllerWallet()

  useEffect(() => {
    const readyTimer = window.setTimeout(() => {
      setIsReady(true)
    }, LOGO_READY_MS)

    return () => {
      window.clearTimeout(readyTimer)
    }
  }, [])

  useEffect(() => {
    if (!isExiting) {
      return
    }

    const leaveTimer = window.setTimeout(() => {
      onEnterHome()
    }, EXIT_MS)

    return () => {
      window.clearTimeout(leaveTimer)
    }
  }, [isExiting, onEnterHome])

  useEffect(() => {
    if (!loginRequested || !isConnected || isExiting) {
      return
    }

    const exitTimer = window.setTimeout(() => {
      setIsExiting(true)
    }, 0)

    return () => {
      window.clearTimeout(exitTimer)
    }
  }, [isConnected, isExiting, loginRequested])

  const handleLogin = () => {
    if (!isReady || isExiting) {
      return
    }

    setLoginRequested(true)

    if (isConnected) {
      setIsExiting(true)
      return
    }

    if (canConnectController) {
      connectController()
    }
  }

  return (
    <section className={`parquiz-splash ${isExiting ? 'parquiz-splash--exit' : ''}`}>
      <span className="parquiz-splash__halo parquiz-splash__halo--left" />
      <span className="parquiz-splash__halo parquiz-splash__halo--right" />
      <span className="parquiz-splash__particle parquiz-splash__particle--a" />
      <span className="parquiz-splash__particle parquiz-splash__particle--b" />
      <span className="parquiz-splash__particle parquiz-splash__particle--c" />
      <span className="parquiz-splash__particle parquiz-splash__particle--d" />

      <div className="parquiz-splash__logo-stage">
        <img alt="ParQuiz" className="parquiz-splash__logo-image" src={PARQUIZ_LOGO_PATH} />

        <div className={`parquiz-splash__play-wrap ${isReady ? 'parquiz-splash__play-wrap--visible' : ''}`}>
          <button
            className="parquiz-splash__play-button"
            aria-label="Log in"
            disabled={!isReady || isExiting || isPending || (!canConnectController && !isConnected)}
            onClick={handleLogin}
            type="button"
          >
            <img alt="" className="parquiz-splash__play-image" src={LOGIN_BUTTON_PATH} />
          </button>
        </div>
      </div>
    </section>
  )
}
