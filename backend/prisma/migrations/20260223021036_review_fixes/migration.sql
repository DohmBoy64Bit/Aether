/*
  Warnings:

  - You are about to alter the column `media` on the `Post` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Interaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Interaction" ("id", "postId", "type", "userId") SELECT "id", "postId", "type", "userId" FROM "Interaction";
DROP TABLE "Interaction";
ALTER TABLE "new_Interaction" RENAME TO "Interaction";
CREATE INDEX "Interaction_postId_idx" ON "Interaction"("postId");
CREATE UNIQUE INDEX "Interaction_userId_postId_type_key" ON "Interaction"("userId", "postId", "type");
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media" JSONB,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("content", "createdAt", "flagReason", "flagged", "id", "media", "parentId", "type", "userId") SELECT "content", "createdAt", "flagReason", "flagged", "id", "media", "parentId", "type", "userId" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_flagged_parentId_createdAt_idx" ON "Post"("flagged", "parentId", "createdAt");
CREATE INDEX "Post_userId_createdAt_idx" ON "Post"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");
