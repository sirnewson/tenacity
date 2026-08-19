import { brand, logoTintClass, logoUrl } from '../brand'

/** The client mark, rendered the way that brand needs.
 *
 *  `logoTint: 'black' | 'white' | 'none'` flattens a single-colour logo to suit
 *  the theme. A full-colour mark uses 'none' — and if it carries colours close
 *  to the surface (the YXM mark's yellow arm on the YXM yellow), `logoPlate`
 *  sets it on a dark chip so the whole shape stays readable. */
export default function BrandLogo({ className = '', plateClassName = '' }) {
  const img = (
    <img
      src={logoUrl()}
      alt={brand.clientName}
      className={`object-contain ${className} ${logoTintClass()}`}
    />
  )

  if (!brand.logoPlate) return img

  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl bg-[#0b0b0f] px-4 py-3 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.6)] ${plateClassName}`}
    >
      {img}
    </span>
  )
}
