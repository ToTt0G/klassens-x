import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .order("asc")
      .collect();
  },
});
