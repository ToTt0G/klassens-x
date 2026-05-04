"use client";
import { motion, AnimatePresence } from "framer-motion";

interface VoteSlice {
  awardId: string;
  title: string;
  count: number;
}

interface Props {
  data: VoteSlice[];
  studentName: string;
  onNext: () => void;
}

const COLORS = [
  "#a78bfa", // violet
  "#f472b6", // pink
  "#fbbf24", // amber
  "#34d399", // emerald
  "#60a5fa", // blue
  "#fb923c", // orange
];

export default function VotePieChart({ data, studentName, onNext }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Build SVG conic gradient segments
  let cumulativePct = 0;
  const slices = data.map((d, i) => {
    const pct = d.count / total;
    const start = cumulativePct * 360;
    const end = (cumulativePct + pct) * 360;
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
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.35 }}
        className="glass-card"
        style={{ padding: "2rem", textAlign: "center" }}
      >
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
          Röster för
        </p>
        <h3
          className="font-outfit"
          style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.5rem" }}
        >
          {studentName}
        </h3>

        {/* SVG Pie Chart */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <motion.svg
            viewBox="0 0 200 200"
            width={180}
            height={180}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {slices.length === 1 ? (
              // Full circle if only one award
              <circle cx={100} cy={100} r={80} fill={slices[0].color} />
            ) : (
              slices.map((slice, i) => (
                <motion.path
                  key={slice.awardId}
                  d={describeArc(slice.start, slice.end)}
                  fill={slice.color}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                />
              ))
            )}
            {/* Center hole */}
            <circle cx={100} cy={100} r={40} fill="#0f172a" />
            {/* Total count */}
            <text
              x={100}
              y={97}
              textAnchor="middle"
              fill="white"
              fontSize={18}
              fontWeight="bold"
              fontFamily="Inter, sans-serif"
            >
              {total}
            </text>
            <text
              x={100}
              y={113}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={10}
              fontFamily="Inter, sans-serif"
            >
              röster
            </text>
          </motion.svg>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.75rem" }}>
          {slices.map((slice, i) => (
            <motion.div
              key={slice.awardId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: slice.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                {slice.title}
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {Math.round(slice.pct * 100)}%
              </span>
            </motion.div>
          ))}
        </div>

        <button className="btn-primary" style={{ width: "100%" }} onClick={onNext}>
          Nästa elev →
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
