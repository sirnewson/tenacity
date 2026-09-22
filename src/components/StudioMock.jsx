import { formats, selectCards, videoCards } from '../brand'

/** A poster reads best as a feed card, a clip as a tall one — so each mock
 *  picks the first template of the shape it is showing off. */
const firstOfShape = (cards, tall) =>
  cards.find((c) => {
    const f = formats[c.id]
    return f && (f.height > f.width * 1.4) === tall
  }) || cards[0]

/** The little animated picture inside a studio card.
 *
 *  Sized off the card's HEIGHT, never the column width: the card is short and
 *  grows much wider on a desktop, so width-driven artwork runs past the
 *  rounded corner and gets clipped. It is built from the
 *  client's own template artwork rather than stock, so the card previews the
 *  work this build actually makes. Pure CSS motion — no library, and it stops
 *  under prefers-reduced-motion with everything else. */
export default function StudioMock({ kind, tint }) {
  if (kind === 'video') return <VideoMock tint={tint} />
  return <PosterMock tint={tint} />
}

function PosterMock({ tint }) {
  const art = firstOfShape(selectCards, false)?.bg
  const ghost = selectCards.find((c) => c.bg !== art)?.bg || art
  return (
    <div className="relative w-full h-full" aria-hidden="true">
      {/* the card behind, as a hint of a stack */}
      <div
        className="absolute right-[34%] top-1/2 -translate-y-1/2 h-[62%] aspect-[4/5] rounded-lg border opacity-35 mock-float-slow"
        style={{
          borderColor: `${tint}55`,
          backgroundImage: `url('${ghost}')`,
          backgroundSize: 'cover',
        }}
      />
      {/* the poster being made */}
      <div className="absolute right-[4%] top-1/2 -translate-y-1/2 h-[82%] aspect-[4/5] mock-float">
        <div
          className="absolute inset-0 rounded-xl overflow-hidden border"
          style={{ borderColor: `${tint}66`, boxShadow: `0 0 40px -12px ${tint}` }}
        >
          <img src={art} alt="" className="w-full h-full object-cover" />
          <span className="mock-sheen absolute inset-0" />
        </div>
        {/* selection brackets — the design-tool tell */}
        {['-top-1 -left-1 border-t-2 border-l-2', '-top-1 -right-1 border-t-2 border-r-2',
          '-bottom-1 -left-1 border-b-2 border-l-2', '-bottom-1 -right-1 border-b-2 border-r-2'].map((c) => (
          <span key={c} className={`absolute w-3.5 h-3.5 ${c} mock-pulse`} style={{ borderColor: tint }} />
        ))}
      </div>
    </div>
  )
}

function VideoMock({ tint }) {
  const art = firstOfShape(videoCards.length ? videoCards : selectCards, true)?.bg
  const frames = Array.from({ length: 6 })
  return (
    <div
      className="absolute inset-y-0 right-0 left-auto w-[min(100%,13rem)] flex flex-col justify-center gap-1.5"
      aria-hidden="true"
    >
      <div
        className="relative w-full aspect-video rounded-xl overflow-hidden border mock-float"
        style={{ borderColor: `${tint}66`, boxShadow: `0 0 40px -12px ${tint}` }}
      >
        <img src={art} alt="" className="w-full h-full object-cover opacity-90" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-8 h-8 rounded-full bg-white/85 flex items-center justify-center">
            <i className="fa-solid fa-play text-[10px] text-black ml-0.5" />
          </span>
        </span>
      </div>
      {/* the timeline, with the playhead running */}
      <div className="relative flex gap-[3px] w-full">
        {frames.map((_, i) => (
          <span
            key={i}
            className="flex-1 h-7 rounded-[3px] overflow-hidden border"
            style={{ borderColor: `${tint}33` }}
          >
            <img src={art} alt="" className="w-full h-full object-cover opacity-70" />
          </span>
        ))}
        <span className="mock-playhead absolute top-[-3px] bottom-[-3px] w-[2px]" style={{ background: tint }}>
          <span
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
            style={{ background: tint }}
          />
        </span>
      </div>
    </div>
  )
}
