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
