-- Deterministic score trace: which rules matched, which priority floors were
-- applied, the normalized sub-scores, and the scoring model version. Stored so any
-- lead's Hot/Warm/Cool can be explained after the fact without re-deriving it.
ALTER TABLE "leads" ADD COLUMN "score_trace" jsonb;
