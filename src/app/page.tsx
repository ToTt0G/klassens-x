"use client";
import { useState } from "react";
import CreateClassForm from "@/components/CreateClassForm";
import CyclingKlassensTitle from "@/components/CyclingKlassensTitle";

export default function HomePage() {
  const [step, setStep] = useState<"details" | "students" | "done">("details");

  return (
    <main className="flex-grow flex flex-col items-center justify-start sm:justify-center relative pt-12 pb-8 px-4 sm:p-8 sm:pt-4">
      {/* Decorative Background Elements */}
      <div aria-hidden="true" className="absolute top-10 left-10 w-24 h-24 sm:w-32 sm:h-32 bg-secondary-fixed rotate-12 neubrutalist-shadow-sm sticker-edge flex items-center justify-center -z-10 hidden sm:flex">
        <span className="text-3xl sm:text-5xl text-on-secondary-fixed-variant -rotate-6 font-[family-name:var(--font-headline)] font-black">A+</span>
      </div>

      <div aria-hidden="true" className="absolute bottom-20 right-10 w-32 h-32 sm:w-40 sm:h-40 bg-tertiary-fixed -rotate-6 neubrutalist-shadow-sm border-4 border-black p-4 flex items-center justify-center -z-10 hidden sm:flex">
        <span className="text-5xl sm:text-7xl font-bold">🏀</span>
        <div className="duct-tape w-16 h-6 -top-2 -left-4 -rotate-45"></div>
      </div>

      <div className="relative shrink-0 w-full max-w-sm sm:max-w-md bg-surface-bright border-6 border-black neubrutalist-shadow rotate-1 flex flex-col items-center gap-5 mt-4 sm:mt-0" style={{ padding: 'clamp(1.25rem, 2.5vw, 2rem)' }}>
        {/* Duct tape accents */}
        <div className="duct-tape w-24 h-8 -top-4 -left-6 -rotate-12"></div>
        <div className="duct-tape w-24 h-8 -bottom-4 -right-6 -rotate-12"></div>

        {/* Header / Logo Area */}
        <div className="text-center w-full mb-2">
          <h1 className="text-5xl sm:text-6xl text-primary drop-shadow-[4px_4px_0_rgba(0,0,0,1)] -rotate-2 font-[family-name:var(--font-headline)] font-black uppercase leading-none">
            Klassens
          </h1>
          <h2 className="text-3xl sm:text-4xl text-on-background bg-secondary-container inline-block px-4 py-1 border-4 border-black rotate-2 neubrutalist-shadow-sm relative z-10 font-[family-name:var(--font-headline)] font-black uppercase leading-tight mt-1">
            Tallrikar
          </h2>
        </div>

        {/* Description */}
        {step === "details" && (
          <p className="text-center text-on-background font-medium mb-2">
            Skapa en klass och rösta på vem som är <CyclingKlassensTitle />
          </p>
        )}

        {/* Form Container */}
        <div className="w-full">
          <CreateClassForm onStepChange={setStep} />
        </div>
      </div>

      {/* Features row */}
      <div className="flex shrink-0 gap-3 sm:gap-4 flex-wrap justify-center mb-8 max-w-2xl z-10 relative" style={{ marginTop: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
        {[
          { icon: "⚡", label: "Realtidsuppdateringar", color: "bg-tertiary-fixed", rotate: "-rotate-2" },
          { icon: "🔗", label: "Enkel delningslänk", color: "bg-secondary-fixed", rotate: "rotate-1" },
          { icon: "📊", label: "Live-dashboard", color: "bg-primary text-white", rotate: "rotate-2" },
          { icon: "❤️", label: "Av Luka Koehler", color: "bg-white", rotate: "-rotate-1", href: "https://portfolio.redsunsetfarm.com" },
        ].map((f) => {
          const className = `flex items-center gap-2 border-3 border-black px-3 py-1.5 font-[family-name:var(--font-label)] uppercase text-xs sm:text-sm font-bold neubrutalist-shadow-sm ${f.color} ${f.rotate} h-full`;
          const Inner = (
            <>
              <span className="text-base sm:text-lg drop-shadow-sm">{f.icon}</span>
              <span className="tracking-wide">{f.label}</span>
            </>
          );

          if (f.href) {
            return (
              <a key={f.label} href={f.href} target="_blank" rel="noopener noreferrer" className={`${className} hover:scale-105 transition-transform duration-200 block decoration-none`}>
                {Inner}
              </a>
            );
          }

          return (
            <div key={f.label} className={className}>
              {Inner}
            </div>
          );
        })}
      </div>
    </main>
  );
}
