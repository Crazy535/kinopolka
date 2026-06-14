-- CreateTable
CREATE TABLE "shared_results" (
    "id" TEXT NOT NULL,
    "movieIds" INTEGER[] NOT NULL DEFAULT '{}',
    "mediaType" TEXT NOT NULL DEFAULT 'movie',
    "params" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_results_pkey" PRIMARY KEY ("id")
);
