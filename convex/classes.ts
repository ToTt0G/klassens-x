import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Inline slug generation (Convex runtime compatible)
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export const create = mutation({
  args: {
    name: v.string(),
    createdBy: v.string(),
    studentNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Input validation to prevent DoS via extremely large inputs
    if (args.name.length > 60) {
      throw new Error("Class name cannot exceed 60 characters");
    }
    if (args.studentNames.length > 100) {
      throw new Error("Cannot add more than 100 students at once");
    }
    for (const studentName of args.studentNames) {
      if (studentName.length > 50) {
        throw new Error("Student name cannot exceed 50 characters");
      }
    }

    const slug = generateSlug(args.name);

    const classId = await ctx.db.insert("classes", {
      name: args.name,
      slug,
      createdBy: args.createdBy,
    });

    for (let i = 0; i < args.studentNames.length; i++) {
      await ctx.db.insert("students", {
        classId,
        name: args.studentNames[i],
        order: i,
      });
    }

    return { classId, slug };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("classes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * OPTIMIZATION: Consolidated query to fetch both class and students in one round-trip.
 * STRIPPING: Returns only the necessary fields for the frontend.
 */
export const getWithStudentsBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const klass = await ctx.db
      .query("classes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!klass) return null;

    const students = await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", klass._id))
      .order("asc")
      .collect();

    return {
      _id: klass._id,
      name: klass.name,
      slug: klass.slug,
      students: students.map((s) => ({
        _id: s._id,
        name: s.name,
        order: s.order,
      })),
    };
  },
});
