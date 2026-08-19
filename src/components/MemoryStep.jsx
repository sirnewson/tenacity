import { useEffect, useRef, useState } from 'react'
import StepHeader from './StepHeader'
import { useStudio } from '../StudioContext'
import { brand } from '../brand'
import {
  MEMORY_TEMPLATE,
  loadCatalogue,
  loadMemory,
  memoryStats,
  parseCatalogue,
  saveCatalogue,
  saveMemory,
} from '../brandMemory'

/** The brand's context, in plain markdown, editable by whoever knows the
 *  business best. Everything the tools write later reads from here. */
export default function MemoryStep() {
  const s = useStudio()
  const active = s.step === 'memory'
  const [text, setText] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [catalogue, setCatalogue] = useState([])
  const fileRef = useRef(null)

  useEffect(() => {
    if (!active) return
    setText(loadMemory())
    setCatalogue(loadCatalogue())
    setDirty(false)
  }, [active])

  const stats = memoryStats(text)

  const save = () => {
    if (saveMemory(text)) {
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      s.showMessage('Could not save on this device.', true)
    }
  }

  const download = () => {
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${brand.slug || 'brand'}-memory.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 20000)
  }

  const importMd = (file) => {
    if (!file) return
    const r = new FileReader()
    r.onload = (e) => {
      setText(String(e.target.result))
      setDirty(true)
    }
    r.readAsText(file)
  }

  const importCsv = (file) => {
    if (!file) return
    const r = new FileReader()
    r.onload = (e) => {
      const items = parseCatalogue(e.target.result)
      if (!items.length) {
        s.showMessage('No rows found — needs a barcode column.', true)
        return
      }
      saveCatalogue(items)
      setCatalogue(items)
      s.showMessage(`${items.length} products loaded — the scanner can fill tags now.`, false)
    }
    r.readAsText(file)
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
          title="Brand memory"
          right={
            <span className="text-[10px] font-bold text-ink/45">
              {stats.filled}/{stats.total} sections · {stats.words} words
            </span>
          }
        />

        <p className="text-[12.5px] text-ink/60 leading-relaxed mb-4">
          Context the tools read before they write anything for you. Plain markdown, kept on this
          device — edit it like a document.
        </p>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setDirty(true)
          }}
          spellCheck={false}
          rows={18}
          className="w-full field rounded-2xl p-4 text-ink text-[12.5px] leading-relaxed outline-none resize-y font-mono"
        />

        <div className="flex flex-wrap gap-2.5 mt-4">
          <button
            onClick={save}
            disabled={!dirty && !saved}
            className={`flex-1 min-w-[140px] py-3.5 rounded-full font-black text-[13px] tracking-wide flex items-center justify-center gap-2 transition disabled:opacity-45 ${
              brand.ctaStyle === 'rainbow'
                ? 'btn-rainbow'
                : 'bg-brand-500 text-panel active:scale-95'
            }`}
          >
            <i className={`fa-solid ${saved ? 'fa-check' : 'fa-floppy-disk'} text-xs`} />
            {saved ? 'Saved' : dirty ? 'Save memory' : 'Saved'}
          </button>
          <button
            onClick={download}
            className="px-4 py-3.5 rounded-full glass-panel border border-ink/15 text-ink font-bold text-[12px] hover:bg-ink/[0.06] transition active:scale-95"
          >
            <i className="fa-solid fa-download text-xs mr-1.5" />
            .md
          </button>
          <label className="px-4 py-3.5 rounded-full glass-panel border border-ink/15 text-ink font-bold text-[12px] hover:bg-ink/[0.06] transition active:scale-95 cursor-pointer">
            <i className="fa-solid fa-file-import text-xs mr-1.5" />
            Import
            <input
              type="file"
              accept=".md,text/markdown,text/plain"
              className="hidden"
              onChange={(e) => importMd(e.target.files?.[0])}
            />
          </label>
          <button
            onClick={() => {
              setText(MEMORY_TEMPLATE)
              setDirty(true)
            }}
            className="px-4 py-3.5 rounded-full glass-panel border border-ink/15 text-ink/60 font-bold text-[12px] hover:text-ink transition active:scale-95"
          >
            Reset
          </button>
        </div>

        {/* Product catalogue — what the barcode scanner reads */}
        <section className="mt-8 glass-panel rounded-2xl p-5">
          <h3 className="font-black text-ink text-[14px] flex items-center gap-2">
            <i className="fa-solid fa-barcode text-brand-400" />
            Product list
          </h3>
          <p className="text-[12px] text-ink/60 leading-relaxed mt-2">
            Upload a CSV once — <span className="font-mono text-[11px]">barcode, name, details,
            price</span> — and scanning a barcode in the studio fills the price tag by itself.
          </p>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-3 rounded-xl bg-ink/5 hover:bg-ink/10 border border-ink/10 text-ink font-bold text-[12px] transition"
            >
              <i className="fa-solid fa-file-csv text-xs mr-1.5" />
              {catalogue.length ? 'Replace CSV' : 'Upload CSV'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => importCsv(e.target.files?.[0])}
            />
            {catalogue.length > 0 && (
              <>
                <span className="text-[12px] font-bold text-ink">
                  {catalogue.length} products
                </span>
                <button
                  onClick={() => {
                    saveCatalogue([])
                    setCatalogue([])
                  }}
                  className="ml-auto text-[11px] font-bold text-ink/45 hover:text-ink transition"
                >
                  Clear
                </button>
              </>
            )}
          </div>

          {catalogue.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto no-scrollbar rounded-xl border border-ink/10">
              {catalogue.slice(0, 40).map((p, i) => (
                <div
                  key={`${p.code}-${i}`}
                  className="flex items-center gap-3 px-3 py-2 border-b border-ink/5 last:border-0"
                >
                  <span className="font-mono text-[10px] text-ink/45 shrink-0">{p.code}</span>
                  <span className="text-[11.5px] text-ink truncate flex-1">{p.name}</span>
                  <span className="text-[11px] font-bold text-ink/70 shrink-0">{p.price}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-[11px] text-ink/45 leading-relaxed mt-5 text-center">
          <i className="fa-solid fa-lock mr-1.5" />
          Stays on this device. Download the .md to move it or keep it with the brand kit.
        </p>
      </div>
    </main>
  )
}
