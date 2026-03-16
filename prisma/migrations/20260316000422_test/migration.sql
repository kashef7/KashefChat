-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('Local', 'Google');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'Local';
