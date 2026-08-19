import { useStudio } from '../StudioContext'

/** One header for every full-screen step, so Back always sits in the same place
 *  and reads the same. `count` shows a running total beside the title. */
export default function StepHeader({ title, count, back = 'hub', backLabel = 'Apps', right }) {
  const { switchStep } = useStudio()
  return (
    <div className="flex items-center gap-3 mb-5">
      <button
        onClick={() => switchStep(back)}
        className="h-10 px-4 rounded-full glass-panel flex items-center gap-2 text-ink/80 hover:bg-ink/[0.06] transition active:scale-95 shrink-0"
      >
        <i className="fa-solid fa-arrow-left text-xs" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{backLabel}</span>
      </button>
      <h2 className="text-sm font-black tracking-tight text-ink truncate">
        {title}
        {count != null && <span className="text-ink/45 font-bold"> · {count}</span>}
      </h2>
      {right && <div className="ml-auto shrink-0">{right}</div>}
    </div>
  )
}
