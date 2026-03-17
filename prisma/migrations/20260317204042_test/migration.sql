/*
  Warnings:

  - You are about to drop the column `encryptionKey` on the `MessageKey` table. All the data in the column will be lost.
  - Added the required column `encryptedKey` to the `MessageKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MessageKey" DROP COLUMN "encryptionKey",
ADD COLUMN     "encryptedKey" TEXT NOT NULL;
