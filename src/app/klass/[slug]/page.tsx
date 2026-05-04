"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { use } from "react";
import CyclingKlassensTitle from "@/components/CyclingKlassensTitle";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ClassHubPage({ params }: Props) {
  const { slug } = use(params);
  const klass = useQuery(api.classes.getBySlug, { slug });

  if (klass === undefined) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="spinner border-black" />
      </div>
    );
  }

  if (klass === null) {
    return (
      <main className="flex-grow flex items-center justify-center p-8">
        <div className="bg-surface-bright border-6 border-black p-10 text-center max-w-md w-full neubrutalist-shadow rotate-1 relative">
          <div className="duct-tape w-24 h-8 -top-4 -left-6 -rotate-12"></div>
          <div className="text-6xl mb-4">🤔</div>
          <h1 className="font-[family-name:var(--font-headline)] text-primary text-3xl font-black uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,1)] mb-4">
            Hittar inte klassen
          </h1>
          <p className="text-on-background font-medium mb-8">
            Den här länken verkar inte fungera. Dubbelkolla att du har rätt adress.
          </p>
          <Link href="/" className="btn-secondary w-full -rotate-1">
            ← Tillbaka till startsidan
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow flex flex-col items-center relative px-4 py-12">
      {/* Decorative bg elements */}
      <div aria-hidden="true" className="absolute top-10 left-10 w-24 h-24 sm:w-32 sm:h-32 bg-secondary-fixed rotate-12 neubrutalist-shadow-sm sticker-edge flex items-center justify-center -z-10 hidden sm:flex">
        <span className="text-3xl sm:text-5xl text-on-secondary-fixed-variant -rotate-6 font-[family-name:var(--font-headline)] font-black">A+</span>
      </div>
      <div aria-hidden="true" className="absolute bottom-20 right-10 w-32 h-32 sm:w-40 sm:h-40 bg-tertiary-fixed -rotate-6 neubrutalist-shadow-sm border-4 border-black p-4 flex items-center justify-center -z-10 hidden sm:flex">
        <span className="text-5xl sm:text-7xl font-bold">🏆</span>
        <div className="duct-tape w-16 h-6 -top-2 -left-4 -rotate-45"></div>
      </div>

      {/* Main card */}
      <div className="flex-grow flex flex-col items-center justify-center w-full">
        <div className="relative w-full max-w-sm sm:max-w-md bg-surface-bright border-6 border-black neubrutalist-shadow -rotate-1 flex flex-col items-center gap-6 p-8 sm:p-10">
          <div className="duct-tape w-24 h-8 -top-4 -left-6 -rotate-12"></div>
          <div className="duct-tape w-24 h-8 -bottom-4 -right-6 -rotate-12"></div>

          {/* Class name */}
          <div className="text-center w-full">
            <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-widest font-bold text-on-background opacity-60 mb-2">
              Du är inbjuden till
            </p>
            <h1 className="font-[family-name:var(--font-headline)] text-primary text-4xl sm:text-5xl font-black uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,1)] -rotate-1 leading-none">
              {klass.name}
            </h1>
          </div>

          <p className="text-center text-on-background font-medium">
            Rösta på vem som är <CyclingKlassensTitle />
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-4 w-full">
            <Link href={`/klass/${slug}/rosta`} className="btn-primary w-full rotate-1">
              🗳 Börja rösta
            </Link>
            <Link href={`/klass/${slug}/dashboard`} className="btn-secondary w-full -rotate-1">
              📊 Se live-dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* By Luka badge */}
      <div className="mt-auto pt-10">
        <a 
          href="https://portfolio.redsunsetfarm.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 border-3 border-black px-3 py-1.5 font-[family-name:var(--font-label)] uppercase text-xs font-bold neubrutalist-shadow-sm bg-white rotate-1 z-10 relative hover:scale-105 transition-transform duration-200"
        >
          <span className="text-base drop-shadow-sm">❤️</span>
          <span className="tracking-wide">Av Luka Koehler</span>
        </a>
      </div>
    </main>
  );
}
