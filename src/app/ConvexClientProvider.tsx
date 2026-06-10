"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export default function ConvexClientProvider({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) {
  const convex = useMemo(() => new ConvexReactClient(url), [url]);
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

