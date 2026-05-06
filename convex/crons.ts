import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run the cleanup task every day at 3:00 AM UTC
crons.daily(
  "cleanup-old-classes",
  { hourUTC: 3, minuteUTC: 0 },
  internal.cleanup.runCleanup
);

export default crons;
