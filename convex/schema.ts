import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Each class group created by a user
  classes: defineTable({
    name: v.string(),
    slug: v.string(), // unique URL-friendly identifier
    createdBy: v.string(), // the voterId of the creator (sessionStorage UUID)
  }).index("by_slug", ["slug"]),

  // Students added by the class creator
  students: defineTable({
    classId: v.id("classes"),
    name: v.string(),
    order: v.number(), // display order
  }).index("by_class", ["classId"]),

  // Award categories (e.g. "Klassens Pajas")
  awards: defineTable({
    classId: v.id("classes"),
    title: v.string(), // canonical display title
    normalizedTitle: v.string(), // lowercase + trimmed for dedup
    mergedFrom: v.array(v.string()), // original titles merged into this one
  })
    .index("by_class", ["classId"])
    .index("by_normalized", ["classId", "normalizedTitle"]),

  // Individual votes: one voter → one student → one award
  votes: defineTable({
    classId: v.id("classes"),
    studentId: v.id("students"),
    awardId: v.id("awards"),
    voterId: v.string(), // sessionStorage UUID of the voter
  })
    .index("by_student", ["studentId"])
    .index("by_voter_student", ["voterId", "studentId"]),
});
