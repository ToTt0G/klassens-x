import { query, mutation } from "./_generated/server";
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

/**
 * Add a new student to an existing class.
 * Returns the new student ID, or throws if the name already exists in the class.
 */
export const add = mutation({
  args: {
    classId: v.id("classes"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Name cannot be empty");

    const existing = await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const duplicate = existing.find(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) throw new Error(`"${trimmed}" är redan tillagd`);

    const maxOrder = existing.reduce((max, s) => Math.max(max, s.order ?? 0), -1);

    return await ctx.db.insert("students", {
      classId: args.classId,
      name: trimmed,
      order: maxOrder + 1,
    });
  },
});
