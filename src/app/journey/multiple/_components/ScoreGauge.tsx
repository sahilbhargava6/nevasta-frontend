/** Semi-circular credit-score gauge, ported from the design's lfbtScoreGaugeSVG(score). */

const CX = 100;
const CY = 100;
const R = 73;
const SW = 20;

const ZONES = [
  { min: 300, max: 580, color: '#F43F5E', label: 'POOR' },
  { min: 580, max: 670, color: '#F59E0B', label: 'FAIR' },
  { min: 670, max: 740, color: '#3B82F6', label: 'GOOD' },
  { min: 740, max: 900, color: '#10B981', label: 'EXCELLENT' },
];

const toRad = (d: number) => (d * Math.PI) / 180;
const scoreToAngle = (s: number) => 180 - ((s - 300) / 600) * 180;
const pt = (deg: number, rad: number): [string, string] => [(CX + rad * Math.cos(toRad(deg))).toFixed(2), (CY - rad * Math.sin(toRad(deg))).toFixed(2)];
const arcD = (a1: number, a2: number) => {
  const p1 = pt(a1, R);
  const p2 = pt(a2, R);
  return `M ${p1[0]},${p1[1]} A ${R},${R} 0 0,1 ${p2[0]},${p2[1]}`;
};

export default function ScoreGauge({ score }: { score: number | null }) {
  const clamped = score == null ? null : Math.min(900, Math.max(300, score));
  const needle = clamped == null ? null : pt(scoreToAngle(clamped), 55);

  return (
    <svg viewBox="0 0 200 118" width="188" height="111" className="block mx-auto max-w-full h-auto" role="img" aria-label={score == null ? 'Credit score gauge' : `Credit score gauge showing ${score}`}>
      {ZONES.map((z) => (
        <path key={z.label} d={arcD(scoreToAngle(z.min), scoreToAngle(z.max))} fill="none" stroke={z.color} strokeWidth={SW} strokeLinecap="butt" />
      ))}
      {ZONES.map((z) => {
        const mid = scoreToAngle((z.min + z.max) / 2);
        const [x, y] = pt(mid, R);
        return (
          <text
            key={z.label}
            x={x}
            y={y}
            fill="rgba(255,255,255,0.95)"
            fontSize="6"
            fontWeight="800"
            fontFamily="system-ui,sans-serif"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${(90 - mid).toFixed(1)},${x},${y})`}
          >
            {z.label}
          </text>
        );
      })}
      {needle && <line x1={CX} y1={CY} x2={needle[0]} y2={needle[1]} stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />}
      <circle cx={CX} cy={CY} r="8" fill="#0F172A" />
      <circle cx={CX} cy={CY} r="4" fill="#fff" />
      <text x="26" y={CY + 14} fill="#64748B" fontSize="9" fontFamily="sans-serif" textAnchor="middle">
        300
      </text>
      <text x="174" y={CY + 14} fill="#64748B" fontSize="9" fontFamily="sans-serif" textAnchor="middle">
        900
      </text>
    </svg>
  );
}
