/* The workspace: rooms, messages, tasks.

   ---------------------------------------------------------------------------
   TRANSPORT SEAM — read this before extending.

   Every other tool in Business Studio is single-device on purpose: nothing
   leaves the phone, nothing needs a server, hosting is a static file drop.
   A Client Room breaks that, because a conversation needs at least two people
   on two devices.

   So this module is written as if it were already networked: everything goes
   through read()/write() below, and the rest of the app only ever calls the
   functions in this file. Today those two functions use localStorage, which
   makes the room fully demonstrable on one device — the client's side and the
   team's side of the same thread, in a meeting, with no account.

   Swapping to a real backend (Supabase, Firebase, a small API) means replacing
   read/write and adding a subscribe(). No component changes.
   --------------------------------------------------------------------------- */

const KEY = 'yxm.workspace'

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null')
  } catch {
    return null
  }
}

const write = (data) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* out of space — the session still works, it just will not persist */
  }
  return data
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** Tools a message can call by name. The room understands these mentions and
 *  hands the request to the right place. */
export const MENTIONS = [
  { tag: '@poster', tool: 'Poster Studio', step: 'select', icon: 'fa-camera-retro' },
  { tag: '@caption', tool: 'Caption Writer', app: 'captions', icon: 'fa-pen-nib' },
  { tag: '@qr', tool: 'QR Studio', app: 'qr', icon: 'fa-qrcode' },
  { tag: '@quoty', tool: 'Quoty', app: 'quoty', icon: 'fa-quote-left' },
  { tag: '@team', tool: 'Team', icon: 'fa-users' },
]

export const STATUSES = ['To do', 'In progress', 'For approval', 'Done']

function seed() {
  const room = {
    id: uid(),
    name: 'Demo Room',
    client: 'Demo Client',
    tint: '#0EA5E9',
    createdAt: Date.now(),
  }
  return {
    rooms: [room],
    messages: [
      {
        id: uid(),
        roomId: room.id,
        from: 'client',
        author: 'Client',
        text: 'Welcome — this is the room. Send a message, attach a photo, or start one with @poster to hand work straight to a tool.',
        ts: Date.now(),
      },
    ],
    tasks: [],
  }
}

export function loadWorkspace() {
  return read() || write(seed())
}

// ------------------------------------------------------------------- rooms
export function addRoom({ name, client, tint = '#0EA5E9' }) {
  const data = loadWorkspace()
  const room = { id: uid(), name, client: client || name, tint, createdAt: Date.now() }
  data.rooms.push(room)
  write(data)
  return room
}

export function removeRoom(roomId) {
  const data = loadWorkspace()
  data.rooms = data.rooms.filter((r) => r.id !== roomId)
  data.messages = data.messages.filter((m) => m.roomId !== roomId)
  data.tasks = data.tasks.filter((t) => t.roomId !== roomId)
  return write(data)
}

// ---------------------------------------------------------------- messages
export function messagesFor(roomId) {
  return loadWorkspace().messages.filter((m) => m.roomId === roomId)
}

export function sendMessage(roomId, { text = '', from = 'client', author, image, kind }) {
  const data = loadWorkspace()
  const msg = {
    id: uid(),
    roomId,
    from,
    author: author || (from === 'client' ? 'Client' : 'Team'),
    text,
    image,
    kind, // 'design' marks something that can be approved
    status: kind === 'design' ? 'pending' : undefined,
    ts: Date.now(),
  }
  data.messages.push(msg)
  write(data)
  return msg
}

export function setApproval(messageId, status) {
  const data = loadWorkspace()
  const m = data.messages.find((x) => x.id === messageId)
  if (m) m.status = status
  return write(data)
}

// ------------------------------------------------------------------- tasks
export function tasksFor(roomId) {
  const all = loadWorkspace().tasks
  return roomId ? all.filter((t) => t.roomId === roomId) : all
}

export function addTask({ roomId, title, from = 'message', assignee = 'Team', due = '' }) {
  const data = loadWorkspace()
  const task = {
    id: uid(),
    roomId,
    title,
    assignee,
    due,
    status: 'To do',
    from,
    ts: Date.now(),
  }
  data.tasks.push(task)
  write(data)
  return task
}

export function setTaskStatus(taskId, status) {
  const data = loadWorkspace()
  const t = data.tasks.find((x) => x.id === taskId)
  if (t) t.status = status
  return write(data)
}

export function removeTask(taskId) {
  const data = loadWorkspace()
  data.tasks = data.tasks.filter((t) => t.id !== taskId)
  return write(data)
}

// --------------------------------------------------------------- reading it
/** What the room can work out from a message on its own — no AI call needed.
 *  Prices, deadlines and tool mentions are the three things a brief almost
 *  always carries, and all three are patterns. */
export function readMessage(text = '') {
  const prices = [
    ...String(text).matchAll(/(?:ksh|kes|sh)\s?([\d][\d,\.]*)|([\d][\d,]{2,})\s?\/=/gi),
  ]
    .map((m) => (m[1] || m[2] || '').replace(/[,\s]/g, ''))
    .filter(Boolean)

  const due = (String(text).match(
    /\b(today|tomorrow|tonight|this (?:week|weekend)|next week|mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i
  ) || [])[0]

  const mentions = MENTIONS.filter((m) => String(text).toLowerCase().includes(m.tag))

  // "reduce X to Y", "from X to Y" — the shape of an offer
  const change = String(text).match(
    /from\s+(?:ksh|kes|sh)?\s?([\d][\d,\.]*)\s+to\s+(?:ksh|kes|sh)?\s?([\d][\d,\.]*)/i
  )

  return {
    prices,
    due: due || '',
    mentions,
    offer: change ? { was: change[1], now: change[2] } : null,
    actionable: Boolean(mentions.length || change || prices.length || due),
  }
}
