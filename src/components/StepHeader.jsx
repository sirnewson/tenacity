import { useStudio } from '../StudioContext'

/** One header for every full-screen step: a glass back pill on its own row and
 *  an iOS-style large title under it, so Back always sits in the same place and
 *  the screen names itself without a second heading. */
export default function StepHeader({ title, count, back = 'hub', backLabel = 'Apps', right }) {
  const { switchStep } = useStudio()
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => switchStep(back)}
          className="btn-glass h-10 px-4 flex items-center gap-2 text-ink/80 shrink-0"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">{backLabel}</span>
        </button>
        {right && <div className="ml-auto shrink-0">{right}</div>}
      </div>
      <h2 className="text-[28px] font-semibold tracking-tight text-ink mt-5 leading-none">
        {title}
        {count != null && <span className="text-grey"> {count}</span>}
      </h2>
    </div>
  )
}
