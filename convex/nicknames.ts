import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ─── Fuzzy merge helpers ───────────────────────────────────────

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().normalize("NFC");
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
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

// ─── Nickname mutations & queries ─────────────────────────────

/**
 * Internal version of getOrCreate for batching.
 * Used by votes:cast to keep everything in one transaction.
 */
export const getOrCreateInternal = internalMutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("students"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.title.length > 50) {
      throw new Error("Nickname title cannot exceed 50 characters");
    }

    const normalized = normalizeTitle(args.title);

    const existing = await ctx.db
      .query("nicknames")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    for (const nickname of existing) {
      if (shouldMerge(normalized, nickname.normalizedTitle)) {
        if (!nickname.mergedFrom.includes(args.title)) {
          await ctx.db.patch(nickname._id, {
            mergedFrom: [...nickname.mergedFrom, args.title],
          });
        }
        return nickname._id;
      }
    }

    return await ctx.db.insert("nicknames", {
      classId: args.classId,
      studentId: args.studentId,
      title: args.title,
      normalizedTitle: normalized,
      mergedFrom: [args.title],
    });
  },
});

/**
 * Get or create a nickname for a specific student, applying fuzzy merge logic.
 */
export const getOrCreate = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("students"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.title.length > 50) {
      throw new Error("Nickname title cannot exceed 50 characters");
    }

    const normalized = normalizeTitle(args.title);

    const existing = await ctx.db
      .query("nicknames")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    for (const nickname of existing) {
      if (shouldMerge(normalized, nickname.normalizedTitle)) {
        if (!nickname.mergedFrom.includes(args.title)) {
          await ctx.db.patch(nickname._id, {
            mergedFrom: [...nickname.mergedFrom, args.title],
          });
        }
        return nickname._id;
      }
    }

    return await ctx.db.insert("nicknames", {
      classId: args.classId,
      studentId: args.studentId,
      title: args.title,
      normalizedTitle: normalized,
      mergedFrom: [args.title],
    });
  },
});

/**
 * Get all nicknames that have been suggested for a specific student.
 */
export const getByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nicknames")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
  },
});

/**
 * Get the leading nickname for a student (for dashboard display).
 */
export const getTopForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const nicknames = await ctx.db
      .query("nicknames")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (nicknames.length === 0) return null;

    const tally: { nickname: any; count: number }[] = [];
    for (const nickname of nicknames) {
      const count = (
        await ctx.db
          .query("votes")
          .withIndex("by_nickname", (q) => q.eq("nicknameId", nickname._id))
          .collect()
      ).length;
      tally.push({ nickname, count });
    }

    const sorted = tally.sort((a, b) => b.count - a.count);
    const top = sorted[0];

    if (!top || top.count === 0) return null;

    const totalVotes = sorted.reduce((sum, t) => sum + t.count, 0);

    return {
      nickname: top.nickname,
      count: top.count,
      totalVotes,
    };
  },
});

/**
 * Get all nicknames and their vote counts for a student.
 */
export const getAllStatsForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const nicknames = await ctx.db
      .query("nicknames")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (nicknames.length === 0) return { totalVotes: 0, nicknames: [] };

    const stats = [];
    let totalVotes = 0;

    for (const nickname of nicknames) {
      const count = (
        await ctx.db
          .query("votes")
          .withIndex("by_nickname", (q) => q.eq("nicknameId", nickname._id))
          .collect()
      ).length;

      if (count > 0) {
        stats.push({ nickname, count });
        totalVotes += count;
      }
    }

    return {
      totalVotes,
      nicknames: stats.sort((a, b) => b.count - a.count),
    };
  },
});
