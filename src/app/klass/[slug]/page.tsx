"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { use } from "react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ClassHubPage({ params }: Props) {
  const { slug } = use(params);
  const klass = useQuery(api.classes.getBySlug, { slug });

  if (klass === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (klass === null) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="glass-card animate-scale-in" style={{ padding: "3rem 2rem", textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🤔</div>
          <h1 className="font-outfit" style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Hittar inte klassen
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            Den här länken verkar inte fungera. Dubbelkolla att du har rätt adress.
          </p>
          <Link href="/" className="btn-secondary" style={{ textDecoration: "none" }}>
            ← Tillbaka till startsidan
          </Link>
        </div>
      </main>
    );
  }

  const studentCount = klass ? 25 : 0; // will be replaced by live count

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
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem 1.25rem",
        }}
      >
        <div className="animate-scale-in" style={{ textAlign: "center", maxWidth: 500, width: "100%" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "0.35rem 1rem",
              background: "rgba(124, 58, 237, 0.12)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              borderRadius: "9999px",
              marginBottom: "1.5rem",
              fontSize: "0.85rem",
              color: "#a78bfa",
              fontWeight: 500,
            }}
          >
            🏆 Klassutmärkelser
          </div>

          <h1
            className="font-outfit gradient-text"
            style={{ fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 800, marginBottom: "0.75rem" }}
          >
            {klass.name}
          </h1>

          <p style={{ color: "var(--text-secondary)", marginBottom: "3rem", fontSize: "1rem" }}>
            Redo att rösta? Klicka nedan och välj utmärkelser för dina klasskompisar!
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
            <Link
              href={`/klass/${slug}/rosta`}
              className="btn-primary"
              style={{ width: "100%", maxWidth: 320, textDecoration: "none", fontSize: "1.1rem", padding: "1rem 2rem" }}
            >
              🗳 Börja rösta
            </Link>

            <Link
              href={`/klass/${slug}/dashboard`}
              className="btn-secondary"
              style={{ width: "100%", maxWidth: 320, textDecoration: "none" }}
            >
              📊 Se live-dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
