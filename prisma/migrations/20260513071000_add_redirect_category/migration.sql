ALTER TABLE "redirects"
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'General';

CREATE INDEX "redirects_category_idx" ON "redirects"("category");
