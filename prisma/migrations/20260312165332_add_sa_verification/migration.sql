-- CreateEnum
CREATE TYPE "SaVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "sa_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "screenshotUrl" TEXT,
    "saNickname" TEXT,
    "status" "SaVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sa_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sa_verifications_userId_idx" ON "sa_verifications"("userId");

-- CreateIndex
CREATE INDEX "sa_verifications_status_idx" ON "sa_verifications"("status");

-- AddForeignKey
ALTER TABLE "sa_verifications" ADD CONSTRAINT "sa_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
