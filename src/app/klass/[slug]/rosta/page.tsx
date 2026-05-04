"use client";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getOrCreateVoterId } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import VotePieChart from "@/components/VotePieChart";
import ProgressBar from "@/components/ProgressBar";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { use } from "react";

interface Props {
  params: Promise<{ slug: string }>;
}

type Phase = "voting" | "chart" | "done";

export default function VotingPage({ params }: Props) {
  const { slug } = use(params);

  const klass = useQuery(api.classes.getBySlug, { slug });
  const classId = klass?._id;

  const students = useQuery(
    api.students.getByClass,
    classId ? { classId } : "skip"
  );
  const awards = useQuery(
    api.awards.getByClass,
    classId ? { classId } : "skip"
  );

  const [voterId, setVoterId] = useState<string>("");
  useEffect(() => {
    setVoterId(getOrCreateVoterId(slug));
  }, [slug]);

  const votedIds = useQuery(
    api.votes.getVotedStudentIds,
    classId && voterId ? { classId, voterId } : "skip"
  );

  const getOrCreateAward = useMutation(api.awards.getOrCreate);
  const castVote = useMutation(api.votes.cast);

  // Queue of students yet to be voted on
  const [queueIndexes, setQueueIndexes] = useState<number[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Build queue once we have all data
  useEffect(() => {
    if (!students || !votedIds || initialized) return;
    const votedSet = new Set(votedIds);
    const queue = students
      .map((_, i) => i)
      .filter((i) => !votedSet.has(students[i]._id));
    setQueueIndexes(queue);
    setInitialized(true);
  }, [students, votedIds, initialized]);

  const [phase, setPhase] = useState<Phase>("voting");
  const [selectedAwardIds, setSelectedAwardIds] = useState<Id<"awards">[]>([]);
  const [customAwardText, setCustomAwardText] = useState("");
  const [chartData, setChartData] = useState<{ awardId: string; title: string; count: number }[]>([]);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);

  const currentStudentIndex = queueIndexes[0] ?? -1;
  const currentStudent = currentStudentIndex >= 0 ? students?.[currentStudentIndex] : null;

  // Vote data for current student (for pie chart after voting)
  const studentVotes = useQuery(
    api.votes.getByStudent,
    currentStudent ? { studentId: currentStudent._id } : "skip"
  );

  function toggleAward(id: Id<"awards">) {
    setSelectedAwardIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev; // max 2 existing
      return [...prev, id];
    });
  }

  const advanceQueue = useCallback(() => {
    setQueueIndexes((prev) => prev.slice(1));
    setPhase("voting");
    setSelectedAwardIds([]);
    setCustomAwardText("");
    setDirection(1);
  }, []);

  async function handleVote() {
    if (!currentStudent || !classId || !voterId) return;
    if (selectedAwardIds.length === 0 && !customAwardText.trim()) return;

    setSubmitting(true);
    try {
      const awardIds: Id<"awards">[] = [...selectedAwardIds];

      // Resolve custom award via fuzzy merge
      if (customAwardText.trim()) {
        const customId = await getOrCreateAward({
          classId,
          title: customAwardText.trim(),
        });
        awardIds.push(customId);
      }

      await castVote({
        classId,
        studentId: currentStudent._id,
        awardIds,
        voterId,
      });

      setPhase("chart");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkip() {
    setDirection(1);
    advanceQueue();
  }

  function handleNextAfterChart() {
    setDirection(1);
    advanceQueue();
  }

  // ── Loading state ─────────────────────────────────────────────
  if (!klass || !students || !votedIds || !initialized) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  const votedCount = (students?.length ?? 0) - queueIndexes.length;

  // ── All done ─────────────────────────────────────────────────
  if (queueIndexes.length === 0 && initialized) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative" }}>
        <div className="bg-orb bg-orb-violet" />
        <div className="bg-orb bg-orb-pink" />
        <div className="glass-card animate-scale-in" style={{ padding: "3rem 2rem", textAlign: "center", maxWidth: 400, position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎊</div>
          <h1 className="font-outfit gradient-text" style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.75rem" }}>
            Klart!
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            Du har röstat på alla elever i {klass.name}. Kolla in resultatet i dashboarden!
          </p>
          <Link href={`/klass/${slug}/dashboard`} className="btn-primary" style={{ textDecoration: "none" }}>
            📊 Se resultaten →
          </Link>
        </div>
      </main>
    );
  }

  // ── Main voting UI ───────────────────────────────────────────
  return (
    <main style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <div className="bg-orb bg-orb-violet" />
      <div className="bg-orb bg-orb-pink" />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          padding: "2rem 1.25rem",
        }}
      >
        {/* Header */}
        <div style={{ width: "100%", maxWidth: 500, display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <Link href={`/klass/${slug}`} className="btn-ghost" style={{ textDecoration: "none" }}>
            ←
          </Link>
          <div style={{ flex: 1 }}>
            <ProgressBar current={votedCount} total={students.length} />
          </div>
        </div>

        {/* Card area */}
        <div style={{ width: "100%", maxWidth: 500 }}>
          <AnimatePresence mode="wait">
            {phase === "voting" && currentStudent && (
              <motion.div
                key={`vote-${currentStudent._id}`}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -60 }}
                transition={{ duration: 0.3 }}
              >
                <div className="glass-card" style={{ padding: "2rem" }}>
                  {/* Student name */}
                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: "var(--gradient)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.75rem",
                        margin: "0 auto 1rem",
                        fontWeight: 800,
                        color: "white",
                      }}
                    >
                      {currentStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="font-outfit" style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                      {currentStudent.name}
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Välj upp till 2 utmärkelser och/eller skriv en egen
                    </p>
                  </div>

                  {/* Existing award chips */}
                  {awards && awards.length > 0 && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Välj befintliga
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {awards.map((award) => (
                          <button
                            key={award._id}
                            className={`award-chip ${selectedAwardIds.includes(award._id) ? "selected" : ""}`}
                            onClick={() => toggleAward(award._id)}
                            disabled={!selectedAwardIds.includes(award._id) && selectedAwardIds.length >= 2}
                          >
                            {selectedAwardIds.includes(award._id) ? "✓ " : ""}{award.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="divider" style={{ margin: "1.25rem 0" }} />

                  {/* Custom award input */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      htmlFor="custom-award"
                      style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}
                    >
                      Egen utmärkelse (valfritt)
                    </label>
                    <input
                      id="custom-award"
                      type="text"
                      className="input-field"
                      placeholder="t.ex. Klassens Musikant"
                      value={customAwardText}
                      onChange={(e) => setCustomAwardText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleVote(); }}
                    />
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      className="btn-secondary"
                      style={{ flex: "0 0 auto" }}
                      onClick={handleSkip}
                    >
                      Hoppa över
                    </button>
                    <button
                      className="btn-primary"
                      style={{ flex: 1 }}
                      disabled={submitting || (selectedAwardIds.length === 0 && !customAwardText.trim())}
                      onClick={handleVote}
                    >
                      {submitting ? (
                        <><span className="spinner" style={{ width: "1rem", height: "1rem", borderWidth: "2px" }} /> Sparar…</>
                      ) : (
                        "Rösta ✓"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "chart" && currentStudent && (
              <motion.div
                key={`chart-${currentStudent._id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                {studentVotes && studentVotes.length > 0 ? (
                  <VotePieChart
                    data={studentVotes}
                    studentName={currentStudent.name}
                    onNext={handleNextAfterChart}
                  />
                ) : (
                  // Fallback if votes haven't loaded yet
                  <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
                    <div className="spinner" style={{ margin: "0 auto 1rem" }} />
                    <button className="btn-primary" style={{ width: "100%" }} onClick={handleNextAfterChart}>
                      Nästa elev →
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
