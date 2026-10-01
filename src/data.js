export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const ACCESS_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfrUt3OG37jJKtuVnT4yRfppAU-UnTvz0n4TUfDbEt3wAnmZA/viewform?embedded=true'
export const PROTOTYPE_URL = 'engine.html#engine'

/* ---------- hero tab console ---------- */
export const HERO_TABS = [
  {
    n: '01', key: 'PROFILE',
    cap: 'WHO YOU ARE, READ HONESTLY — EVERY TRAIT CITED BACK TO YOUR ANSWERS.',
    lines: [
      { label: 'profile.read', value: 'parsing your answers', ok: 'THE BUILDER' },
      { label: 'traits.cite', value: 'every trait sourced to an answer', ok: 'CITED' },
      { label: 'signal.match', value: 'matching how you actually work', ok: 'LOCKED' },
    ],
  },
  {
    n: '02', key: 'FORGE',
    cap: 'A REAL OPPORTUNITY, A BUILDABLE SPEC, A WORKING PRODUCT.',
    lines: [
      { label: 'discover.fetch', value: 'api.github.com/search · live demand', ok: 'VERIFIED' },
      { label: 'blueprint.spec', value: 'screens · features · data model', ok: 'SCHEMA-VALID' },
      { label: 'forge.build', value: 'building on the rented builder', ok: 'REACHABLE' },
    ],
  },
  {
    n: '03', key: 'LAUNCH',
    cap: 'AUDITED, DEPLOYED, WATCHED — AND HONEST WHEN THERE IS NO DATA YET.',
    lines: [
      { label: 'sentinel.scan', value: 'dependency · secrets · static analysis', ok: '86 / 100' },
      { label: 'deploy.gate', value: 'gated on security · reachability check', ok: 'LIVE' },
      { label: 'studio.reach', value: 'querying assistants for recommendation', ok: '~0% HONEST' },
    ],
  },
]

/* ---------- features ---------- */
export const FEATURES_SUB =
  'No stage is sold or spun out. You move from who you are to a live, in-market product in one continuous run — and you can see each step working.'

export const FEATURES = [
  {
    n: 'F.01', glyph: '◈', title: 'Sourced signals',
    body: 'Opportunity signal pulled live from real developer ecosystems — repositories, new-project activity, stars — and stamped with its source.',
    det: 'api.github.com/search · verified',
  },
  {
    n: 'F.02', glyph: '⌘', title: 'Live builds',
    body: 'A rented builder turns your spec into a working product, and Aurexis verifies the preview URL is actually reachable before calling it done.',
    det: 'preview URL reachable',
  },
  {
    n: 'F.03', glyph: '◉', title: 'Honest telemetry',
    body: 'Once live, you watch real telemetry. On a brand-new product it is sparse — and empty tiles say "no data yet" instead of faking a metric.',
    det: 'users: no data yet',
  },
]

/* ---------- run stages ---------- */
export const RUN_SUB =
  'Seven stages, one continuous run. Pick any stage to see what it produces — and the evidence it leaves behind.'

export const RUN_STAGES = [
  { n: '01', id: 'profile',   name: 'Profile',   kc: 'who you are',         h: 'Read honestly',         p: 'A few honest signals about how you work become a profile — and every trait is cited back to your answers, never invented.', det: 'profile signature → "The Builder"' },
  { n: '02', id: 'discover',  name: 'Discover',  kc: 'a real opportunity',  h: 'Sourced, not guessed',  p: 'An opportunity matched to you, drawn from live developer-ecosystem signal — real repositories, new-project activity and stars.', det: 'api.github.com/search · 2026-06-26 · verified' },
  { n: '03', id: 'blueprint', name: 'Blueprint', kc: 'the build spec',      h: 'A buildable spec',      p: 'The opportunity becomes a concrete, schema-validated specification — screens, features and a data model ready to build.', det: '✓ schema-validated · 5 screens' },
  { n: '04', id: 'forge',     name: 'Forge',     kc: 'build the product',   h: 'Built for real',        p: 'A rented builder turns the spec into a working product — and Aurexis verifies the preview URL is actually reachable.', det: '✓ preview URL reachable' },
  { n: '05', id: 'sentinel',  name: 'Sentinel',  kc: 'security audit',      h: 'Audited by scanners',   p: 'Real dependency, secrets and static-analysis scanners check the build. A score you can trust — your code is never executed.', det: 'security 86 / 100' },
  { n: '06', id: 'dashboard', name: 'Dashboard', kc: 'live control',        h: 'Honest telemetry',      p: 'Once live, you watch real telemetry. On a brand-new product it is sparse — and empty tiles say "no data yet" instead of faking it.', det: 'uptime 100% · users: no data yet' },
  { n: '07', id: 'studio',    name: 'Studio',    kc: 'get recommended',     h: 'Reach into AI answers', p: 'Aurexis works to get your product surfaced by AI assistants — web-grounded, and honest that a day-old product starts near zero.', det: 'AI visibility ~0% · the true start' },
]

/* ---------- manifesto ---------- */
export const MANIFESTO = [
  'Plenty of products hand you a confident score built from your own words. Feels like proof — but no real customer ever touched it.',
  'Aurexis only shows a number when it comes from a real fetch, scan, or probe — and honestly marks what it cannot know. Empty dashboards say "no data yet" instead of inventing a metric.',
]

/* ---------- moat contrast rows ---------- */
export const MOAT_ROWS = {
  bad: {
    tag: '◴ SIMULATED VALIDATION',
    title: 'A score from your own description',
    rows: [
      '"Live signals" and market sizes no free source can actually produce',
      'Revenue projections invented to look convincing',
      'Feels like proof — but no real customer ever touched it',
    ],
  },
  good: {
    tag: '◉ AUREXIS · REAL EVIDENCE',
    title: 'Every number traces to a source',
    rows: [
      'Opportunity signal pulled live from real developer ecosystems, source-stamped',
      'Build verified reachable; security from real scanners, not vibes',
      'Empty dashboards say "no data yet" instead of inventing a metric',
    ],
  },
}

/* ---------- source tiles ---------- */
export const SOURCES = [
  { name: 'github.search', kind: 'API',       desc: 'Live repository and demand signal, source-stamped on fetch.' },
  { name: 'dep.audit',     kind: 'SCANNER',   desc: 'Known-vulnerability audit across the dependency tree.' },
  { name: 'secrets.scan',  kind: 'SCANNER',   desc: 'Leaked keys and credentials caught before deploy.' },
  { name: 'static.sast',   kind: 'SCANNER',   desc: 'Static analysis of the generated code — never executed.' },
  { name: 'reach.probe',   kind: 'PROBE',     desc: 'Preview and production URLs verified actually reachable.' },
  { name: 'schema.check',  kind: 'PROBE',     desc: 'Every spec validated against a strict schema before build.' },
  { name: 'uptime.watch',  kind: 'TELEMETRY', desc: 'Real uptime and traffic — sparse on day one, and says so.' },
  { name: 'ai.visibility', kind: 'TELEMETRY', desc: 'Web-grounded checks of how assistants recommend you.' },
]

export const STATS = [
  { count: 7,   suffix: '',  label: 'STAGES, ONE RUN' },
  { count: 0,   suffix: '',  label: 'NUMBERS INVENTED' },
  { count: 100, suffix: '%', label: 'TRACEABLE TO A SOURCE' },
]

/* ---------- security ---------- */
export const SCANS = [
  'DEPENDENCY AUDIT', 'SECRETS SCAN', 'STATIC ANALYSIS',
  'REACHABILITY PROBE', 'SCHEMA VALIDATION', 'LIVE TELEMETRY',
]

export const SECURITY_CARDS = [
  {
    n: 'S.01', title: 'Real scanners',
    body: 'Dependency, secrets and static-analysis scanners check every build. The score comes from their findings, not from vibes.',
    det: 'security 86 / 100',
  },
  {
    n: 'S.02', title: 'Your code is never executed',
    body: 'Audits run against the code and its dependency tree statically. Nothing of yours is run to produce a number.',
    det: 'static analysis only',
  },
  {
    n: 'S.03', title: 'A score you can trust',
    body: 'Deploys are gated on the audit. If the scanners are not satisfied, the run says so instead of shipping anyway.',
    det: 'deploy gated on security',
  },
]

/* ---------- city buildings ---------- */
export const CITY_BUILDINGS = [
  { key: 'main',      name: 'MAIN',      status: 'soon' },
  { key: 'forge',     name: 'FORGE',     status: 'soon' },
  { key: 'core',      name: 'CORE',      status: 'online' },
  { key: 'sentinel',  name: 'SENTINEL',  status: 'soon' },
  { key: 'dashboard', name: 'DASHBOARD', status: 'soon' },
  { key: 'studio',    name: 'STUDIO',    status: 'soon' },
]

/* ---------- footer ---------- */
export const FOOTER_COLS = [
  {
    title: 'ENGINE',
    links: [
      { label: 'The run', href: '#run' },
      { label: 'Capabilities', href: '#engine' },
      { label: 'Sentinel', href: '#sentinel' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About', href: '#top' },
      { label: 'Manifesto', href: '#manifesto' },
      { label: 'Request access', action: 'access' },
    ],
  },
  {
    title: 'EVIDENCE',
    links: [
      { label: 'The moat', href: '#sources' },
      { label: 'Sources', href: '#sources' },
    ],
  },
  {
    title: 'LEGAL',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
]
