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

  const getCardColor = (id: string) => {
    const colors = ["bg-surface-bright", "bg-secondary-fixed text-black", "bg-tertiary-fixed text-black"];
    return colors[id.charCodeAt(0) % colors.length];
  };

  const isTop3 = rank < 3;

  return (
    <motion.div
      className={`border-4 border-black p-5 neubrutalist-shadow-sm ${isTop3 ? 'bg-primary text-white' : getCardColor(student._id)} relative`}
      whileHover={{ y: -4, x: -4, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        rotate: `${(student._id.charCodeAt(1) % 3) - 1}deg`
      }}
    >
      {/* Duct tape top center */}
      <div className="duct-tape w-16 h-6 -top-3 left-1/2 -translate-x-1/2 rotate-2 z-10 absolute"></div>

      <div className="flex items-start gap-3 pt-3 relative z-0">
        {/* Avatar / rank */}
        <div className={`w-11 h-11 flex items-center justify-center font-black text-lg border-3 border-black shrink-0 ${isTop3 ? 'bg-white text-black' : 'bg-black text-white'}`}>
          {isTop3 ? MEDAL[rank] : student.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-base mb-1 truncate font-[family-name:var(--font-headline)] leading-tight">
            {student.name}
          </p>
          {topAward === undefined ? (
            <div className="h-4 w-20 bg-black/10 animate-pulse border-2 border-black/20 mt-1" />
          ) : topAward === null ? (
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">Inga röster</p>
          ) : (
            <div className="mt-1">
              <p className={`text-sm font-black uppercase truncate ${isTop3 ? 'text-white drop-shadow-md' : 'text-primary'}`}>
                {topAward.award.title}
              </p>
              <p className="text-xs font-bold uppercase opacity-80">
                {topAward.count} röst{topAward.count !== 1 ? "er" : ""}
              </p>
            </div>
          )}
        </div>

        <Link
          href={`/klass/${slug}/rosta`}
          className="btn-secondary !px-3 !py-1 !text-xs self-start -rotate-1"
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner border-black" />
      </div>
    );
  }

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-grow flex flex-col relative min-h-screen">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-10">
        
        {/* Header Container */}
        <div className="bg-surface border-6 border-black p-5 sm:p-8 neubrutalist-shadow -rotate-1 mb-10 relative">
          <div className="duct-tape w-24 h-8 -top-4 -left-6 -rotate-12"></div>
          <div className="duct-tape w-24 h-8 -bottom-4 -right-6 -rotate-12"></div>

          <div className="flex items-center gap-4 flex-wrap">
            <Link href={`/klass/${slug}`} className="btn-secondary rotate-2 shrink-0">
              ← Bakåt
            </Link>
            <div className="flex-1 min-w-[200px]">
              <h1 className="font-[family-name:var(--font-headline)] text-primary text-3xl sm:text-4xl font-black uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,1)] leading-none mb-2">
                {klass.name}
              </h1>
              <p className="font-bold text-on-background bg-secondary-fixed inline-block px-2 border-2 border-black neubrutalist-shadow-sm text-sm uppercase">
                {students.length} ELEVER
              </p>
            </div>
            <Link
              href={`/klass/${slug}/rosta`}
              className="btn-primary rotate-1"
            >
              🗳 Rösta
            </Link>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="w-full sm:w-80">
            <label htmlFor="dashboard-search" className="sr-only">Sök elev</label>
            <input
              id="dashboard-search"
              type="search"
              className="input-field rotate-1"
              placeholder="🔍 Sök elev…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-bright border-4 border-black font-bold text-xs uppercase tracking-widest neubrutalist-shadow-sm rotate-[-1deg]">
            <span className="w-3 h-3 rounded-full bg-error border-2 border-black animate-pulse" />
            Live Uppdatering
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border-4 border-dashed border-black rotate-1">
            <p className="font-bold text-xl uppercase">Inga elever matchar sökningen. 👻</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {filtered.map((student, i) => (
              <StudentCard key={student._id} student={student} rank={i} slug={slug} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
