import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Inline merging logic (Convex runtime compatible) ─────────

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().normalize("NFC");
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function shouldMerge(a: string, b: string): boolean {
  if (a === b) return true;
  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen <= 5) return a === b;
  if (dist > 3) return false;
  if (dist / maxLen < 0.25) return true;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  return false;
}

// ─── Convex functions ─────────────────────────────────────────

/**
 * Get or create an award for a class, applying fuzzy merge logic.
 * Returns the awardId to use for a vote.
 */
export const getOrCreate = mutation({
  args: {
    classId: v.id("classes"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = normalizeTitle(args.title);

    const existing = await ctx.db
      .query("awards")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Check for fuzzy match
    for (const award of existing) {
      if (shouldMerge(normalized, award.normalizedTitle)) {
        // Track original title in mergedFrom if new
        if (!award.mergedFrom.includes(args.title)) {
          await ctx.db.patch(award._id, {
            mergedFrom: [...award.mergedFrom, args.title],
          });
        }
        return award._id;
      }
    }

    // No match — create new award
    return await ctx.db.insert("awards", {
      classId: args.classId,
      title: args.title,
      normalizedTitle: normalized,
      mergedFrom: [args.title],
    });
  },
});

export const getByClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("awards")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();
  },
});

/**
 * Get leading award for a student (for dashboard display).
 */
export const getTopForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (votes.length === 0) return null;

    const tally: Record<string, number> = {};
    for (const vote of votes) {
      tally[vote.awardId] = (tally[vote.awardId] || 0) + 1;
    }

    const topAwardId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
    const award = await ctx.db
      .query("awards")
      .filter((q) => q.eq(q.field("_id"), topAwardId))
      .first();

    return award
      ? { award, count: tally[topAwardId], totalVotes: votes.length }
      : null;
  },
});
