ALTER TABLE "click_events"
ADD COLUMN "redirect_url" TEXT;

CREATE INDEX "click_events_redirect_url_created_at_idx"
ON "click_events"("redirect_url", "created_at");
