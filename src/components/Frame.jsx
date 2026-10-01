import './frame.css'

export default function Frame() {
  return (
    <div className="sz-frame" aria-hidden="true">
      <div className="border" />
      <span className="tick tl" />
      <span className="tick tr" />
      <span className="tick bl" />
      <span className="tick br" />
      <div className="chip">
        <span className="dot" />
        AUREXIS&nbsp;//&nbsp;LIVE RUN
      </div>
    </div>
  )
}
