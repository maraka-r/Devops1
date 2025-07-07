/*
  Warnings:

  - You are about to drop the column `available` on the `materiels` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'BANNED');

-- CreateEnum
CREATE TYPE "MaterielStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'OUT_OF_ORDER', 'RETIRED');

-- AlterTable
ALTER TABLE "materiels" DROP COLUMN "available",
ADD COLUMN     "status" "MaterielStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
