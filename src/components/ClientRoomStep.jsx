import { useEffect, useRef, useState } from 'react'
import StepHeader from './StepHeader'
import { useStudio } from '../StudioContext'
import { brand } from '../brand'
import {
  MENTIONS,
  addRoom,
  addTask,
  loadWorkspace,
  messagesFor,
  readMessage,
  removeRoom,
  sendMessage,
  setApproval,
  tasksFor,
} from '../workspace'

/** The room: one thread per client, holding the conversation, the files and
 *  the approvals. What makes it different from a chat app is that the room
 *  reads what is said — a price, a deadline, a tool mention — and offers to
 *  turn it into work without anyone re-typing it. */
export default function ClientRoomStep() {
  const s = useStudio()
  const active = s.step === 'room'
  const [rooms, setRooms] = useState([])
  const [roomId, setRoomId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [voice, setVoice] = useState('client')
  const [newRoom, setNewRoom] = useState('')
  const endRef = useRef(null)
  const fileRef = useRef(null)

  const refresh = (id = roomId) => {
    const ws = loadWorkspace()
    setRooms(ws.rooms)
    if (id) setMessages(messagesFor(id))
  }

  useEffect(() => {
    if (!active) return
    const ws = loadWorkspace()
    setRooms(ws.rooms)
    const first = roomId || ws.rooms[0]?.id
    setRoomId(first)
    if (first) setMessages(messagesFor(first))
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, roomId])

  const room = rooms.find((r) => r.id === roomId)

  const send = (extra = {}) => {
    const text = draft.trim()
    if (!text && !extra.image) return
    sendMessage(roomId, { text, from: voice, ...extra })
    setDraft('')
    refresh()
  }

  const attach = (file) => {
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      s.showMessage('That file is over 3MB — send a smaller one.', true)
      return
    }
    const r = new FileReader()
    r.onload = (e) => {
      sendMessage(roomId, {
        text: draft.trim(),
        from: voice,
        image: String(e.target.result),
        // anything the team sends back is something the client can sign off
        kind: voice === 'team' ? 'design' : undefined,
      })
      setDraft('')
      refresh()
    }
    r.readAsDataURL(file)
  }

  const makeTask = (msg) => {
    const read = readMessage(msg.text)
    addTask({
      roomId,
      title: msg.text.slice(0, 90) || 'Follow up on the attachment',
      due: read.due,
      from: 'message',
    })
    s.showMessage('Added to the task board.', false)
    refresh()
  }

  const openTool = (mention) => {
    if (mention.app) s.openApp(mention.app)
    else if (mention.step) s.switchStep(mention.step)
  }

  const taskCount = roomId ? tasksFor(roomId).length : 0

  return (
    <main
      className={`step-container flex-col h-full w-full relative z-20 app-bg ${
        active ? 'flex' : 'hidden'
      }`}
      style={{ paddingTop: 'calc(1rem + var(--safe-top))' }}
    >
      <div className="w-full max-w-2xl mx-auto px-4 flex flex-col min-h-0 flex-1">
        <StepHeader
          title={room ? room.name : 'Client Room'}
          right={
            <button
              onClick={() => s.switchStep('tasks')}
              className="h-8 px-3 rounded-full glass-panel flex items-center gap-1.5 text-ink/70 hover:text-ink transition"
            >
              <i className="fa-solid fa-list-check text-[10px]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{taskCount}</span>
            </button>
          }
        />

        {/* rooms */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 shrink-0">
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setRoomId(r.id)
                setMessages(messagesFor(r.id))
              }}
              className={`shrink-0 px-3.5 h-9 rounded-full border text-[11.5px] font-bold transition ${
                r.id === roomId
                  ? 'border-brand-500 bg-brand-500/12 text-ink'
                  : 'border-ink/10 text-ink/55 hover:border-ink/30'
              }`}
            >
              {r.name}
            </button>
          ))}
          <div className="shrink-0 flex items-center gap-1">
            <input
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newRoom.trim()) {
                  const r = addRoom({ name: newRoom.trim(), tint: brand.colors[500] })
                  setNewRoom('')
                  setRoomId(r.id)
                  refresh(r.id)
                  setMessages(messagesFor(r.id))
                }
              }}
              placeholder="New room"
              className="w-24 h-9 field rounded-full px-3 text-[11.5px] text-ink outline-none"
            />
          </div>
        </div>

        {/* thread */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-2.5 pb-3">
          {messages.map((m) => {
            const mine = m.from === 'team'
            const read = readMessage(m.text)
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    mine
                      ? 'bg-brand-500/12 border border-brand-500/25'
                      : 'glass-panel'
                  }`}
                >
                  <span className="block text-[9px] font-black uppercase tracking-widest text-ink/40 mb-1">
                    {m.author}
                  </span>
                  {m.image && (
                    <img
                      src={m.image}
                      alt=""
                      className="rounded-lg mb-2 max-h-52 w-auto border border-ink/10"
                    />
                  )}
                  {m.text && (
                    <p className="text-[13px] text-ink leading-relaxed whitespace-pre-wrap">
                      {m.text}
                    </p>
                  )}

                  {/* what the room understood */}
                  {(read.actionable || m.kind === 'design') && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-ink/10">
                      {read.offer && (
                        <span className="px-2 py-1 rounded-full bg-ink/5 text-[10px] font-bold text-ink/70">
                          {brand.currency} {read.offer.was} → {read.offer.now}
                        </span>
                      )}
                      {read.due && (
                        <span className="px-2 py-1 rounded-full bg-ink/5 text-[10px] font-bold text-ink/70">
                          <i className="fa-solid fa-clock mr-1" />
                          {read.due}
                        </span>
                      )}
                      {read.mentions.map((mt) => (
                        <button
                          key={mt.tag}
                          onClick={() => openTool(mt)}
                          className="px-2.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-[10px] font-black text-ink transition active:scale-95"
                        >
                          <i className={`fa-solid ${mt.icon} mr-1`} />
                          Open {mt.tool}
                        </button>
                      ))}
                      <button
                        onClick={() => makeTask(m)}
                        className="px-2.5 py-1 rounded-full border border-ink/15 text-[10px] font-bold text-ink/70 hover:text-ink transition"
                      >
                        <i className="fa-solid fa-plus mr-1" />
                        Task
                      </button>
                    </div>
                  )}

                  {/* approvals sit on the design itself */}
                  {m.kind === 'design' && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {m.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => {
                              setApproval(m.id, 'approved')
                              refresh()
                            }}
                            className="px-3 py-1.5 rounded-full bg-brand-500 text-panel text-[10px] font-black uppercase tracking-wider active:scale-95 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setApproval(m.id, 'changes')
                              addTask({ roomId, title: 'Changes requested on a design', from: 'approval' })
                              refresh()
                            }}
                            className="px-3 py-1.5 rounded-full border border-ink/15 text-[10px] font-bold text-ink/70 hover:text-ink transition"
                          >
                            Request changes
                          </button>
                        </>
                      ) : (
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider ${
                            m.status === 'approved' ? 'text-brand-400' : 'text-amber-500'
                          }`}
                        >
                          <i
                            className={`fa-solid ${
                              m.status === 'approved' ? 'fa-circle-check' : 'fa-rotate-left'
                            } mr-1`}
                          />
                          {m.status === 'approved' ? 'Approved' : 'Changes requested'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-ink/35 mt-1 px-1">
                  {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>
      </div>

      {/* composer */}
      <div
        className="shrink-0 border-t border-ink/10 bg-surface px-4 pt-3"
        style={{ paddingBottom: 'calc(1rem + var(--safe-bottom))' }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-1.5 mb-2">
            {MENTIONS.slice(0, 4).map((m) => (
              <button
                key={m.tag}
                onClick={() => setDraft((d) => `${m.tag} ${d}`.trim())}
                className="px-2.5 py-1 rounded-full border border-ink/12 text-[10px] font-bold text-ink/60 hover:text-ink hover:border-ink/30 transition"
              >
                {m.tag}
              </button>
            ))}
            <button
              onClick={() => setVoice((v) => (v === 'client' ? 'team' : 'client'))}
              className="ml-auto px-2.5 py-1 rounded-full bg-ink/5 text-[10px] font-black uppercase tracking-wider text-ink/70"
              title="Demo control: send as either side"
            >
              <i className="fa-solid fa-repeat mr-1" />
              {voice}
            </button>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="h-11 w-11 shrink-0 rounded-full glass-panel flex items-center justify-center text-ink/70 hover:text-ink transition"
              aria-label="Attach"
            >
              <i className="fa-solid fa-paperclip text-sm" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => attach(e.target.files?.[0])}
            />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={1}
              placeholder="Message, or start with @poster…"
              className="flex-1 field rounded-2xl px-3.5 py-3 text-[13px] text-ink outline-none resize-none max-h-28"
            />
            <button
              onClick={() => send()}
              disabled={!draft.trim()}
              className="h-11 w-11 shrink-0 rounded-full bg-brand-500 text-panel flex items-center justify-center disabled:opacity-35 active:scale-95 transition"
              aria-label="Send"
            >
              <i className="fa-solid fa-paper-plane text-sm" />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
