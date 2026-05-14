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

UPDATE "redirects"
SET "category" = 'Referrals'
WHERE lower(trim("category")) IN ('referral', 'referrals', 'referalls');

INSERT INTO "redirect_categories" (
    "id",
    "name",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by"
)
SELECT
    'cat_' || md5("name"),
    "name",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'migration',
    'migration'
FROM (
    VALUES
        ('General'),
        ('Fixed'),
        ('Temporary'),
        ('Referrals'),
        ('Promotion'),
        ('Internal')
    UNION
    SELECT DISTINCT
        CASE
            WHEN lower(trim("category")) IN ('referral', 'referrals', 'referalls') THEN 'Referrals'
            WHEN lower(trim("category")) = 'general' THEN 'General'
            WHEN lower(trim("category")) = 'fixed' THEN 'Fixed'
            WHEN lower(trim("category")) = 'temporary' THEN 'Temporary'
            WHEN lower(trim("category")) IN ('promotion', 'promotions') THEN 'Promotion'
            WHEN lower(trim("category")) = 'internal' THEN 'Internal'
            ELSE trim("category")
        END
    FROM "redirects"
    WHERE trim("category") <> ''
) AS "categories"("name")
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "redirect_tags" (
    "id",
    "slug",
    "label",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by"
)
SELECT
    'tag_' || md5("slug"),
    "slug",
    initcap(replace("slug", '-', ' ')),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'migration',
    'migration'
FROM (
    SELECT DISTINCT trim("tag") AS "slug"
    FROM "redirects"
    CROSS JOIN LATERAL unnest("tags") AS "tag"
    WHERE trim("tag") <> ''
) AS "tags"
ON CONFLICT ("slug") DO NOTHING;
