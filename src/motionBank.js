/* The clip bank: intros, outros and logo stings kept on the device.

   Two sources feed it. The build ships the client's own stings in
   brand.config.js (`motions`), and anything the team records or uploads in the
   studio is saved here. Video is far too big for localStorage, so this is
   IndexedDB — a few megabytes a clip, and it survives a reload like the rest of
   the app's state.

   Everything stays on the phone. Nothing is uploaded. */

const DB_NAME = 'yxm.motion'
const STORE = 'clips'

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser cannot store clips.'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('Could not open the clip bank.'))
  })
}

function run(mode, fn) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const out = fn(tx.objectStore(STORE))
        tx.oncomplete = () => {
          db.close()
          resolve(out?.result ?? out)
        }
        tx.onerror = () => {
          db.close()
          reject(tx.error)
        }
      })
  )
}

/** Save a clip. `role` is 'intro' | 'outro' | 'both', the same words the config
 *  uses, so the picker treats a saved clip and a shipped one identically. */
export async function saveClip({ name, blob, poster = '', role = 'both' }) {
  const id = `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  await run('readwrite', (store) =>
    store.put({ id, name: name || 'Saved clip', blob, poster, role, saved: Date.now() })
  )
  return id
}

/** Everything saved on this device, newest first, with object URLs ready to
 *  play. Call `release` on the result when the list is replaced, or the URLs
 *  leak for as long as the page lives. */
export async function listClips() {
  try {
    const rows = await run('readonly', (store) => store.getAll())
    return (rows || [])
      .sort((a, b) => b.saved - a.saved)
      .map((r) => ({
        id: r.id,
        name: r.name,
        sub: 'On this device',
        role: r.role,
        url: URL.createObjectURL(r.blob),
        posterUrl: r.poster || '',
        saved: true,
        size: r.blob.size,
      }))
  } catch {
    return [] // a browser without IndexedDB still gets the shipped clips
  }
}

export function release(clips = []) {
  clips.forEach((c) => c.saved && c.url && URL.revokeObjectURL(c.url))
}

export async function removeClip(id) {
  try {
    await run('readwrite', (store) => store.delete(id))
    return true
  } catch {
    return false
  }
}
