// The charter is a draft: while working locally, show a banner so it is never mistaken for the published version.
// The banner code is dropped from production builds (import.meta.env.DEV is false there).
if (import.meta.env.DEV) {
  const bar = document.createElement('div')
  bar.className = 'draft-bar'
  bar.setAttribute('role', 'note')
  bar.textContent = 'DRAFT, founder to review before publishing'
  document.body.prepend(bar)
}
