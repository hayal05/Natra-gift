// Little illustrated scenes for the template cards on the landing page (pure SVG, no image files).
// The card supplies the sky (a CSS gradient); this draws the land, water, flowers or field at the bottom.

export type SceneConfig = {
  kind: "land" | "flowers" | "field";
  sky: [string, string];
  sun?: string;
  layers?: [string, string, string];
  water?: boolean;
  couple?: boolean;
  route?: boolean;
  confetti?: boolean;
  bloom?: [string, string];
};

const CONFETTI: Array<[number, number, string]> = [
  [18, 22, "#ffffff"], [44, 12, "#ffd166"], [70, 30, "#ef8fb4"], [96, 10, "#8fd3f4"], [128, 26, "#ffffff"],
  [152, 14, "#ffd166"], [176, 32, "#ef8fb4"], [30, 48, "#8fd3f4"], [164, 52, "#ffffff"], [112, 44, "#ffd166"],
];

const ROSES: Array<[number, number, number]> = [[58, 96, 15], [100, 86, 19], [142, 96, 15], [80, 108, 13], [122, 108, 14]];
const LEAVES: Array<[number, number, number]> = [[34, 102, -35], [166, 102, 35], [74, 84, -60], [128, 84, 60], [100, 70, 0]];

// Sunflowers: four rows, bigger towards the front.
const SUNFLOWERS = [0, 1, 2, 3].flatMap((row) => {
  const size = 3.6 + row * 2.6;
  const step = size * 2.5;
  const out: Array<[number, number, number]> = [];
  for (let x = -((row * 7) % 11); x < 210; x += step) out.push([x, 72 + row * 14, size]);
  return out;
});

export default function TemplateScene({ id, className, ...c }: SceneConfig & { id: string; className?: string }) {
  const [l0, l1, l2] = c.layers ?? ["#c9a3a0", "#9d7b86", "#4d4050"];
  const sun = c.sun ?? "#fff0c8";
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor={sun} stopOpacity=".95" />
          <stop offset="1" stopColor={sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={l0} stopOpacity=".9" />
          <stop offset="1" stopColor={l2} />
        </linearGradient>
        <linearGradient id={`${id}-grass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9aa65a" />
          <stop offset="1" stopColor="#5d6b34" />
        </linearGradient>
      </defs>

      {c.kind === "land" && (
        <>
          <circle cx="100" cy="60" r="38" fill={`url(#${id}-glow)`} />
          <circle cx="100" cy="60" r="10" fill={sun} />
          <path d="M0 74 L38 48 L72 66 L112 40 L150 64 L200 50 V120 H0Z" fill={l0} opacity=".85" />
          <path d="M0 88 Q50 62 100 82 T200 74 V120 H0Z" fill={l1} />
          {c.water ? (
            <>
              <rect x="0" y="86" width="200" height="34" fill={`url(#${id}-water)`} />
              <rect x="93" y="88" width="14" height="30" rx="7" fill={sun} opacity=".35" />
              <path d="M0 98 Q32 90 64 102 V120 H0Z" fill={l2} />
              <path d="M146 102 Q174 92 200 98 V120 H146Z" fill={l2} />
            </>
          ) : (
            <path d="M0 100 Q60 88 120 98 T200 94 V120 H0Z" fill={l2} />
          )}
          {[8, 16, 24, 176, 186].map((x, i) => (
            <path key={x} d={`M${x} ${c.water ? 99 : 97 - (i > 2 ? 2 : 0)} l3.5 -12 l3.5 12z`} fill={l2} />
          ))}
          {c.couple && (
            <g fill={l2}>
              <circle cx="76" cy="93" r="3.3" />
              <circle cx="85" cy="94" r="3.3" />
              <path d="M70.5 105 Q71 96 76 96 Q81 96 81.5 105Z" />
              <path d="M79 105 Q79.5 97 85 97 Q90 97 90.5 105Z" />
            </g>
          )}
          {c.route && (
            <g>
              <path d="M44 74 Q100 22 156 74" fill="none" stroke="#fff" strokeWidth="1.6" strokeDasharray="3 3.5" strokeLinecap="round" />
              <circle cx="44" cy="74" r="3.4" fill="#fff" />
              <circle cx="156" cy="74" r="3.4" fill="#fff" />
            </g>
          )}
          {c.confetti && CONFETTI.map(([x, y, fill], i) => (
            i % 2 ? <circle key={i} cx={x} cy={y} r="1.8" fill={fill} /> : <rect key={i} x={x} y={y} width="3.4" height="2" rx=".6" fill={fill} transform={`rotate(${i * 25} ${x} ${y})`} />
          ))}
        </>
      )}

      {c.kind === "flowers" && (
        <>
          {LEAVES.map(([x, y, rot], i) => (
            <ellipse key={i} cx={x} cy={y} rx="7" ry="18" fill={i % 2 ? "#6f7f55" : "#869469"} transform={`rotate(${rot} ${x} ${y + 12})`} />
          ))}
          {ROSES.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill={c.bloom?.[0] ?? "#fffdf7"} stroke="rgba(0,0,0,.08)" strokeWidth=".6" />
              <circle cx={x + r * 0.08} cy={y - r * 0.05} r={r * 0.68} fill={c.bloom?.[1] ?? "#f3ecdc"} />
              <circle cx={x - r * 0.04} cy={y} r={r * 0.4} fill={c.bloom?.[0] ?? "#fffdf7"} stroke="rgba(0,0,0,.07)" strokeWidth=".5" />
              <circle cx={x} cy={y} r={r * 0.16} fill={c.bloom?.[1] ?? "#e8dcc4"} />
            </g>
          ))}
        </>
      )}

      {c.kind === "field" && (
        <>
          <circle cx="100" cy="64" r="40" fill={`url(#${id}-glow)`} />
          <path d="M0 70 Q60 58 120 68 T200 64 V120 H0Z" fill={`url(#${id}-grass)`} />
          {SUNFLOWERS.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill="#f6b92a" />
              <circle cx={x} cy={y} r={r * 0.62} fill="#e79a14" />
              <circle cx={x} cy={y} r={r * 0.42} fill="#5e3b1d" />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
