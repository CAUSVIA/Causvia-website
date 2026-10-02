// Deep-space backdrop, matching the boot loader: navy gradient (CSS), a faint gold / teal nebula (WebGL, low resolution)
// and a slow three-layer starfield (2D canvas). setWarm(true) leans the nebula towards gold when the visitor takes the controls.
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches

const FS = `precision mediump float;
uniform vec2 uRes; uniform float uT; uniform float uWarm;
vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
 vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx); vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
 vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod(i,289.0);
 vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
 vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m=m*m; m=m*m;
 vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
 m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
 vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.0*dot(m,g);}
float fbm(vec2 p){float v=0.0,a=0.5; for(int i=0;i<4;i++){v+=a*snoise(p); p=p*1.92+vec2(17.3,9.1); a*=0.42;} return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/uRes; float asp=uRes.x/uRes.y; vec2 p=vec2(uv.x*asp,uv.y);
 float t=uT*0.011;
 vec2 q=vec2(fbm(p*0.85+vec2(t,-t*0.7)),fbm(p*0.85+vec2(-t*0.6,t)+5.2));
 float d=smoothstep(-0.55,0.75,fbm(p*0.7+q*0.6+vec2(t*0.4,t*0.25)));
 vec2 c=vec2(0.5*asp,0.54);
 float g=smoothstep(1.15,0.05,distance(p,c+vec2(-0.36*asp,0.40)));
 float k=smoothstep(1.15,0.05,distance(p,c+vec2(0.36*asp,-0.40)));
 float w=uWarm*smoothstep(1.0,0.0,distance(p,c));
 float gw=g*(1.0+uWarm*0.9)+w*0.9;
 vec3 col=mix(vec3(0.055,0.647,0.659),vec3(0.86,0.70,0.24),clamp(gw/(gw+k*(1.0-uWarm*0.45)+0.0001),0.0,1.0));
 float a=clamp((0.35+0.65*d)*(0.62*gw+0.62*k+0.07)*0.17,0.0,0.12+uWarm*0.05);
 gl_FragColor=vec4(col*a,a);
}`

export function space(root) {
  const neb = root.querySelector('.sp-neb'), stc = root.querySelector('.sp-stars'), sctx = stc.getContext('2d')
  const DPR = Math.min(devicePixelRatio || 1, 1.5), NSCALE = 0.45
  const small = () => innerWidth < 900
  let W = 0, H = 0, stars = [], gl = null, U = {}, warm = 0, warmTo = 0, raf = 0, last = 0, tick = 0, seen = true
  let mx = 0, my = 0, px = 0, py = 0
  const t0 = performance.now()

  function glInit() {
    try { gl = neb.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }) } catch { gl = null }
    if (!gl) return
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null }
    const v = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}'), f = sh(gl.FRAGMENT_SHADER, FS)
    if (!v || !f) { gl = null; return }
    const prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; return }
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    U = { res: gl.getUniformLocation(prog, 'uRes'), t: gl.getUniformLocation(prog, 'uT'), warm: gl.getUniformLocation(prog, 'uWarm') }
    gl.clearColor(0, 0, 0, 0)
  }
  function drawNeb(sec) {
    if (!gl) return
    gl.viewport(0, 0, neb.width, neb.height); gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(U.res, neb.width, neb.height); gl.uniform1f(U.t, sec); gl.uniform1f(U.warm, warm); gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  // [count, depth, drift px/s, parallax px]
  const layers = () => small() ? [[45, .3, 2, 3], [24, .6, 4, 6], [10, 1, 7, 10]] : [[130, .3, 2, 3], [64, .6, 4, 6], [26, 1, 7, 12]]
  function makeStars() {
    stars = []
    for (const [n, z, sp, par] of layers()) for (let i = 0; i < n; i++) {
      const tone = Math.random()
      stars.push({ x: Math.random() * W, y: Math.random() * H, z, sp: sp * (.6 + Math.random() * .8), par,
        r: .3 + Math.random() * .35 + z * .55, b: .3 + Math.random() * .4 + z * .2, tw: .5 + Math.random() * 1.5, ph: Math.random() * 6.283,
        c: tone < .08 ? '#E8C96E' : tone < .15 ? '#5ED6D8' : '#E8ECF6' })
    }
  }
  function drawStars(dt, now) {
    sctx.clearRect(0, 0, W, H)
    const ts = now * .001
    for (const s of stars) {
      if (dt) { s.y -= s.sp * dt; s.x -= s.sp * .35 * dt; if (s.y < -4) { s.y = H + 4; s.x = Math.random() * W } if (s.x < -4) s.x = W + 4 }
      const x = s.x - px * s.par, y = s.y - py * s.par
      sctx.globalAlpha = s.b * (RM ? .85 : .7 + .3 * Math.sin(ts * s.tw + s.ph))
      sctx.fillStyle = s.c
      if (s.r < .7) sctx.fillRect(x - s.r, y - s.r, s.r * 2, s.r * 2)
      else { sctx.beginPath(); sctx.arc(x, y, s.r, 0, 6.283); sctx.fill() }
    }
    sctx.globalAlpha = 1
  }

  function size() {
    const r = root.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height)
    stc.width = Math.round(W * DPR); stc.height = Math.round(H * DPR); sctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    neb.width = Math.max(2, Math.round(W * NSCALE)); neb.height = Math.max(2, Math.round(H * NSCALE))
    makeStars()
    if (RM) still()
  }
  function still() { drawNeb(37); drawStars(0, 0) }

  function frame(now) {
    raf = requestAnimationFrame(frame)
    if (now - last < 32) return                         // ~30fps is plenty for drifting dust
    const dt = last ? Math.min(.1, (now - last) / 1000) : 0; last = now
    px += (mx - px) * .05; py += (my - py) * .05
    const warming = Math.abs(warmTo - warm) > .002
    if (warming) warm += (warmTo - warm) * .06; else warm = warmTo
    drawStars(dt, now)
    if (warming || (tick++ & 1) === 0) drawNeb((now - t0) / 1000)   // the haze drifts slowly: 15fps unless it is warming
  }
  function run() { if (RM || raf || !seen || document.hidden) return; last = 0; raf = requestAnimationFrame(frame) }
  function stop() { cancelAnimationFrame(raf); raf = 0 }

  glInit()
  size()
  root.classList.add('on')
  if (RM) still(); else run()
  addEventListener('resize', () => { size(); if (!RM && !raf) still() })
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : run() })
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; seen ? run() : stop() }).observe(root)
  if (!RM) addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1 }, { passive: true })

  return {
    setWarm(on) { warmTo = on ? 1 : 0; if (RM) { warm = warmTo; still() } },
  }
}
