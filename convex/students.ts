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
    // SECURITY: Input validation to prevent unbounded memory usage and DoS
    if (args.name.length > 50) {
      throw new Error("Student name cannot exceed 50 characters");
    }

    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Name cannot be empty");

    // Normalise to Title Case (e.g. "ERIK svensson" → "Erik Svensson")
    const titled = trimmed
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const existing = await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const duplicate = existing.find(
      (s) => s.name.toLowerCase() === titled.toLowerCase()
    );
    if (duplicate) throw new Error(`"${titled}" är redan tillagd`);

    const maxOrder = existing.reduce((max, s) => Math.max(max, s.order ?? 0), -1);

    return await ctx.db.insert("students", {
      classId: args.classId,
      name: titled,
      order: maxOrder + 1,
    });
  },
});
