"use client";
import { motion, AnimatePresence } from "framer-motion";

interface VoteSlice {
  nicknameId: string;
  title: string;
  count: number;
}

interface Props {
  data: VoteSlice[];
  studentName: string;
  onNext: () => void;
  nextButtonText?: string;
}

const COLORS = [
  "#FF007A", // primary pink
  "#dfed00", // secondary yellow
  "#00dbe9", // tertiary cyan
  "#ffffff", // white
];

export default function VotePieChart({ data, studentName, onNext, nextButtonText = "Nästa elev →" }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Build SVG conic gradient segments
  let cumulativePct = 0;
  const slices = data.map((d, i) => {
    const pct = d.count / total;
    const start = cumulativePct * 360;
    const end = (cumulativePct + pct) * 360;
    // eslint-disable-next-line react-hooks/immutability
    cumulativePct += pct;
    return { ...d, pct, start, end, color: COLORS[i % COLORS.length] };
  });

  // Build SVG path for each slice
  function describeArc(start: number, end: number, r = 80) {
    const cx = 100;
    const cy = 100;
    const startRad = ((start - 90) * Math.PI) / 180;
    const endRad = ((end - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = end - start > 180 ? 1 : 0;
    // To give slices hard borders, we draw lines back to the center
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  return (
    <AnimatePresence>
      <div className="flex flex-col text-center w-full relative">
        <p className="text-sm font-bold uppercase tracking-widest text-on-background mb-1">
          Röster för
        </p>
        <h3 className="font-[family-name:var(--font-headline)] text-2xl font-black mb-6">
          {studentName}
        </h3>

        {/* SVG Pie Chart */}
        <div className="flex justify-center mb-6 relative z-10">
          <motion.svg
            viewBox="0 0 200 200"
            width={180}
            height={180}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="drop-shadow-[6px_6px_0_rgba(0,0,0,1)]"
          >
            {slices.length === 1 ? (
              // Full circle if only one award
              <circle cx={100} cy={100} r={80} fill={slices[0].color} stroke="black" strokeWidth="6" />
            ) : (
              slices.map((slice, i) => (
                <motion.path
                  key={slice.nicknameId}
                  d={describeArc(slice.start, slice.end)}
                  fill={slice.color}
                  stroke="black"
                  strokeWidth="4"
                  strokeLinejoin="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                />
              ))
            )}
            {/* Center hole - brutalist style */}
            <circle cx={100} cy={100} r={40} fill="white" stroke="black" strokeWidth="4" />
            
            {/* Total count */}
            <text
              x={100}
              y={95}
              textAnchor="middle"
              fill="black"
              fontSize={24}
              fontWeight="900"
              fontFamily="var(--font-headline)"
            >
              {total}
            </text>
            <text
              x={100}
              y={115}
              textAnchor="middle"
              fill="black"
              fontSize={12}
              fontWeight="bold"
              fontFamily="var(--font-label)"
            >
              RÖSTER
            </text>
          </motion.svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 mb-6 bg-surface-container border-4 border-black p-3 rotate-1 neubrutalist-shadow-sm">
          {slices.map((slice, i) => (
            <motion.div
              key={slice.nicknameId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="flex items-center gap-3 text-left border-b-2 border-black last:border-0 pb-2 last:pb-0"
            >
              <span
                className="w-4 h-4 border-2 border-black shrink-0"
                style={{ background: slice.color }}
              />
              <span className="flex-1 text-sm font-bold font-[family-name:var(--font-label)] uppercase">
                {slice.title}
              </span>
              <span className="text-base font-black font-[family-name:var(--font-headline)]">
                {Math.round(slice.pct * 100)}%
              </span>
            </motion.div>
          ))}
        </div>

        <button className="btn-primary w-full -rotate-1" onClick={onNext}>
          {nextButtonText}
        </button>
      </div>
    </AnimatePresence>
  );
}
