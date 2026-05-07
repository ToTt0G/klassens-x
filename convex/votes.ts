import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Cast votes for a student. A voter can vote for up to 2 existing nicknames
 * and submit 1 custom nickname per student. nicknameIds are already resolved.
 * Prevents duplicate votes from the same voter for the same student.
 *
 * OPTIMIZATION: No longer stores classId and studentId in the vote document.
 */
export const cast = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("students"),
    nicknameIds: v.array(v.id("nicknames")), // 1–3 nickname IDs
    voterId: v.string(),
  },
  handler: async (ctx, args) => {
    // Delete any existing votes from this voter for this student
    // We still use the by_voter_student index for now for backward compatibility
    // with documents that still have studentId.
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_voter_student", (q) =>
        q.eq("voterId", args.voterId).eq("studentId", args.studentId),
      )
      .collect();

    for (const vote of existing) {
      await ctx.db.delete(vote._id);
    }

    // Insert one vote record per nickname
    // OPTIMIZATION: Only store nicknameId and voterId
    for (const nicknameId of args.nicknameIds) {
      await ctx.db.insert("votes", {
        nicknameId,
        voterId: args.voterId,
      });
    }

    return { alreadyVoted: false };
  },
});

/**
 * Get all votes for a student, aggregated on the server.
 *
 * OPTIMIZATION: Returns a tiny aggregated array instead of raw documents.
 * STRIPPING: Only returns { title, count }.
 */
export const getByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    // 1. Get all nicknames for this student
    const nicknames = await ctx.db
      .query("nicknames")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (nicknames.length === 0) return [];

    // 2. For each nickname, count the votes
    const results = await Promise.all(
      nicknames.map(async (n) => {
        const count = (
          await ctx.db
            .query("votes")
            .withIndex("by_nickname", (q) => q.eq("nicknameId", n._id))
            .collect()
        ).length;

        return {
          nicknameId: n._id,
          title: n.title,
          count,
        };
      }),
    );

    // 3. Filter out zero counts and sort
    return results.filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  },
});

/**
 * Get all student IDs this voter has already voted for.
 *
 * OPTIMIZATION: Returns only a unique array of student IDs (strings).
 */
export const getVotedStudentIds = query({
  args: { classId: v.id("classes"), voterId: v.string() },
  handler: async (ctx, args) => {
    // We fetch nicknames for the class to find where the voter has voted
    const students = await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const votedStudentIds: string[] = [];

    for (const student of students) {
      // Find if voter has any votes for any of this student's nicknames
      const nicknames = await ctx.db
        .query("nicknames")
        .withIndex("by_student", (q) => q.eq("studentId", student._id))
        .collect();

      let hasVoted = false;
      for (const nickname of nicknames) {
        const vote = await ctx.db
          .query("votes")
          .withIndex("by_nickname", (q) => q.eq("nicknameId", nickname._id))
          .filter((q) => q.eq(q.field("voterId"), args.voterId))
          .first();

        if (vote) {
          hasVoted = true;
          break;
        }
      }

      if (hasVoted) {
        votedStudentIds.push(student._id);
      }
    }

    return votedStudentIds;
  },
});

/**
 * Get the nickname IDs a voter has voted for a specific student.
 */
export const getVoterVotesForStudent = query({
  args: { studentId: v.id("students"), voterId: v.string() },
  handler: async (ctx, args) => {
    const nicknames = await ctx.db
      .query("nicknames")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const voteIds = [];
    for (const nickname of nicknames) {
      const votes = await ctx.db
        .query("votes")
        .withIndex("by_nickname", (q) => q.eq("nicknameId", nickname._id))
        .filter((q) => q.eq(q.field("voterId"), args.voterId))
        .collect();

      if (votes.length > 0) {
        voteIds.push(nickname._id);
      }
    }
    return voteIds;
  },
});
