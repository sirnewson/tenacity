import { useEffect, useRef, useState } from 'react'
import StepHeader from './StepHeader'
import { useStudio } from '../StudioContext'
import { brand } from '../brand'
import BrandLogo from './BrandLogo'
import {
  brandDefaults,
  exportProfile,
  importProfile,
  loadOverrides,
  paletteFrom,
  resetOverrides,
  saveOverrides,
} from '../brandStore'

const SWATCHES = [
  '#0EA5E9', '#2563EB', '#7C3AED', '#DB2777', '#E4002B',
  '#EA580C', '#F59E0B', '#16A34A', '#0D9488', '#18181B',
]

/** Everything about how this build looks, in one place — colour, logo, wording,
 *  theme. Saved on the device and applied everywhere, including the colour the
 *  embedded apps are painted with. */
export default function SettingsStep() {
  const s = useStudio()
  const active = s.step === 'settings'
  const [draft, setDraft] = useState(() => snapshot())
  const [dirty, setDirty] = useState(false)
  const fileRef = useRef(null)
  const profileRef = useRef(null)

  function snapshot() {
    return {
      clientName: brand.clientName,
      headline: brand.headline,
      headlineSuffix: brand.headlineSuffix,
      subhead: brand.subhead,
      currency: brand.currency,
      theme: brand.theme,
      ctaStyle: brand.ctaStyle,
      logoTint: brand.logoTint,
      logoPlate: !!brand.logoPlate,
      logoDataUrl: brand.logoDataUrl || '',
      colors: { ...brand.colors },
      accent: brand.colors[brand.theme === 'dark' ? 500 : 400],
    }
  }

  useEffect(() => {
    if (active) {
      setDraft(snapshot())
      setDirty(false)
    }
  }, [active])

  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }))
    setDirty(true)
  }

  const pickAccent = (hex) => set({ accent: hex.toUpperCase(), colors: paletteFrom(hex, draft.theme) })

  const apply = () => {
    const { accent, ...rest } = draft
    saveOverrides(rest)
    setDirty(false)
    s.reloadBrand()
    s.showMessage('Brand updated across every app.', false)
  }

  const reset = () => {
    resetOverrides()
    setDraft(snapshot())
    setDirty(false)
    s.reloadBrand()
    s.showMessage('Back to the build defaults.', false)
  }

  const readLogo = (file) => {
    if (!file) return
    if (file.size > 1.5 * 1024 * 1024) {
      s.showMessage('That logo is over 1.5MB — use a smaller PNG.', true)
      return
    }
    const r = new FileReader()
    r.onload = (e) => set({ logoDataUrl: String(e.target.result) })
    r.readAsDataURL(file)
  }

  const downloadProfile = () => {
    const blob = new Blob([exportProfile()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${brand.slug || 'brand'}-profile.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 20000)
  }

  const readProfile = (file) => {
    if (!file) return
    const r = new FileReader()
    r.onload = (e) => {
      try {
        importProfile(String(e.target.result))
        setDraft(snapshot())
        setDirty(false)
        s.reloadBrand()
        s.showMessage('Brand profile loaded.', false)
      } catch {
        s.showMessage('That file is not a brand profile.', true)
      }
    }
    r.readAsText(file)
  }

  const saved = Object.keys(loadOverrides()).length

  return (
    <main
      className={`step-container flex-col h-full w-full relative z-20 app-bg overflow-y-auto no-scrollbar ${
        active ? 'flex' : 'hidden'
      }`}
      style={{
        paddingTop: 'calc(1rem + var(--safe-top))',
        paddingBottom: 'calc(7rem + var(--safe-bottom))',
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-4">
        <StepHeader
          title="Brand settings"
          right={
            saved > 0 ? (
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                Customised
              </span>
            ) : null
          }
        />

        {/* ---- Live preview ---- */}
        <section className="glass-panel rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-4">
            <BrandLogo className="h-10" />
            <div className="min-w-0">
              <p className="font-black text-ink text-[15px] leading-tight truncate">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-brand-500">
                  {draft.headline}
                </span>{' '}
                {draft.headlineSuffix}
              </p>
              <p className="text-[11.5px] text-ink/55 truncate">{draft.clientName}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {[300, 400, 500, 600].map((k) => (
              <span
                key={k}
                className="flex-1 h-9 rounded-lg border border-ink/10 flex items-end justify-center pb-1"
                style={{ background: draft.colors[k] }}
              >
                <span className="text-[8px] font-black text-white mix-blend-difference">{k}</span>
              </span>
            ))}
          </div>
        </section>

        {/* ---- Colour ---- */}
        <Section title="Brand colour" icon="fa-palette">
          <p className="text-[12px] text-ink/55 leading-relaxed mb-3">
            One colour drives the whole app — buttons, glows, guides, the price plates and the
            accents inside QR Studio, Caption Writer and Quoty.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            {SWATCHES.map((hex) => (
              <button
                key={hex}
                onClick={() => pickAccent(hex)}
                title={hex}
                className={`w-9 h-9 rounded-full border-2 transition active:scale-95 ${
                  draft.accent?.toUpperCase() === hex
                    ? 'border-ink scale-110'
                    : 'border-ink/20 hover:border-ink/50'
                }`}
                style={{ background: hex }}
              />
            ))}
            <label className="w-9 h-9 rounded-full border-2 border-dashed border-ink/25 flex items-center justify-center cursor-pointer hover:border-ink/50 transition">
              <i className="fa-solid fa-eye-dropper text-[11px] text-ink/70" />
              <input
                type="color"
                className="hidden"
                value={draft.accent || '#000000'}
                onChange={(e) => pickAccent(e.target.value)}
              />
            </label>
            <code className="ml-1 text-[11px] font-bold text-ink/60">{draft.accent}</code>
          </div>
        </Section>

        {/* ---- Logo ---- */}
        <Section title="Logo" icon="fa-image">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-3 rounded-xl bg-ink/5 hover:bg-ink/10 border border-ink/10 text-ink font-bold text-[12px] transition"
            >
              <i className="fa-solid fa-upload text-xs mr-1.5" />
              {draft.logoDataUrl ? 'Replace logo' : 'Upload logo'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/svg+xml,image/*"
              className="hidden"
              onChange={(e) => readLogo(e.target.files?.[0])}
            />
            {draft.logoDataUrl && (
              <button
                onClick={() => set({ logoDataUrl: '' })}
                className="text-[11px] font-bold text-ink/45 hover:text-ink transition"
              >
                Use the build's logo
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Choice
              label="Colour treatment"
              value={draft.logoTint}
              onChange={(v) => set({ logoTint: v })}
              options={[['none', 'As-is'], ['black', 'Black'], ['white', 'White']]}
            />
            <Toggle
              label="Dark chip behind it"
              on={draft.logoPlate}
              onChange={(v) => set({ logoPlate: v })}
              hint="For a colour logo on a light surface"
            />
          </div>
        </Section>

        {/* ---- Wording ---- */}
        <Section title="Wording" icon="fa-font">
          <Field label="Business name" value={draft.clientName} onChange={(v) => set({ clientName: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Headline" value={draft.headline} onChange={(v) => set({ headline: v })} />
            <Field label="After it" value={draft.headlineSuffix} onChange={(v) => set({ headlineSuffix: v })} />
          </div>
          <Field label="Sub-line" value={draft.subhead} onChange={(v) => set({ subhead: v })} />
          <Field
            label="Currency on the price plate"
            value={draft.currency}
            onChange={(v) => set({ currency: v })}
            placeholder="KSH"
          />
        </Section>

        {/* ---- Look ---- */}
        <Section title="Look" icon="fa-swatchbook">
          <div className="grid grid-cols-2 gap-3">
            <Choice
              label="Theme"
              value={draft.theme}
              onChange={(v) => set({ theme: v, colors: paletteFrom(draft.accent, v) })}
              options={[['light', 'Light'], ['dark', 'Dark']]}
            />
            <Choice
              label="Main button"
              value={draft.ctaStyle}
              onChange={(v) => set({ ctaStyle: v })}
              options={[['brand', 'Brand'], ['rainbow', 'YXM gradient']]}
            />
          </div>
        </Section>

        {/* ---- Profile ---- */}
        <Section title="This brand as a file" icon="fa-file-arrow-down">
          <p className="text-[12px] text-ink/55 leading-relaxed mb-3">
            Save the whole skin to move it to another phone, or hand it to a client with their
            build.
          </p>
          <div className="flex gap-2.5 flex-wrap">
            <button
              onClick={downloadProfile}
              className="px-4 py-3 rounded-xl bg-ink/5 hover:bg-ink/10 border border-ink/10 text-ink font-bold text-[12px] transition"
            >
              <i className="fa-solid fa-download text-xs mr-1.5" />
              Export
            </button>
            <button
              onClick={() => profileRef.current?.click()}
              className="px-4 py-3 rounded-xl bg-ink/5 hover:bg-ink/10 border border-ink/10 text-ink font-bold text-[12px] transition"
            >
              <i className="fa-solid fa-file-import text-xs mr-1.5" />
              Import
            </button>
            <input
              ref={profileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => readProfile(e.target.files?.[0])}
            />
            <button
              onClick={reset}
              className="px-4 py-3 rounded-xl bg-ink/5 hover:bg-ink/10 border border-ink/10 text-ink/60 hover:text-ink font-bold text-[12px] transition ml-auto"
            >
              Reset to build
            </button>
          </div>
        </Section>
      </div>

      {/* ---- Save bar ---- */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 px-4 pt-3 bg-gradient-to-t from-surface via-surface to-transparent"
        style={{ paddingBottom: 'calc(1rem + var(--safe-bottom))' }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={apply}
            disabled={!dirty}
            className={`w-full py-4 rounded-full font-black text-[15px] tracking-wide flex items-center justify-center gap-2.5 transition disabled:opacity-40 ${
              draft.ctaStyle === 'rainbow'
                ? 'btn-rainbow'
                : 'bg-gradient-to-r from-brand-500 to-brand-600 text-panel border-2 border-brand-300 active:scale-95'
            }`}
          >
            <i className="fa-solid fa-check text-sm" />
            {dirty ? 'Apply to every app' : 'Everything saved'}
          </button>
        </div>
      </div>
    </main>
  )
}

function Section({ title, icon, children }) {
  return (
    <section className="glass-panel rounded-2xl p-5 mb-4">
      <h3 className="font-black text-ink text-[14px] flex items-center gap-2 mb-3">
        <i className={`fa-solid ${icon} text-brand-400 text-[13px]`} />
        {title}
      </h3>
      {children}
    </section>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block mb-3 last:mb-0">
      <span className="text-[10px] text-ink/50 font-bold uppercase tracking-widest mb-1.5 block">
        {label}
      </span>
      <input
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full field rounded-xl px-3.5 py-3 text-ink text-[13px] outline-none"
      />
    </label>
  )
}

function Choice({ label, value, onChange, options }) {
  return (
    <div>
      <span className="text-[10px] text-ink/50 font-bold uppercase tracking-widest mb-1.5 block">
        {label}
      </span>
      <div className="flex gap-1.5">
        {options.map(([v, text]) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`flex-1 h-10 rounded-lg border text-[11px] font-bold transition ${
              value === v
                ? 'border-brand-500 bg-brand-500/15 text-ink'
                : 'border-ink/10 text-ink/50 hover:border-ink/30'
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

function Toggle({ label, on, onChange, hint }) {
  return (
    <div>
      <span className="text-[10px] text-ink/50 font-bold uppercase tracking-widest mb-1.5 block">
        {label}
      </span>
      <button
        onClick={() => onChange(!on)}
        className={`w-full h-10 rounded-lg border flex items-center justify-between px-3 transition ${
          on ? 'border-brand-500 bg-brand-500/15' : 'border-ink/10'
        }`}
      >
        <span className="text-[11px] font-bold text-ink/70">{on ? 'On' : 'Off'}</span>
        <span
          className={`w-9 h-5 rounded-full flex items-center px-0.5 transition ${
            on ? 'bg-brand-500 justify-end' : 'bg-ink/15 justify-start'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-panel shadow" />
        </span>
      </button>
      {hint && <span className="text-[10px] text-ink/40 mt-1 block leading-tight">{hint}</span>}
    </div>
  )
}
