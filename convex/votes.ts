import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Cast votes for a student, optionally creating new nicknames in the same transaction.
 *
 * OPTIMIZATION: Batches nickname creation and voting into a single call.
 * SECURITY: Enforces max 2 votes per student per voter.
 */
export const cast = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("students"),
    nicknameIds: v.array(v.id("nicknames")), // Existing nickname IDs
    customTitles: v.optional(v.array(v.string())), // New titles to create/merge
    voterId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Resolve custom titles into IDs (applying fuzzy merge)
    const resolvedNicknameIds = [...args.nicknameIds];

    if (args.customTitles) {
      for (const title of args.customTitles) {
        // We use an internal function or just re-implement the logic to avoid multiple mutations
        // For simplicity, we'll call the existing logic within this mutation context
        const nicknameId = await ctx.runMutation(
          internal.nicknames.getOrCreateInternal,
          {
            classId: args.classId,
            studentId: args.studentId,
            title,
          },
        );
        if (!resolvedNicknameIds.includes(nicknameId)) {
          resolvedNicknameIds.push(nicknameId);
        }
      }
    }

    // 2. Limit to top 2 (safety)
    const finalNicknameIds = resolvedNicknameIds.slice(0, 2);

    if (finalNicknameIds.length === 0) {
      throw new Error("No nicknames selected");
    }

    // 3. Delete any existing votes from this voter for this student
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_voter", (q) => q.eq("voterId", args.voterId))
      .collect();

    // Manual filter because we removed studentId from index/schema
    // (Note: In a high-traffic app, we'd want a better index, but for this scale it's fine)
    for (const vote of existing) {
      const nickname = await ctx.db.get(vote.nicknameId);
      if (nickname?.studentId === args.studentId) {
        await ctx.db.delete(vote._id);
      }
    }

    // 4. Insert new vote records
    for (const nicknameId of finalNicknameIds) {
      await ctx.db.insert("votes", {
        nicknameId,
        voterId: args.voterId,
      });
    }

    return { success: true };
  },
});

/**
 * Get all votes for a student, aggregated on the server.
 */
export const getByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const nicknames = await ctx.db
      .query("nicknames")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (nicknames.length === 0) return [];

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

    return results.filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  },
});

/**
 * Get all student IDs this voter has already voted for.
 */
export const getVotedStudentIds = query({
  args: { classId: v.id("classes"), voterId: v.string() },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const votedStudentIds: string[] = [];

    for (const student of students) {
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
