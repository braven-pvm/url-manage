-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "redirects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "destination_url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "click_events" (
    "id" TEXT NOT NULL,
    "redirect_id" TEXT,
    "requested_code" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "referrer" TEXT,
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "click_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "redirects_code_key" ON "redirects"("code");

-- CreateIndex
CREATE INDEX "redirects_created_at_idx" ON "redirects"("created_at");

-- CreateIndex
CREATE INDEX "click_events_redirect_id_created_at_idx" ON "click_events"("redirect_id", "created_at");

-- CreateIndex
CREATE INDEX "click_events_requested_code_created_at_idx" ON "click_events"("requested_code", "created_at");

-- AddForeignKey
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_redirect_id_fkey" FOREIGN KEY ("redirect_id") REFERENCES "redirects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
