"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { use } from "react";

interface Props {
  params: Promise<{ slug: string }>;
}

const MEDAL = ["🥇", "🥈", "🥉"];

function StudentCard({
  student,
  rank,
  slug,
}: {
  student: { _id: Id<"students">; name: string };
  rank: number;
  slug: string;
}) {
  const topAward = useQuery(api.awards.getTopForStudent, { studentId: student._id });

  return (
    <motion.div
      className="glass-card"
      style={{ padding: "1.25rem", cursor: "pointer" }}
      whileHover={{ scale: 1.02, borderColor: "rgba(139, 92, 246, 0.4)" }}
      transition={{ duration: 0.15 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        {/* Avatar / rank */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: rank < 3 ? "var(--gradient)" : "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: rank < 3 ? "1.2rem" : "1rem",
            fontWeight: 800,
            color: "white",
            flexShrink: 0,
          }}
        >
          {rank < 3 ? MEDAL[rank] : student.name.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {student.name}
          </p>
          {topAward === undefined ? (
            <div style={{ height: 14, width: 80, background: "rgba(255,255,255,0.06)", borderRadius: 4 }} />
          ) : topAward === null ? (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Inga röster än</p>
          ) : (
            <div>
              <p style={{ fontSize: "0.78rem", color: "#a78bfa", fontWeight: 500 }}>
                {topAward.award.title}
              </p>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {topAward.count} röst{topAward.count !== 1 ? "er" : ""}
              </p>
            </div>
          )}
        </div>

        <Link
          href={`/klass/${slug}/rosta`}
          className="btn-ghost"
          style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", textDecoration: "none", flexShrink: 0 }}
        >
          Rösta
        </Link>
      </div>
    </motion.div>
  );
}

export default function DashboardPage({ params }: Props) {
  const { slug } = use(params);
  const klass = useQuery(api.classes.getBySlug, { slug });
  const classId = klass?._id;
  const students = useQuery(
    api.students.getByClass,
    classId ? { classId } : "skip"
  );

  const [search, setSearch] = useState("");

  if (!klass || !students) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main style={{ position: "relative", minHeight: "100vh" }}>
      <div className="bg-orb bg-orb-violet" />
      <div className="bg-orb bg-orb-pink" />

      <div style={{ position: "relative", zIndex: 1, padding: "2rem 1.25rem", maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          <Link href={`/klass/${slug}`} className="btn-ghost" style={{ textDecoration: "none" }}>
            ←
          </Link>
          <div style={{ flex: 1 }}>
            <h1 className="font-outfit gradient-text" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, lineHeight: 1.2 }}>
              {klass.name}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {students.length} elever · live-uppdateringar aktiverade
            </p>
          </div>
          <Link
            href={`/klass/${slug}/rosta`}
            className="btn-primary"
            style={{ textDecoration: "none", fontSize: "0.9rem", padding: "0.625rem 1.25rem" }}
          >
            🗳 Rösta
          </Link>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: "1.5rem", maxWidth: 380 }}>
          <input
            id="dashboard-search"
            type="search"
            className="input-field"
            placeholder="🔍 Sök elev…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Live indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.3rem 0.875rem",
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.25)",
            borderRadius: "9999px",
            fontSize: "0.78rem",
            color: "#4ade80",
            marginBottom: "1.5rem",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
              animation: "fadeIn 1s ease infinite alternate",
            }}
          />
          Live · uppdateras automatiskt
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
            Inga elever matchar sökningen.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {filtered.map((student, i) => (
              <StudentCard key={student._id} student={student} rank={i} slug={slug} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
