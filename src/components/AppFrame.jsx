import { useRef } from 'react'
import { useStudio } from '../StudioContext'
import { initFrame, paintFrame } from '../appTheme'
import { brand } from '../brand'

/** Hosts a bundled single-file app full screen with a slim bar to get back.
 *  Each app ships as its own public/apps/<id>/index.html, so it keeps working
 *  exactly as it does standalone and can be updated by dropping in a new file. */
export default function AppFrame() {
  const { step, activeApp, closeApp, brandVersion } = useStudio()
  const frameRef = useRef(null)
  const app = (brand.apps || []).find((a) => a.id === activeApp)
  if (step !== 'app' || !app) return null

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-surface">
      <div
        className="shrink-0 flex items-center gap-3 px-3 pb-2 border-b border-ink/10 bg-surface"
        style={{ paddingTop: 'calc(0.6rem + var(--safe-top))' }}
      >
        <button
          onClick={closeApp}
          className="h-9 px-3.5 rounded-full glass-panel flex items-center gap-2 text-ink/80 hover:bg-ink/[0.06] transition active:scale-95"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Apps</span>
        </button>
        <span className="flex items-center gap-2 min-w-0">
          <i className={`fa-solid ${app.icon} text-[13px]`} style={{ color: app.tint }} />
          <span className="text-[12px] font-black text-ink truncate">{app.name}</span>
        </span>
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto h-9 w-9 rounded-full glass-panel flex items-center justify-center text-ink/60 hover:text-ink transition"
          title="Open in a new tab"
        >
          <i className="fa-solid fa-up-right-from-square text-xs" />
        </a>
      </div>

      <iframe
        ref={frameRef}
        key={`${app.id}-${brandVersion}`}
        onLoad={() => {
          paintFrame(frameRef.current, app.id, brand.colors[500], brand.theme !== 'dark')
          initFrame(frameRef.current, app.id)
        }}
        src={app.url}
        title={app.name}
        className="flex-1 w-full border-0"
        style={{ background: brand.theme === 'dark' ? '#0b0b0f' : '#ffffff' }}
        allow="camera; microphone; clipboard-write; fullscreen"
      />
    </div>
  )
}
