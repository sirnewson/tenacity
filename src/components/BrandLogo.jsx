import { brand, logoTintClass, logoUrl } from '../brand'

/** The client mark, rendered the way that brand needs.
 *
 *  `logoTint: 'black' | 'white' | 'none'` flattens a single-colour logo to suit
 *  the theme. A full-colour mark uses 'none' — and when it carries colours that
 *  disappear against the surface (a navy wordmark on black, the YXM mark's
 *  yellow arm on YXM yellow), `logoPlate` sets it on a chip so the whole shape
 *  stays readable: 'light' for a white chip, true or 'dark' for a near-black one. */
export default function BrandLogo({ className = '', plateClassName = '' }) {
  const img = (
    <img
      src={logoUrl()}
      alt={brand.clientName}
      className={`object-contain ${className} ${logoTintClass()}`}
    />
  )

  if (!brand.logoPlate) return img

  const light = brand.logoPlate === 'light'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 ${
        light ? 'bg-white border border-black/[0.06]' : 'bg-[#0b0b0f]'
      } ${plateClassName}`}
    >
      {img}
    </span>
  )
}
