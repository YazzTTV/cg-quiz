-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastActivityDate" TIMESTAMP(3),
ADD COLUMN     "winStreak" INTEGER NOT NULL DEFAULT 0;
