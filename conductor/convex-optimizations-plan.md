# Convex Optimizations Plan

This plan outlines the steps to optimize database storage, bandwidth, and function calls for the Klassens website.

## 1. Storage & Automated Cleanup

### Schema Changes
- Update `convex/schema.ts` to remove `classId` and `studentId` from the `votes` table.
- Update `votes` table indexes to `by_nickname` and `by_voter`.

### Cleanup Logic
- Update `convex/cleanup.ts` to use a 60-day cutoff (instead of 3 months).
- Refactor `deleteClass` to cascade-delete votes by finding all nicknames associated with the class, then deleting votes for those nicknames.
- Ensure `crons.ts` still points to the correct cleanup function.

### Mutation Updates
- Update `convex/votes.ts` `cast` mutation to no longer require `classId` and `studentId` in the `votes` documents.
- Refactor `cast` to find existing votes for a voter/student by querying nicknames for that student.

## 2. Database Bandwidth (Server-Side Aggregation)

### Query Refactoring
- Optimize `convex/votes.ts` `getByStudent` to return only the necessary aggregated data.
- Ensure all query returns strip unnecessary Convex metadata (`_creationTime`, etc.).

## 3. Function Calls (Batching)

### Consolidated Queries
- Create `getClassWithStudents` in `convex/classes.ts` or `convex/students.ts` to fetch both class info and the student list in one round-trip.

### Batched Mutations
- Create a new batched mutation (or update `cast`) to handle nickname creation and voting in a single call from the Rosta page.

## 4. Frontend Integration
- Update `src/app/klass/[slug]/rosta/page.tsx` to use the consolidated `getClassWithStudents` query.
- Update the voting flow to batch nickname creation and voting.
- Update calls to `getByStudent` to reflect the new aggregated return format.

## 5. Verification & Deployment
- Run `npm run lint` and `npx tsc` (or equivalent) to ensure type safety.
- Manually verify the voting flow and dashboard charts.
- Push to GitHub to trigger Vercel and Convex previews.
