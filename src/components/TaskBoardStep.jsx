import { useEffect, useState } from 'react'
import StepHeader from './StepHeader'
import { useStudio } from '../StudioContext'
import { STATUSES, addTask, loadWorkspace, removeTask, setTaskStatus, tasksFor } from '../workspace'

/** Everything the rooms turned into work. A task carries where it came from,
 *  so nobody has to go back through the thread to find out why it exists. */
export default function TaskBoardStep() {
  const s = useStudio()
  const active = s.step === 'tasks'
  const [tasks, setTasks] = useState([])
  const [rooms, setRooms] = useState([])
  const [draft, setDraft] = useState('')

  const refresh = () => {
    setTasks(tasksFor())
    setRooms(loadWorkspace().rooms)
  }

  useEffect(() => {
    if (active) refresh()
  }, [active])

  const roomName = (id) => rooms.find((r) => r.id === id)?.name || 'No room'

  const advance = (t) => {
    const i = STATUSES.indexOf(t.status)
    setTaskStatus(t.id, STATUSES[Math.min(i + 1, STATUSES.length - 1)])
    refresh()
  }

  const add = () => {
    const title = draft.trim()
    if (!title) return
    addTask({ roomId: rooms[0]?.id, title, from: 'manual' })
    setDraft('')
    refresh()
  }

  return (
    <main
      className={`step-container flex-col h-full w-full relative z-20 app-bg overflow-y-auto no-scrollbar ${
        active ? 'flex' : 'hidden'
      }`}
      style={{
        paddingTop: 'calc(1rem + var(--safe-top))',
        paddingBottom: 'calc(2rem + var(--safe-bottom))',
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-4">
        <StepHeader
          title="Task Board"
          count={tasks.length}
          right={
            <button
              onClick={() => s.switchStep('room')}
              className="h-8 px-3 rounded-full glass-panel flex items-center gap-1.5 text-ink/70 hover:text-ink transition"
            >
              <i className="fa-solid fa-comments text-[10px]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Room</span>
            </button>
          }
        />

        <div className="flex gap-2 mb-5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add a job…"
            className="flex-1 field rounded-full px-4 py-3 text-[13px] text-ink outline-none"
          />
          <button
            onClick={add}
            disabled={!draft.trim()}
            className="px-5 rounded-full bg-brand-500 text-panel font-black text-[11px] uppercase tracking-wider disabled:opacity-35 active:scale-95 transition"
          >
            Add
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <i className="fa-solid fa-list-check text-3xl text-ink/25 mb-4" />
            <p className="text-sm font-bold text-ink">No jobs yet</p>
            <p className="text-[12px] text-ink/55 leading-relaxed mt-2">
              In a room, tap <span className="font-bold">Task</span> on any message and it lands
              here with the deadline it mentioned.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {STATUSES.map((status) => {
              const list = tasks.filter((t) => t.status === status)
              if (!list.length) return null
              return (
                <section key={status}>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-ink/40 mb-2 px-1">
                    {status} · {list.length}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {list.map((t) => (
                      <div key={t.id} className="glass-panel rounded-xl p-3.5 flex items-start gap-3">
                        <button
                          onClick={() => advance(t)}
                          className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                            t.status === 'Done'
                              ? 'border-brand-500 bg-brand-500 text-panel'
                              : 'border-ink/25 hover:border-brand-500'
                          }`}
                          aria-label="Move on"
                        >
                          {t.status === 'Done' && <i className="fa-solid fa-check text-[9px]" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-[13px] leading-snug ${
                              t.status === 'Done' ? 'text-ink/45 line-through' : 'text-ink'
                            }`}
                          >
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-ink/45 font-bold">
                              {roomName(t.roomId)}
                            </span>
                            {t.due && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink/5 text-ink/60 font-bold">
                                {t.due}
                              </span>
                            )}
                            <span className="text-[10px] text-ink/35">
                              {t.from === 'message'
                                ? 'from a message'
                                : t.from === 'approval'
                                ? 'from an approval'
                                : 'added by hand'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            removeTask(t.id)
                            refresh()
                          }}
                          className="shrink-0 text-ink/35 hover:text-red-500 transition"
                          aria-label="Delete"
                        >
                          <i className="fa-solid fa-trash text-[11px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
