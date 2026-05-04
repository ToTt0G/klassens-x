import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Cast votes for a student. A voter can vote for up to 2 existing awards
 * and submit 1 custom award per student. awardIds is already resolved
 * (use awards.getOrCreate before calling this).
 * Prevents duplicate votes from the same voter for the same student.
 */
export const cast = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("students"),
    awardIds: v.array(v.id("awards")), // 1–3 award IDs
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

    // Insert one vote record per award
    for (const awardId of args.awardIds) {
      await ctx.db.insert("votes", {
        classId: args.classId,
        studentId: args.studentId,
        awardId,
        voterId: args.voterId,
      });
    }

    return { alreadyVoted: false };
  },
});

/**
 * Get all votes for a student, enriched with award info (for pie chart).
 */
export const getByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Count votes per award
    const tally: Record<string, number> = {};
    for (const vote of votes) {
      const key = vote.awardId;
      tally[key] = (tally[key] || 0) + 1;
    }

    // Enrich with award titles using typed query
    const enriched = await Promise.all(
      Object.entries(tally).map(async ([awardId, count]) => {
        const award = await ctx.db
          .query("awards")
          .filter((q) => q.eq(q.field("_id"), awardId))
          .first();
        return { awardId, title: award?.title ?? "Okänd", count };
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

    // Return unique studentIds
    return [...new Set(votes.map((vote) => vote.studentId))];
  },
});
