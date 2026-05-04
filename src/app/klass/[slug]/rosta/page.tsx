"use client";
import { useEffect, useState, useCallback, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getOrCreateVoterId } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import VotePieChart from "@/components/VotePieChart";
import ProgressBar from "@/components/ProgressBar";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

type Phase = "voting" | "chart" | "done";

export default function VotingPage({ params, searchParams }: Props) {
  const { slug } = use(params);
  const searchParamsResolved = use(searchParams);
  const targetStudentId = searchParamsResolved.studentId as string;

  const klass = useQuery(api.classes.getBySlug, { slug });
  const classId = klass?._id;

  const students = useQuery(
    api.students.getByClass,
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

  const getOrCreateNickname = useMutation(api.nicknames.getOrCreate);
  const castVote = useMutation(api.votes.cast);

  const [queueIndexes, setQueueIndexes] = useState<number[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!students || !votedIds || initialized) return;
    const votedSet = new Set(votedIds);
    let queue: number[] = [];

    if (targetStudentId) {
      const index = students.findIndex((s) => s._id === targetStudentId);
      if (index !== -1) {
        queue = [index];
      }
    }

    if (queue.length === 0 && !targetStudentId) {
      queue = students
        .map((_, i) => i)
        .filter((i) => !votedSet.has(students[i]._id));
    }
    
    setQueueIndexes(queue);
    setInitialized(true);
  }, [students, votedIds, initialized, targetStudentId]);

  const [phase, setPhase] = useState<Phase>("voting");
  // Nicknames the voter has selected for the current student (up to 2 existing)
  const [selectedNicknameIds, setSelectedNicknameIds] = useState<Id<"nicknames">[]>([]);
  // Custom nickname the voter is typing in
  const [customNicknameText, setCustomNicknameText] = useState("");
  const [chartData, setChartData] = useState<{ nicknameId: string; title: string; count: number }[]>([]);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);

  const currentStudentIndex = queueIndexes[0] ?? -1;
  const currentStudent = currentStudentIndex >= 0 ? students?.[currentStudentIndex] : null;

  // Only load nicknames for the current student — each person has their own pool
  const nicknames = useQuery(
    api.nicknames.getByStudent,
    currentStudent ? { studentId: currentStudent._id } : "skip"
  );

  const studentVotes = useQuery(
    api.votes.getByStudent,
    currentStudent ? { studentId: currentStudent._id } : "skip"
  );

  function toggleNickname(id: Id<"nicknames">) {
    setSelectedNicknameIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  const advanceQueue = useCallback(() => {
    setQueueIndexes((prev) => prev.slice(1));
    setPhase("voting");
    setSelectedNicknameIds([]);
    setCustomNicknameText("");
    setDirection(1);
  }, []);

  async function handleVote() {
    if (!currentStudent || !classId || !voterId) return;
    if (selectedNicknameIds.length === 0 && !customNicknameText.trim()) return;

    setSubmitting(true);
    try {
      const nicknameIds: Id<"nicknames">[] = [...selectedNicknameIds];

      if (customNicknameText.trim()) {
        const customId = await getOrCreateNickname({
          classId,
          studentId: currentStudent._id,
          title: customNicknameText.trim(),
        });
        nicknameIds.push(customId);
      }

      await castVote({
        classId,
        studentId: currentStudent._id,
        nicknameIds,
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

  const router = useRouter();

  function handleNextAfterChart() {
    if (targetStudentId) {
      router.push(`/klass/${slug}/dashboard`);
    } else {
      setDirection(1);
      advanceQueue();
    }
  }

  if (!klass || !students || !votedIds || !initialized) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const votedCount = (students?.length ?? 0) - queueIndexes.length;

  if (queueIndexes.length === 0 && initialized) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center p-8 relative">
        <div className="bg-surface border-8 border-black p-10 text-center max-w-md w-full neubrutalist-shadow -rotate-2 relative">
          <div className="duct-tape w-32 h-8 -top-4 -left-6 -rotate-12"></div>
          <div className="text-6xl mb-4 rotate-12 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">🎊</div>
          <h1 className="font-[family-name:var(--font-headline)] text-primary text-4xl font-black uppercase mb-4 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
            Klart!
          </h1>
          <p className="font-medium mb-8 text-on-background">
            Du har röstat på alla elever i <span className="font-bold border-b-2 border-black">{klass.name}</span>. Kolla in resultatet!
          </p>
          <Link href={`/klass/${slug}/dashboard`} className="btn-primary w-full rotate-2 inline-flex items-center justify-center">
            📊 Se resultaten →
          </Link>
        </div>
      </main>
    );
  }

  const getAvatarColor = (id: string) => {
    const s = String(id);
    const colors = [
      "bg-card-yellow text-black",
      "bg-card-blue text-black",
      "bg-card-pink text-black",
      "bg-card-green text-black",
      "bg-card-purple text-black",
      "bg-card-orange text-black",
      "bg-card-teal text-black",
      "bg-card-indigo text-black",
      "bg-card-rose text-black",
      "bg-card-amber text-black",
      "bg-card-cyan text-black",
      "bg-card-lime text-black",
    ];
    let sum = 0;
    for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <main className="flex-grow flex flex-col items-center relative px-4 py-6 sm:px-8 sm:py-10">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center gap-6">
        {/* Header / Progress bar */}
        <div className="w-full flex items-center gap-4 border-4 border-black p-3 bg-surface rotate-1 neubrutalist-shadow-sm">
          <Link href={`/klass/${slug}`} className="btn-secondary !px-2 !py-1 rotate-[-2deg]">
            ←
          </Link>
          <div className="flex-1">
            <ProgressBar current={votedCount} total={students.length} />
          </div>
        </div>

        {/* Card area */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {phase === "voting" && currentStudent && (
              <motion.div
                key={`vote-${currentStudent._id}`}
                initial={{ opacity: 0, x: direction * 60, rotate: direction * 5 }}
                animate={{ opacity: 1, x: 0, rotate: (currentStudent._id.charCodeAt(0) % 5) - 2 }}
                exit={{ opacity: 0, x: direction * -60, rotate: direction * -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full relative bg-white p-4 pb-8 neubrutalist-shadow border-4 border-black sticker-edge"
              >
                {/* Tape */}
                <div className="duct-tape w-24 h-8 -top-4 -left-6 -rotate-12"></div>
                <div className="duct-tape w-24 h-8 -top-4 -right-6 rotate-12"></div>

                {/* Avatar */}
                <div className={`h-40 sm:h-52 border-4 border-black mb-4 flex items-center justify-center overflow-hidden relative ${getAvatarColor(currentStudent._id)}`}>
                   <div className="text-7xl sm:text-8xl font-black font-[family-name:var(--font-headline)] opacity-90 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                     {currentStudent.name.charAt(0).toUpperCase()}
                   </div>
                   <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,black_1px,transparent_1px)]" style={{ backgroundSize: '10px 10px' }}></div>
                </div>

                <div className="text-center mb-6 border-b-4 border-black pb-4 border-dashed">
                  <h2 className="font-[family-name:var(--font-body)] text-2xl font-bold break-words">
                    {currentStudent.name}
                  </h2>
                </div>

                <div className="flex flex-col gap-4 px-2">
                  <p className="text-sm font-bold uppercase tracking-wider text-center bg-secondary-fixed border-2 border-black rotate-1 self-center px-2 py-1 neubrutalist-shadow-sm">
                    Klassens ___ (max 2)
                  </p>

                  {/* Existing nickname chips for this student */}
                  {nicknames && nicknames.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3">
                      {nicknames.map((nickname, i) => (
                        <button
                          key={nickname._id}
                          className={`nickname-chip ${(i % 2 === 0) ? "rotate-[-1deg]" : "rotate-[2deg]"} ${selectedNicknameIds.includes(nickname._id) ? "selected" : ""}`}
                          onClick={() => toggleNickname(nickname._id)}
                          disabled={!selectedNicknameIds.includes(nickname._id) && selectedNicknameIds.length >= 2}
                        >
                          {selectedNicknameIds.includes(nickname._id) ? "✓ " : ""}Klassens {nickname.title}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-2">
                    <label htmlFor="custom-nickname" className="sr-only">Klassens ___ (valfritt)</label>
                    <input
                      id="custom-nickname"
                      type="text"
                      className="input-field -rotate-1 text-center font-[family-name:var(--font-label)] uppercase text-sm placeholder:normal-case placeholder:text-surface-dim"
                      placeholder='Skriv "Klassens ___"...'
                      value={customNicknameText}
                      onChange={(e) => setCustomNicknameText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleVote(); }}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      className="btn-secondary flex-shrink-0"
                      onClick={handleSkip}
                    >
                      Hoppa
                    </button>
                    <button
                      className="btn-primary flex-1 rotate-1"
                      disabled={submitting || (selectedNicknameIds.length === 0 && !customNicknameText.trim())}
                      onClick={handleVote}
                    >
                      {submitting ? (
                        <><span className="spinner border-black" style={{ width: "1.2rem", height: "1.2rem" }} /> Sparar…</>
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
                initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 1 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full relative bg-white p-6 neubrutalist-shadow border-4 border-black"
              >
                <div className="duct-tape w-24 h-8 -top-4 -left-6 -rotate-12"></div>
                {studentVotes && studentVotes.length > 0 ? (
                  <VotePieChart
                    data={studentVotes}
                    studentName={currentStudent.name}
                    onNext={handleNextAfterChart}
                    nextButtonText={targetStudentId || queueIndexes.length <= 1 ? "Tillbaka till översikt →" : "Nästa elev →"}
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="spinner border-black mb-4 mx-auto" />
                    <button className="btn-primary w-full" onClick={handleNextAfterChart}>
                      {targetStudentId || queueIndexes.length <= 1 ? "Tillbaka till översikt →" : "Nästa elev →"}
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
