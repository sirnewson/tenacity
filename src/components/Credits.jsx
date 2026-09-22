import { brand } from '../brand'

/** The credit line, in one place so every screen says it the same way:
 *  "Created by <maker> · A product of <house>", with the copyright under it.
 *  The wording is config-driven; a build with a different number of credits
 *  just gets them joined. The year is taken at render, so it never goes stale. */
export default function Credits({ className = '' }) {
  const list = brand.credits || []
  const lead = brand.creditLead ?? 'Created by'
  const join = brand.creditJoin ?? 'A product of'
  const house = brand.copyrightHolder ?? list[list.length - 1]?.label ?? ''

  const link = (c) => (
    <a
      key={c.href}
      href={c.href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ink/75 hover:text-ink font-semibold transition-colors"
    >
      {c.label}
    </a>
  )

  return (
    <div className={`text-[11px] text-grey leading-relaxed ${className}`}>
      <p>
        {list.length === 2 ? (
          <>
            {lead} {link(list[0])} · {join} {link(list[1])}
          </>
        ) : (
          list.map((c, i) => (
            <span key={c.href}>
              {link(c)}
              {i < list.length - 1 ? ' · ' : ''}
            </span>
          ))
        )}
      </p>
      {house && (
        <p className="text-ink/35 mt-1.5">
          © {new Date().getFullYear()} {house}. All rights reserved.
        </p>
      )}
    </div>
  )
}
