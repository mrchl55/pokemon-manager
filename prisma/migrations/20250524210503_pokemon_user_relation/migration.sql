-- AlterTable
ALTER TABLE "Pokemon" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Pokemon_userId_idx" ON "Pokemon"("userId");

-- AddForeignKey
ALTER TABLE "Pokemon" ADD CONSTRAINT "Pokemon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
