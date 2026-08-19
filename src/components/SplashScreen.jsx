import { useEffect, useState } from 'react'
import BrandLogo from './BrandLogo'
import { brand, logoTintClass, LOGO_URL } from '../brand'

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
      className={`fixed inset-0 z-[200] app-bg flex flex-col items-center justify-center transition-opacity duration-700 ease-out ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center justify-center">
        <div className="absolute -inset-4 bg-panel blur-[80px] opacity-60 rounded-full w-40 h-40 m-auto animate-pulse" />
        <BrandLogo className="h-20 sm:h-28 animate-pulse-logo relative z-10" />
        <h1 className="text-xl font-black tracking-tight drop-shadow-lg text-ink mt-6 relative z-10 animate-fade-in delay-200">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-brand-500">
            {brand.headline}
          </span>{' '}
          {brand.headlineSuffix}
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
