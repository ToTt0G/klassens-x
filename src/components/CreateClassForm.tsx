"use client";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getOrCreateVoterId, parseStudentNames } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Step = "details" | "students" | "done";

export default function CreateClassForm() {
  const createClass = useMutation(api.classes.create);

  const [step, setStep] = useState<Step>("details");
  const [className, setClassName] = useState("");
  const [studentText, setStudentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [shareableUrl, setShareableUrl] = useState("");

  // Set the shareable URL after mount to avoid SSR/client hydration mismatch
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
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="glass-card p-8" style={{ maxWidth: 540, margin: "0 auto" }}>
      <AnimatePresence mode="wait">
        {step === "details" && (
          <motion.div
            key="details"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <h2
              className="font-outfit gradient-text"
              style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}
            >
              Skapa en klass
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.95rem" }}>
              Ge klassen ett namn och gå vidare för att lägga till elever.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="class-name"
                style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem", fontWeight: 500 }}
              >
                Klassens namn
              </label>
              <input
                id="class-name"
                type="text"
                className="input-field"
                placeholder="t.ex. 9B Åsenhögsskolan"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%" }}
              disabled={!className.trim()}
              onClick={() => setStep("students")}
            >
              Nästa →
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
            transition={{ duration: 0.3 }}
          >
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setStep("details")}
              style={{ marginBottom: "1rem" }}
            >
              ← Tillbaka
            </button>
            <h2
              className="font-outfit gradient-text"
              style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}
            >
              Lägg till elever
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.95rem" }}>
              Skriv ett namn per rad. Du kan klistra in en hel lista direkt.
            </p>

            <div style={{ marginBottom: "0.75rem" }}>
              <label
                htmlFor="student-names"
                style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem", fontWeight: 500 }}
              >
                Elever
                {studentNames.length > 0 && (
                  <span className="badge badge-violet" style={{ marginLeft: "0.5rem" }}>
                    {studentNames.length} elever
                  </span>
                )}
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
              <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>
                ⚠ {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%" }}
              disabled={loading || studentNames.length < 2}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: "1.1rem", height: "1.1rem", borderWidth: "2px" }} />
                  Skapar klass…
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
            transition={{ duration: 0.3 }}
            style={{ textAlign: "center" }}
          >
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎉</div>
            <h2
              className="font-outfit gradient-text"
              style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}
            >
              Klassen är skapad!
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.95rem" }}>
              Dela länken med dina klasskompisar så att de kan börja rösta.
            </p>

            {/* Shareable link box */}
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.5rem",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                }}
              >
                {shareableUrl || `/klass/${slug}`}
              </span>
              <button
                onClick={copyLink}
                className="btn-secondary"
                style={{ flexShrink: 0, padding: "0.4rem 0.875rem", fontSize: "0.85rem" }}
              >
                Kopiera
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <a href={`/klass/${slug}/rosta`} className="btn-primary" style={{ textDecoration: "none" }}>
                Börja rösta nu →
              </a>
              <a href={`/klass/${slug}/dashboard`} className="btn-secondary" style={{ textDecoration: "none" }}>
                Se live-dashboard
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
