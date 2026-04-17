-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "authorEmail" TEXT,
    "authorName" TEXT,
    "category" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);
