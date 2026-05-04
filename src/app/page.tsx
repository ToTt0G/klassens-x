import CreateClassForm from "@/components/CreateClassForm";

export default function HomePage() {
  return (
    <main style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* Ambient background orbs */}
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
        {/* Hero */}
        <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: "3rem", maxWidth: 600 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
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
            🏆 Klassutmärkelser i realtid
          </div>

          <h1
            className="font-outfit gradient-text"
            style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: "1.25rem" }}
          >
            Klassens Tallrikar
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
              color: "var(--text-secondary)",
              lineHeight: 1.8,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            Skapa en klass, dela länken och låt klasskompisarna rösta på roliga utmärkelser — i realtid!
          </p>
        </div>

        {/* Form */}
        <div
          className="animate-fade-in-up"
          style={{ width: "100%", maxWidth: 540, animationDelay: "0.1s", animationFillMode: "both" }}
        >
          <CreateClassForm />
        </div>

        {/* Features row */}
        <div
          className="animate-fade-in-up"
          style={{
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "3rem",
            animationDelay: "0.2s",
            animationFillMode: "both",
          }}
        >
          {[
            { icon: "⚡", label: "Realtidsuppdateringar" },
            { icon: "🔗", label: "Enkel delningslänk" },
            { icon: "📊", label: "Live-dashboard" },
            { icon: "🧠", label: "Smart sammanslagning" },
          ].map((f) => (
            <div
              key={f.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
