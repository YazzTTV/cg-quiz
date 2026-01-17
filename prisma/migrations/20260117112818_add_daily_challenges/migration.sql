-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_challenge_choices" (
    "id" TEXT NOT NULL,
    "dailyChallengeId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_challenge_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_daily_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyChallengeId" TEXT NOT NULL,
    "selectedChoiceId" TEXT,
    "isCorrect" BOOLEAN,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_challenges_dayNumber_key" ON "daily_challenges"("dayNumber");

-- CreateIndex
CREATE INDEX "daily_challenges_dayNumber_idx" ON "daily_challenges"("dayNumber");

-- CreateIndex
CREATE INDEX "daily_challenges_publishedAt_idx" ON "daily_challenges"("publishedAt");

-- CreateIndex
CREATE INDEX "daily_challenge_choices_dailyChallengeId_idx" ON "daily_challenge_choices"("dailyChallengeId");

-- CreateIndex
CREATE INDEX "user_daily_challenges_userId_idx" ON "user_daily_challenges"("userId");

-- CreateIndex
CREATE INDEX "user_daily_challenges_dailyChallengeId_idx" ON "user_daily_challenges"("dailyChallengeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_challenges_userId_dailyChallengeId_key" ON "user_daily_challenges"("userId", "dailyChallengeId");

-- AddForeignKey
ALTER TABLE "daily_challenge_choices" ADD CONSTRAINT "daily_challenge_choices_dailyChallengeId_fkey" FOREIGN KEY ("dailyChallengeId") REFERENCES "daily_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_challenges" ADD CONSTRAINT "user_daily_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_challenges" ADD CONSTRAINT "user_daily_challenges_dailyChallengeId_fkey" FOREIGN KEY ("dailyChallengeId") REFERENCES "daily_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
