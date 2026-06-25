-- AlterEnum
ALTER TYPE "Instrument" ADD VALUE 'KEYBOARD';

-- AlterTable
ALTER TABLE "bands" ADD COLUMN "style_preferences" JSONB;

UPDATE "bands"
SET "style_preferences" = jsonb_build_array("style_preference")
WHERE "style_preference" IS NOT NULL AND "style_preference" <> '';

ALTER TABLE "bands" DROP COLUMN "style_preference";
