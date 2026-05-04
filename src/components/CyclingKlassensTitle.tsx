"use client";
import { useEffect, useState } from "react";

const TITLES = [
  "Clown",
  "Guldfisk",
  "Sömntuta",
  "Skrattspegel",
  "Solstråle",
  "Pratkvarn",
  "Nattugla",
  "Fotbollsproffs",
  "Snackmaskin",
  "Smoothie",
  "Stjärna",
  "Dramakung",
  "Drömmaren",
  "Festfixaren",
];

export default function CyclingKlassensTitle() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % TITLES.length);
        setVisible(true);
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Define some neubrutalist styles for the words
  const styles = [
    "bg-primary text-white rotate-2",
    "bg-secondary-fixed text-black -rotate-2",
    "bg-tertiary-fixed text-black rotate-1",
    "bg-surface text-black -rotate-1",
  ];

  const currentStyle = styles[index % styles.length];

  return (
    <span className="inline-flex items-center whitespace-nowrap">
      <span className="font-bold mr-1.5">Klassens</span>
      <span
        className={`inline-block px-2 py-0.5 border-2 border-black font-[family-name:var(--font-headline)] font-black uppercase text-sm neubrutalist-shadow-sm ${currentStyle}`}
        style={{
          transition: "opacity 0.3s, transform 0.3s",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.95)",
        }}
      >
        {TITLES[index]}
      </span>
      <span className="font-bold ml-0.5"></span>
    </span>
  );
}
