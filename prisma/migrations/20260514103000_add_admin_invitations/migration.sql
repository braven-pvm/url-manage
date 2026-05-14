CREATE TYPE "AdminInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

ALTER TABLE "admin_users"
ADD COLUMN "first_name" TEXT,
ADD COLUMN "last_name" TEXT,
ADD COLUMN "clerk_user_id" TEXT;

CREATE TABLE "admin_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "status" "AdminInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "clerk_invitation_id" TEXT NOT NULL,
    "invitation_url" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "admin_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_users_clerk_user_id_key" ON "admin_users"("clerk_user_id");
CREATE UNIQUE INDEX "admin_invitations_clerk_invitation_id_key" ON "admin_invitations"("clerk_invitation_id");
CREATE INDEX "admin_invitations_email_status_idx" ON "admin_invitations"("email", "status");
CREATE INDEX "admin_invitations_status_expires_at_idx" ON "admin_invitations"("status", "expires_at");
