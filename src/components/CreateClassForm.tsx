"use client";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getOrCreateVoterId, parseStudentNames } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Step = "details" | "students" | "done";

export default function CreateClassForm({ 
  onStepChange 
}: { 
  onStepChange?: (step: Step) => void 
}) {
  const createClass = useMutation(api.classes.create);

  const [step, setStep] = useState<Step>("details");

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);
  const [className, setClassName] = useState("");
  const [studentText, setStudentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [shareableUrl, setShareableUrl] = useState("");

  useEffect(() => {
    if (slug) {
      setShareableUrl(`${window.location.origin}/klass/${slug}`);
    }
  }, [slug]);

  const studentNames = parseStudentNames(studentText);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (studentNames.length < 2) {
      setError("Ange minst 2 elever.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const voterId = getOrCreateVoterId(className.toLowerCase());
      const result = await createClass({
        name: className.trim(),
        createdBy: voterId,
        studentNames,
      });
      setSlug(result.slug);
      setStep("done");
    } catch (err) {
      setError("Något gick fel. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/klass/${slug}`;
    navigator.clipboard.writeText(url);
  }

  const slideVariants = {
    enter: { opacity: 0, x: 30, rotate: 2 },
    center: { opacity: 1, x: 0, rotate: 0 },
    exit: { opacity: 0, x: -30, rotate: -2 },
  };

  return (
    <div className="w-full relative pb-8">
      <AnimatePresence mode="wait">
        {step === "details" && (
          <motion.div
            key="details"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="class-name"
                className="font-[family-name:var(--font-label)] text-on-background uppercase tracking-widest font-bold flex items-center gap-2 text-sm"
              >
                🎒 Din Klass
              </label>
              <div className="relative">
                <input
                  id="class-name"
                  type="text"
                  className="input-field text-center uppercase placeholder:normal-case placeholder:text-surface-dim"
                  placeholder="T.ex. 9B Åsenhögsskolan"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              className="btn-primary w-full -rotate-1 mt-4"
              disabled={!className.trim()}
              onClick={() => setStep("students")}
            >
              Fortsätt →
            </button>
          </motion.div>
        )}

        {step === "students" && (
          <motion.div
            key="students"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                className="btn-ghost -rotate-2"
                onClick={() => setStep("details")}
              >
                ← Bakåt
              </button>
              {studentNames.length > 0 && (
                <span className="badge badge-violet rotate-2">
                  {studentNames.length} elever
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <label
                htmlFor="student-names"
                className="font-[family-name:var(--font-label)] text-on-background uppercase tracking-widest font-bold"
              >
                Elever (en per rad)
              </label>
              <textarea
                id="student-names"
                className="input-field"
                placeholder={"Alice Andersson\nBob Bengtsson\nCarolin Carlsson\n..."}
                value={studentText}
                onChange={(e) => setStudentText(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-error text-on-error px-4 py-2 border-4 border-black rotate-1 font-bold">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full rotate-1 mt-6"
              disabled={loading || studentNames.length < 2}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <span className="spinner border-black" />
                  Skapar…
                </>
              ) : (
                `Skapa klass med ${studentNames.length} elever →`
              )}
            </button>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-center flex flex-col gap-6 items-center"
          >
            <div className="text-6xl rotate-12 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">🎉</div>
            <h2 className="font-[family-name:var(--font-headline)] text-3xl font-black uppercase text-primary border-b-4 border-black pb-2 inline-block -rotate-1">
              Klassen är skapad!
            </h2>
            <p className="font-medium text-on-background">
              Dela länken nedan så kompisarna kan börja rösta.
            </p>

            <div className="w-full bg-surface-bright border-4 border-black p-3 flex items-center gap-3 rotate-1 neubrutalist-shadow-sm text-left">
              <span className="flex-1 text-sm font-bold font-mono break-all text-on-background">
                {shareableUrl || `/klass/${slug}`}
              </span>
              <button
                onClick={copyLink}
                className="btn-secondary !text-sm !px-3 !py-1 shrink-0"
              >
                Kopiera
              </button>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <a href={`/klass/${slug}/rosta`} className="btn-primary w-full -rotate-1">
                Börja rösta nu →
              </a>
              <a href={`/klass/${slug}/dashboard`} className="btn-secondary w-full rotate-1">
                Se live-dashboard
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
