import { mutation, query } from "./_generated/server";
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

// ─── Nickname mutations & queries ─────────────────────────────

/**
 * Get or create a nickname for a specific student, applying fuzzy merge logic.
 *
 * Nicknames are SCOPED PER STUDENT. "Klassens Clown" suggested while voting
 * for student A will never appear as a suggestion when voting for student B.
 *
 * Returns the nicknameId to attach to a vote.
 */
export const getOrCreate = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("students"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = normalizeTitle(args.title);

    // Only look at nicknames already given to THIS student
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

    // No match — create a fresh nickname scoped to this student
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
 * Used to show clickable chips when voting for that student.
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
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (votes.length === 0) return null;

    const tally: Record<string, number> = {};
    for (const vote of votes) {
      tally[vote.nicknameId] = (tally[vote.nicknameId] || 0) + 1;
    }

    const topId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
    const nickname = await ctx.db
      .query("nicknames")
      .filter((q) => q.eq(q.field("_id"), topId))
      .first();

    return nickname
      ? { nickname, count: tally[topId], totalVotes: votes.length }
      : null;
  },
});

/**
 * Get all nicknames and their vote counts for a student.
 */
export const getAllStatsForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (votes.length === 0) return { totalVotes: 0, nicknames: [] };

    const tally: Record<string, number> = {};
    for (const vote of votes) {
      tally[vote.nicknameId] = (tally[vote.nicknameId] || 0) + 1;
    }

    const nicknameIds = Object.keys(tally);
    const nicknames = await Promise.all(
      nicknameIds.map((id) => ctx.db.get(id as Id<"nicknames">))
    );

    const stats = nicknames
      .filter((n): n is NonNullable<typeof n> => n !== null)
      .map((nickname) => ({
        nickname,
        count: tally[nickname._id],
      }))
      .sort((a, b) => b.count - a.count);

    return { totalVotes: votes.length, nicknames: stats };
  },
});
