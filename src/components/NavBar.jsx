import { useStudio } from '../StudioContext'
import { brand } from '../brand'

/** The bar along the bottom: home, then one tab per studio. It is how you get
 *  between the tools without walking back through a screen you already
 *  finished, so it stays put on every step that is not a full-bleed workspace.
 *
 *  Hidden while the camera or the reveal owns the screen — those need the
 *  thumb space, and both already end somewhere this bar is showing again. */
const HIDDEN_ON = ['camera', 'result', 'batch']

export default function NavBar() {
  const { step, switchStep, goHome } = useStudio()
  const apps = (brand.apps || []).filter((a) => a.screen || a.kind === 'native')
    .filter((a) => !a.soon) // a placeholder has nowhere to go
  if (!brand.suite?.enabled || HIDDEN_ON.includes(step)) return null

  const tabs = [
    { id: 'hub', label: 'Home', icon: 'fa-house', onClick: goHome, on: step === 'hub' },
    ...apps.map((a) => {
      const screen = a.screen || 'select'
      return {
        id: a.id,
        label: a.name.replace(/\s*studio\s*/i, '') || a.name,
        icon: a.icon,
        tint: a.tint,
        onClick: () => switchStep(screen),
        on: step === screen,
      }
    }),
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[80] px-4 pointer-events-none"
      style={{ paddingBottom: 'calc(0.6rem + var(--safe-bottom))' }}
    >
      <div className="glass-panel glass-glow intro-bar pointer-events-auto mx-auto flex max-w-sm items-center gap-1 rounded-full p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={t.onClick}
            aria-current={t.on ? 'page' : undefined}
            className={`flex-1 h-11 rounded-full flex items-center justify-center gap-2 transition-all duration-300 ${
              t.on ? 'bg-ink text-surface' : 'text-ink/55 hover:text-ink'
            }`}
          >
            <i
              className={`fa-solid ${t.icon} text-[13px]`}
              style={t.on || !t.tint ? undefined : { color: t.tint }}
            />
            <span className="text-[11px] font-semibold tracking-tight">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
