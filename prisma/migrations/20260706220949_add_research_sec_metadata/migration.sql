-- Safe no-op on fresh databases where these indexes do not exist yet.
DROP INDEX IF EXISTS "ResearchDocument_formType_idx";
DROP INDEX IF EXISTS "ResearchDocument_importance_idx";
