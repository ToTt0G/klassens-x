import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

/**
 * Iterates through all classes and schedules deletion for those older than 3 months.
 */
export const runCleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - THREE_MONTHS_MS;

    let count = 0;
    // Querying with order("asc") uses the built-in creation time index.
    // We stop as soon as we hit a class that's newer than our cutoff.
    for await (const klass of ctx.db.query("classes").order("asc")) {
      if (klass._creationTime < cutoff) {
        await ctx.scheduler.runAfter(0, internal.cleanup.deleteClass, {
          classId: klass._id,
        });
        count++;
      } else {
        break;
      }
    }

    console.log(`Scheduled deletion for ${count} classes.`);
  },
});

/**
 * Deletes a single class and all its associated data (cascading delete).
 */
export const deleteClass = internalMutation({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const { classId } = args;

    // 1. Delete votes
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_class", (q) => q.eq("classId", classId))
      .collect();
    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // 2. Delete nicknames
    const nicknames = await ctx.db
      .query("nicknames")
      .withIndex("by_class", (q) => q.eq("classId", classId))
      .collect();
    for (const nickname of nicknames) {
      await ctx.db.delete(nickname._id);
    }

    // 3. Delete students
    const students = await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", classId))
      .collect();
    for (const student of students) {
      await ctx.db.delete(student._id);
    }

    // 4. Delete the class itself
    await ctx.db.delete(classId);

    console.log(`Deleted class ${classId} and all associated data.`);
  },
});
