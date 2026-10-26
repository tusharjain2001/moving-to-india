// Route map: Singapore and Kuala Lumpur to five Indian cities, on a dot grid.
const SIN = [500, 352];
const KUL = [462, 318];
const IN = { DEL: [196, 96], BOM: [124, 214], HYD: [206, 232], BLR: [182, 300], MAA: [238, 296] };
const arc = ([x1, y1], [x2, y2], lift) => `M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - lift} ${x2} ${y2}`;
// One route per Indian city (Delhi from Kuala Lumpur, the rest from Singapore).
const routeOf = (code) => {
  const [x, y] = IN[code];
  return code === "DEL" ? arc(KUL, [x, y], 90) : arc(SIN, [x, y], 60 + (300 - y) / 3);
};
// Planes fly three of the routes, one after another.
const PLANES = [["BOM", 0], ["DEL", 1.8], ["MAA", 3.6]];

export function HeroMap() {
  return (
    <svg className="hero-map" viewBox="0 0 600 420" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">
      <defs>
        <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="rgba(255,255,255,0.13)" />
        </pattern>
        <radialGradient id="fade" cx="60%" cy="50%" r="60%">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="fade-mask"><rect width="600" height="420" fill="url(#fade)" /></mask>
      </defs>
      <rect width="600" height="420" fill="url(#dots)" mask="url(#fade-mask)" />

      {Object.keys(IN).map((code) => <path key={`r-${code}`} d={routeOf(code)} className="hero-route" />)}

      {PLANES.map(([code, delay]) => (
        <g key={`p-${code}`} className="hero-plane">
          <path d="M-7 -2 L4 -2 L8 0 L4 2 L-7 2 L-9 5 L-11 5 L-9 0 L-11 -5 L-9 -5 Z M-2 -2 L-5 -9 L-2 -9 L3 -2 Z M-2 2 L-5 9 L-2 9 L3 2 Z" fill="#ffffff" />
          {/* A negative start puts each plane part-way along its route from the first frame. */}
          <animateMotion dur="5.4s" begin={`-${delay}s`} repeatCount="indefinite" rotate="auto" path={routeOf(code)} />
        </g>
      ))}

      {Object.entries(IN).map(([code, [x, y]]) => (
        <g key={code}>
          <circle cx={x} cy={y} r="11" className="hero-pulse" />
          <circle cx={x} cy={y} r="4.5" fill="#5eead4" />
          <text x={x + 10} y={y - 9} className="hero-code">{code}</text>
        </g>
      ))}
      {[["SIN", SIN, 12, 18], ["KUL", KUL, -40, -8]].map(([code, [x, y], dx, dy]) => (
        <g key={code}>
          <circle cx={x} cy={y} r="5" fill="#ffffff" />
          <text x={x + dx} y={y + dy} className="hero-code">{code}</text>
        </g>
      ))}
    </svg>
  );
}
