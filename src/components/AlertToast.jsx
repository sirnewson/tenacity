import { useStudio } from '../StudioContext'

export default function AlertToast() {
  const { alert } = useStudio()
  const { msg, isError, visible } = alert

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 glass-panel text-white px-6 py-3 rounded-full shadow-lg z-[150] text-sm font-semibold flex items-center gap-3 w-max max-w-[90vw] transition-all duration-300 ${
        isError
          ? 'border-red-500/30 bg-red-500/10'
          : 'border-brand-500/30 bg-brand-500/10'
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'}`}
      style={{ top: 'calc(1.5rem + var(--safe-top))' }}
    >
      <i
        className={`text-lg ${
          isError
            ? 'fa-solid fa-circle-exclamation text-red-400'
            : 'fa-solid fa-circle-check text-brand-400'
        }`}
      />
      <span>{msg}</span>
    </div>
  )
}
