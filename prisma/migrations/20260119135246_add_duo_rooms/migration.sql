-- CreateEnum
CREATE TYPE "DuoRoomStatus" AS ENUM ('waiting', 'starting', 'in_progress', 'finished');

-- CreateTable
CREATE TABLE "duo_rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "guestId" TEXT,
    "guestName" TEXT,
    "status" "DuoRoomStatus" NOT NULL DEFAULT 'waiting',
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "questions" JSONB,
    "hostAnswers" JSONB,
    "guestAnswers" JSONB,
    "hostScore" INTEGER NOT NULL DEFAULT 0,
    "guestScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duo_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "duo_rooms_code_key" ON "duo_rooms"("code");
