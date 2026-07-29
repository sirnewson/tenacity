import { useEffect, useState } from 'react'
import { LOGO_URL } from '../constants'

export default function SplashScreen() {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 2000)
    const t2 = setTimeout(() => setGone(true), 2700)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (gone) return null

  return (
    <div
      className={`fixed inset-0 z-[200] bg-dark-950 flex flex-col items-center justify-center transition-opacity duration-700 ease-out ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center justify-center">
        <div className="absolute -inset-4 bg-brand-500 blur-[80px] opacity-20 rounded-full w-40 h-40 m-auto animate-pulse" />
        <img
          src={LOGO_URL}
          alt="Tenacity Logo"
          className="h-20 sm:h-28 brightness-0 invert object-contain animate-pulse-logo relative z-10"
        />
        <h1 className="text-xl font-black tracking-tight drop-shadow-lg text-white mt-6 relative z-10 animate-fade-in delay-200">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-brand-600">
            Creator
          </span>{' '}
          Studio
        </h1>
        <div className="mt-8 flex gap-3 relative z-10 animate-fade-in delay-400">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.15s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  )
}
