import { useEffect, useState } from 'react'
import StepHeader from './StepHeader'
import { useStudio } from '../StudioContext'

/** Ideas as they happen — on the shop floor, in the car, mid-shoot.
 *  Kept on the device, no account, no sync to wait for. */
const KEY = 'yxm.notes'

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}
const persist = (notes) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes))
  } catch {
    /* storage full or blocked — the list still works for this session */
  }
}

const when = (ts) => {
  const d = new Date(ts)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function NotesStep() {
  const s = useStudio()
  const active = s.step === 'notes'
  const [notes, setNotes] = useState([])
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (active) setNotes(load())
  }, [active])

  const commit = (next) => {
    setNotes(next)
    persist(next)
  }

  const add = () => {
    const text = draft.trim()
    if (!text) return
    commit([{ id: `${Date.now()}`, text, ts: Date.now() }, ...notes])
    setDraft('')
  }

  const update = (id, text) => commit(notes.map((n) => (n.id === id ? { ...n, text } : n)))
  const remove = (id) => commit(notes.filter((n) => n.id !== id))

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      s.showMessage('Note copied.', false)
    } catch {
      s.showMessage('Could not reach the clipboard.', true)
    }
  }

  const shown = query.trim()
    ? notes.filter((n) => n.text.toLowerCase().includes(query.trim().toLowerCase()))
    : notes

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
        <StepHeader title="Notes" count={notes.length} />

        <div className="glass-panel rounded-2xl p-3 mb-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) add()
            }}
            placeholder="An idea, a product to shoot, a caption line…"
            rows={3}
            className="w-full bg-transparent text-ink text-[13px] leading-relaxed outline-none resize-none placeholder:text-ink/35"
          />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-ink/35 font-medium">Ctrl + Enter to add</span>
            <button
              onClick={add}
              disabled={!draft.trim()}
              className="ml-auto px-5 py-2.5 rounded-full bg-brand-500 text-panel font-black text-[11px] uppercase tracking-wider disabled:opacity-40 active:scale-95 transition"
            >
              Add note
            </button>
          </div>
        </div>

        {notes.length > 3 && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes"
            className="w-full field rounded-full px-4 py-2.5 text-ink text-[12.5px] outline-none mb-4"
          />
        )}

        {shown.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <i className="fa-solid fa-lightbulb text-3xl text-ink/25 mb-4" />
            <p className="text-sm font-bold text-ink">
              {notes.length ? 'Nothing matches that' : 'No notes yet'}
            </p>
            <p className="text-[12px] text-ink/55 leading-relaxed mt-2">
              {notes.length
                ? 'Try another word.'
                : 'Jot the idea now — the shot list, the offer, the line you thought of on the way in.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {shown.map((n) => (
              <div key={n.id} className="glass-panel rounded-2xl p-4">
                {editing === n.id ? (
                  <textarea
                    autoFocus
                    value={n.text}
                    onChange={(e) => update(n.id, e.target.value)}
                    onBlur={() => setEditing(null)}
                    rows={4}
                    className="w-full bg-transparent text-ink text-[13px] leading-relaxed outline-none resize-none"
                  />
                ) : (
                  <p
                    onClick={() => setEditing(n.id)}
                    className="text-[13px] text-ink leading-relaxed whitespace-pre-wrap cursor-text"
                  >
                    {n.text}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[10px] text-ink/40 font-medium">{when(n.ts)}</span>
                  <button
                    onClick={() => copy(n.text)}
                    className="ml-auto text-ink/45 hover:text-ink transition"
                    aria-label="Copy note"
                  >
                    <i className="fa-solid fa-copy text-[11px]" />
                  </button>
                  <button
                    onClick={() => setEditing(n.id)}
                    className="text-ink/45 hover:text-ink transition"
                    aria-label="Edit note"
                  >
                    <i className="fa-solid fa-pen text-[11px]" />
                  </button>
                  <button
                    onClick={() => remove(n.id)}
                    className="text-ink/45 hover:text-red-500 transition"
                    aria-label="Delete note"
                  >
                    <i className="fa-solid fa-trash text-[11px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-ink/45 leading-relaxed mt-6 text-center">
          <i className="fa-solid fa-lock mr-1.5" />
          Notes stay on this device.
        </p>
      </div>
    </main>
  )
}
