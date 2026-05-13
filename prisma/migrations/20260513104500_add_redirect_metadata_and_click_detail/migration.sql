ALTER TABLE "redirects"
ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "redirects_purpose_idx" ON "redirects"("purpose");

ALTER TABLE "click_events"
ADD COLUMN "referrer_host" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "timezone" TEXT,
ADD COLUMN "latitude" TEXT,
ADD COLUMN "longitude" TEXT,
ADD COLUMN "utm_source" TEXT,
ADD COLUMN "utm_medium" TEXT,
ADD COLUMN "utm_campaign" TEXT,
ADD COLUMN "utm_content" TEXT,
ADD COLUMN "utm_term" TEXT;

CREATE INDEX "click_events_country_created_at_idx" ON "click_events"("country", "created_at");
CREATE INDEX "click_events_utm_campaign_created_at_idx" ON "click_events"("utm_campaign", "created_at");
