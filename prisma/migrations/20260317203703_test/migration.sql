/*
  Warnings:

  - Added the required column `iv` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "iv" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MessageKey" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptionKey" TEXT NOT NULL,

    CONSTRAINT "MessageKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageKey_messageId_idx" ON "MessageKey"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageKey_messageId_userId_key" ON "MessageKey"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "MessageKey" ADD CONSTRAINT "MessageKey_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageKey" ADD CONSTRAINT "MessageKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
