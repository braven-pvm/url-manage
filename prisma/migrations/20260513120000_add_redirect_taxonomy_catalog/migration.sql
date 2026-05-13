CREATE TABLE "redirect_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "redirect_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "redirect_tags" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "redirect_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "redirect_categories_name_key" ON "redirect_categories"("name");

CREATE UNIQUE INDEX "redirect_tags_slug_key" ON "redirect_tags"("slug");
