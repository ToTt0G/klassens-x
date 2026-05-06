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

  // Nicknames per student (e.g. "Klassens Clown" for a specific person).
  // Each nickname is scoped to a single student — suggesting a nickname for
  // one person will never make it appear as an option for anyone else.
  nicknames: defineTable({
    classId: v.id("classes"),
    studentId: v.id("students"), // scoped to this specific student
    title: v.string(), // canonical display title
    normalizedTitle: v.string(), // lowercase + trimmed for dedup/fuzzy merge
    mergedFrom: v.array(v.string()), // original titles merged into this one
  })
    .index("by_class", ["classId"])
    .index("by_student", ["studentId"])
    .index("by_normalized", ["studentId", "normalizedTitle"]),

  // Individual votes: one voter → one student → one nickname
  votes: defineTable({
    classId: v.id("classes"),
    studentId: v.id("students"),
    nicknameId: v.id("nicknames"),
    voterId: v.string(), // sessionStorage UUID of the voter
  })
    .index("by_class", ["classId"])
    .index("by_student", ["studentId"])
    .index("by_voter_student", ["voterId", "studentId"]),
});
