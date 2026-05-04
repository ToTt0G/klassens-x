"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { use } from "react";

interface Props {
  params: Promise<{ slug: string }>;
}

function StudentCard({
  student,
  slug,
}: {
  student: { _id: Id<"students">; name: string };
  slug: string;
}) {
  const statsResult = useQuery(api.nicknames.getAllStatsForStudent, { studentId: student._id });
  const [isExpanded, setIsExpanded] = useState(false);

  const getCardColor = (id: string) => {
    const s = String(id);
    const colors = [
      "bg-card-yellow",
      "bg-card-blue",
      "bg-card-pink",
      "bg-card-green",
      "bg-card-purple",
      "bg-card-orange",
      "bg-card-teal",
      "bg-card-indigo",
      "bg-card-rose",
      "bg-card-amber",
      "bg-card-cyan",
      "bg-card-lime",
    ];
    let sum = 0;
    for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
    return colors[sum % colors.length];
  };

  const hasVotes = statsResult !== undefined && statsResult.totalVotes > 0;
  const topNickname = hasVotes ? statsResult.nicknames[0] : null;

  // Pie chart colors
  const pieColors = ["#FF3B30", "#34C759", "#007AFF", "#FF9500", "#AF52DE", "#FF2D55"];
  
  let cumulativePercent = 0;
  const conicStops = hasVotes ? statsResult.nicknames.map((stat, i) => {
    const percent = (stat.count / statsResult.totalVotes) * 100;
    const start = cumulativePercent;
    cumulativePercent += percent;
    return `${pieColors[i % pieColors.length]} ${start}% ${cumulativePercent}%`;
  }).join(", ") : "";

  return (
    <motion.div
      className={`border-4 border-black p-5 neubrutalist-shadow-sm ${getCardColor(student._id)} relative cursor-pointer flex flex-col transition-colors duration-200 hover:bg-white`}
      whileHover={{ y: -4, x: -4, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        rotate: `${(student._id.charCodeAt(1) % 3) - 1}deg`
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Duct tape top center */}
      <div className="duct-tape w-16 h-6 -top-3 left-1/2 -translate-x-1/2 rotate-2 z-10 absolute"></div>

      <div className="flex flex-col sm:flex-row items-center gap-4 pt-3 relative z-0">
        {/* Avatar */}
        <div className="w-16 h-16 sm:w-11 sm:h-11 flex items-center justify-center font-black text-2xl sm:text-lg border-3 border-black shrink-0 bg-black text-white neubrutalist-shadow-sm">
          {student.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <p className="font-bold text-xl sm:text-base mb-1 line-clamp-2 break-words font-[family-name:var(--font-headline)] leading-tight">
            {student.name}
          </p>
          {statsResult === undefined ? (
            <div className="h-4 w-20 bg-black/10 animate-pulse border-2 border-black/20 mt-1 mx-auto sm:mx-0" />
          ) : (
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">
              {hasVotes ? `${statsResult.totalVotes} röst${statsResult.totalVotes !== 1 ? "er" : ""}` : "Inga röster"}
            </p>
          )}
        </div>

        <Link
          href={`/klass/${slug}/rosta?studentId=${student._id}`}
          className="btn-secondary !px-6 sm:!px-3 !py-2 sm:!py-1 !text-sm sm:!text-xs self-stretch sm:self-start -rotate-1"
          onClick={(e) => e.stopPropagation()}
        >
          Rösta
        </Link>
      </div>

      {isExpanded && statsResult !== undefined && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-4 border-t-4 border-black border-dashed flex flex-col gap-4 overflow-hidden"
        >
          {!hasVotes ? (
            <p className="text-sm font-bold text-center opacity-70">Ingen har röstat än!</p>
          ) : (
            <>
              <div className="text-center">
                <p className="font-[family-name:var(--font-headline)] text-2xl uppercase font-black text-primary drop-shadow-[2px_2px_0_rgba(255,255,255,1)] leading-tight">
                  Klassens {topNickname!.nickname.title}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-3 pr-3 pl-1">
                <div 
                  className="w-20 h-20 rounded-full border-4 border-black shrink-0 neubrutalist-shadow-sm" 
                  style={{ background: `conic-gradient(${conicStops})` }} 
                />
                <div className="flex-1 w-full space-y-2">
                  {statsResult.nicknames.map((stat, i) => (
                    <div key={stat.nickname._id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-3 h-3 rounded-full border-2 border-black shrink-0" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                        <span className="font-bold truncate">{stat.nickname.title}</span>
                      </div>
                      <span className="font-black shrink-0">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
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
  const [copied, setCopied] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const addStudent = useMutation(api.students.add);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!classId || !newStudentName.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      await addStudent({ classId, name: newStudentName.trim() });
      setNewStudentName("");
      setShowAddStudent(false);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setAdding(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/klass/${slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: klass?.name, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!klass || !students) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="spinner border-black" />
      </div>
    );
  }

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-grow flex flex-col relative">
      <div className="w-full pb-6 pt-2 sm:pb-10 sm:pt-0">
        
        {/* Header Container */}
        <div className="bg-surface border-4 sm:border-8 border-black p-5 sm:p-8 neubrutalist-shadow -rotate-1 mb-10 relative">
          <div className="duct-tape w-24 h-8 -top-4 -left-6 -rotate-12"></div>
          <div className="duct-tape w-24 h-8 -bottom-4 -right-6 -rotate-12"></div>

          <div className="flex flex-col gap-6">
            {/* Top Row: Back, Title, and Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
                <Link href={`/klass/${slug}`} className="btn-secondary !px-4 !py-2 !text-sm sm:!text-base rotate-2 shrink-0 self-start sm:self-center">
                  ← Bakåt
                </Link>
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0 w-full md:w-auto">
                  <h1 className="font-[family-name:var(--font-headline)] text-primary text-3xl sm:text-4xl font-black uppercase drop-shadow-[3px_3px_0_rgba(0,0,0,1)] leading-none mb-2 truncate w-full">
                    {klass.name}
                  </h1>
                  <p className="font-bold text-on-background bg-secondary-fixed inline-block px-3 py-1 border-4 border-black neubrutalist-shadow-sm text-xs sm:text-sm uppercase -rotate-1">
                    {students.length} ELEVER
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full md:w-auto">
                <button
                  id="dashboard-share-btn"
                  onClick={handleShare}
                  className="btn-secondary !py-2 md:!py-3 !px-4 !text-sm sm:!text-base -rotate-1 w-full sm:w-auto"
                >
                  {copied ? "✓ Kopierad!" : "🔗 Dela länk"}
                </button>
                <Link
                  href={`/klass/${slug}/rosta`}
                  className="btn-primary !py-2 md:!py-3 !px-4 !text-sm sm:!text-base rotate-1 w-full sm:w-auto"
                >
                  🗳 Rösta
                </Link>
              </div>
            </div>

            {/* Bottom row: Controls */}
            <div className="flex flex-col gap-4 border-t-4 border-black border-dashed pt-6 mt-2">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 w-full">
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

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    id="dashboard-add-student-btn"
                    className="btn-secondary rotate-1 !text-xs !py-3 px-6 flex-1 md:flex-none"
                    onClick={() => { setShowAddStudent((v) => !v); setAddError(""); }}
                  >
                    {showAddStudent ? "× Avbryt" : "➕ Ny elev"}
                  </button>
                  <div className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-bright border-4 border-black font-bold text-[10px] sm:text-xs uppercase tracking-widest neubrutalist-shadow-sm rotate-[-1deg] flex-1 md:flex-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-error border-2 border-black animate-pulse" />
                    <span className="hidden sm:inline">Live Uppdatering</span>
                    <span className="sm:hidden">Live</span>
                  </div>
                </div>
              </div>

              {/* Add student inline form */}
              {showAddStudent && (
                <form
                  onSubmit={handleAddStudent}
                  className="flex gap-3 items-start border-4 border-black border-dashed p-4 bg-secondary-fixed -rotate-1"
                >
                  <div className="flex-1">
                    <label htmlFor="new-student-name" className="sr-only">Elevens namn</label>
                    <input
                      id="new-student-name"
                      type="text"
                      className="input-field rotate-1 w-full"
                      placeholder="Elevens namn…"
                      value={newStudentName}
                      onChange={(e) => { setNewStudentName(e.target.value); setAddError(""); }}
                      autoFocus
                      disabled={adding}
                    />
                    {addError && (
                      <p className="text-xs font-bold text-error mt-1 ml-1">{addError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn-primary rotate-1 shrink-0"
                    disabled={adding || !newStudentName.trim()}
                  >
                    {adding ? "Sparar…" : "✓ Lägg till"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border-4 border-dashed border-black rotate-1">
            <p className="font-bold text-xl uppercase">Inga elever matchar sökningen. 👻</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-12 items-start">
            {filtered.map((student) => (
              <StudentCard key={student._id} student={student} slug={slug} />
            ))}
          </div>
        )}

      </div>

      {/* By Luka badge */}
      <div className="flex justify-center pb-4 mt-auto">
        <a 
          href="https://portfolio.redsunsetfarm.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 border-3 border-black px-3 py-1.5 font-[family-name:var(--font-label)] uppercase text-xs font-bold neubrutalist-shadow-sm bg-white -rotate-1 hover:scale-105 transition-transform duration-200"
        >
          <span className="text-base drop-shadow-sm">❤️</span>
          <span className="tracking-wide">Av Luka Koehler</span>
        </a>
      </div>
    </main>
  );
}
