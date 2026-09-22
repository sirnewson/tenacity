import { useEffect } from 'react'

/* Reveal-on-scroll, Aurora's way: elements enter once, from 28px down and a
   touch out of focus, then settle on the spring curve and stay put.

   Two details this has to get right in this app:

   - The scroller is the step's own <main>, not the window. An observer with the
     default root would fire everything at once, because the document itself
     never scrolls here.
   - Steps stay mounted and are hidden with `display: none`, so a hidden step
     reports zero intersection. Observing only while the step is active keeps a
     card from being marked seen while nobody is looking at it. */
export default function useReveal(rootRef, active, deps = []) {
  useEffect(() => {
    const root = rootRef.current
    if (!active || !root) return undefined

    const items = root.querySelectorAll('[data-reveal]')
    if (!items.length) return undefined

    if (typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => el.classList.add('is-visible'))
      return undefined
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target) // once seen, it stays seen
        })
      },
      { root, rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    )

    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps])
}
