// Label placement for the moat visual. Each label sits beside its node, preferring the node's outer side, and is
// scored against leaving the box or touching any node or any label already placed. Outer labels are placed first
// because they have the least room. Pure function so it can be tested at every angle of rotation.
//   pts:   [[x, y, cos, sin], ...] node centres and their outward direction
//   sizes: [[w, h], ...] label sizes
//   box:   { W, H, nodeR, gap }
// returns [[x, y], ...] top-left corner of each label
export function placeLabels(pts, sizes, { W, H, nodeR, gap }) {
  const ov = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]))
  const pad = nodeR + 3
  const nodeRects = pts.map(([x, y]) => [x - pad, y - pad, x + pad, y + pad])
  const placed = [], out = new Array(pts.length)
  for (let i = pts.length - 1; i >= 0; i--) {
    const [x, y, c, s] = pts[i], [w, h] = sizes[i], d = nodeR + gap
    const ax = x + c * d, ay = y + s * d
    const outer = c > 0.45 ? [ax, ay - h / 2] : c < -0.45 ? [ax - w, ay - h / 2] : [ax - w / 2, s < 0 ? ay - h : ay]
    const right = [x + d, y - h / 2], left = [x - d - w, y - h / 2], above = [x - w / 2, y - d - h], below = [x - w / 2, y + d]
    // after the outer side, prefer the sides that point away from the centre
    const sides = [[right, c], [left, -c], [above, -s], [below, s]].sort((a, b) => b[1] - a[1]).map((e) => e[0])
    let best = outer, bestScore = Infinity
    ;[outer, ...sides].forEach(([lx, ly], k) => {
      const r = [lx, ly, lx + w, ly + h]
      const outside = Math.max(0, 2 - lx) + Math.max(0, lx + w - (W - 2)) + Math.max(0, 2 - ly) + Math.max(0, ly + h - (H - 2))
      let score = k * 30 + outside * 500
      for (const n of nodeRects) score += ov(r, n) * 8
      for (const q of placed) score += ov(r, q) * 8
      if (score < bestScore) { bestScore = score; best = [lx, ly] }
    })
    const lx = Math.max(2, Math.min(W - w - 2, best[0])), ly = Math.max(2, Math.min(H - h - 2, best[1]))
    out[i] = [lx, ly]; placed.push([lx - 4, ly - 4, lx + w + 4, ly + h + 4])   // keep a little air between labels
  }
  return out
}
