-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'VERIFIED_CREATOR', 'OPERATOR', 'VICE_MASTER', 'MASTER');

-- CreateEnum
CREATE TYPE "CreatorPlatform" AS ENUM ('YOUTUBE', 'SOOP', 'TWITCH');

-- CreateEnum
CREATE TYPE "HackStatus" AS ENUM ('SUSPECT', 'PROBABLE', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('AGREE', 'DISAGREE');

-- CreateEnum
CREATE TYPE "MannerTagType" AS ENUM ('BLOCKING', 'VERBAL_ABUSE', 'GRIEFING', 'AFK', 'TEAM_KILL', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "nickname" TEXT,
    "phone" TEXT,
    "barracksAddress" TEXT,
    "barracksVerified" BOOLEAN NOT NULL DEFAULT false,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT true,
    "notificationEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "creator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelUrl" TEXT NOT NULL,
    "platform" "CreatorPlatform" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hack_reports" (
    "id" TEXT NOT NULL,
    "barracksAddress" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "status" "HackStatus" NOT NULL DEFAULT 'SUSPECT',
    "description" TEXT,
    "evidenceUrl" TEXT,
    "youtubeUrl" TEXT,
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hack_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nickname_histories" (
    "id" TEXT NOT NULL,
    "hackReportId" TEXT NOT NULL,
    "oldNickname" TEXT NOT NULL,
    "newNickname" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nickname_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_statuses" (
    "id" TEXT NOT NULL,
    "barracksAddress" TEXT NOT NULL,
    "lastCrawledAt" TIMESTAMP(3),
    "lastNickname" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "hackReportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteType" "VoteType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "hackReportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklist_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "barracksAddress" TEXT NOT NULL,
    "memo" TEXT,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manner_tags" (
    "id" TEXT NOT NULL,
    "barracksAddress" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "tagType" "MannerTagType" NOT NULL,
    "description" TEXT,
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manner_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_barracksAddress_key" ON "users"("barracksAddress");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_userId_key" ON "creator_profiles"("userId");

-- CreateIndex
CREATE INDEX "hack_reports_barracksAddress_idx" ON "hack_reports"("barracksAddress");

-- CreateIndex
CREATE INDEX "hack_reports_nickname_idx" ON "hack_reports"("nickname");

-- CreateIndex
CREATE INDEX "hack_reports_status_idx" ON "hack_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "crawl_statuses_barracksAddress_key" ON "crawl_statuses"("barracksAddress");

-- CreateIndex
CREATE UNIQUE INDEX "votes_hackReportId_userId_key" ON "votes"("hackReportId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_entries_userId_barracksAddress_key" ON "blacklist_entries"("userId", "barracksAddress");

-- CreateIndex
CREATE INDEX "manner_tags_barracksAddress_idx" ON "manner_tags"("barracksAddress");

-- CreateIndex
CREATE INDEX "manner_tags_nickname_idx" ON "manner_tags"("nickname");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hack_reports" ADD CONSTRAINT "hack_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nickname_histories" ADD CONSTRAINT "nickname_histories_hackReportId_fkey" FOREIGN KEY ("hackReportId") REFERENCES "hack_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_hackReportId_fkey" FOREIGN KEY ("hackReportId") REFERENCES "hack_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_hackReportId_fkey" FOREIGN KEY ("hackReportId") REFERENCES "hack_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklist_entries" ADD CONSTRAINT "blacklist_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manner_tags" ADD CONSTRAINT "manner_tags_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
