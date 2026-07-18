-- priorityScore (0-100) is the composite "who do I call first" ranking, blended
-- from urgency (50%), value (30%), and quality (20%) by the scoring engine. It
-- drives the lead tier (Hot/Warm/Cool) and the dashboard priority queue ordering.
-- Denormalized onto the lead alongside the other scores (written by finalizeLead).
ALTER TABLE "leads" ADD COLUMN "priority_score" integer;
