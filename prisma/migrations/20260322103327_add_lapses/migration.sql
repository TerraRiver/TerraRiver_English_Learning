-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReviewProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wordId" INTEGER NOT NULL,
    "nextReview" DATETIME NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReviewProgress" ("easeFactor", "id", "interval", "lastReviewed", "nextReview", "repetitions", "wordId") SELECT "easeFactor", "id", "interval", "lastReviewed", "nextReview", "repetitions", "wordId" FROM "ReviewProgress";
DROP TABLE "ReviewProgress";
ALTER TABLE "new_ReviewProgress" RENAME TO "ReviewProgress";
CREATE UNIQUE INDEX "ReviewProgress_wordId_key" ON "ReviewProgress"("wordId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
