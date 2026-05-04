import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Cast votes for a student. A voter can vote for up to 2 existing nicknames
 * and submit 1 custom nickname per student. nicknameIds are already resolved
 * (use nicknames.getOrCreate before calling this).
 * Prevents duplicate votes from the same voter for the same student.
 */
export const cast = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("students"),
    nicknameIds: v.array(v.id("nicknames")), // 1–3 nickname IDs
    voterId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if this voter already voted for this student
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_voter_student", (q) =>
        q.eq("voterId", args.voterId).eq("studentId", args.studentId)
      )
      .first();

    if (existing) {
      // Already voted — silently ignore (idempotent)
      return { alreadyVoted: true };
    }

    // Insert one vote record per nickname
    for (const nicknameId of args.nicknameIds) {
      await ctx.db.insert("votes", {
        classId: args.classId,
        studentId: args.studentId,
        nicknameId,
        voterId: args.voterId,
      });
    }

    return { alreadyVoted: false };
  },
});

/**
 * Get all votes for a student, enriched with nickname info (for pie chart).
 */
export const getByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Count votes per nickname
    const tally: Record<string, number> = {};
    for (const vote of votes) {
      tally[vote.nicknameId] = (tally[vote.nicknameId] || 0) + 1;
    }

    // Enrich with nickname titles
    const enriched = await Promise.all(
      Object.entries(tally).map(async ([nicknameId, count]) => {
        const nickname = await ctx.db
          .query("nicknames")
          .filter((q) => q.eq(q.field("_id"), nicknameId))
          .first();
        return { nicknameId, title: nickname?.title ?? "Okänd", count };
      })
    );

    return enriched.sort((a, b) => b.count - a.count);
  },
});

/**
 * Get all student IDs this voter has already voted for (to skip in queue).
 */
export const getVotedStudentIds = query({
  args: { classId: v.id("classes"), voterId: v.string() },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .filter((q) =>
        q.and(
          q.eq(q.field("classId"), args.classId),
          q.eq(q.field("voterId"), args.voterId)
        )
      )
      .collect();

    return [...new Set(votes.map((vote) => vote.studentId))];
  },
});
