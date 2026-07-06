CREATE TABLE "WorkspaceSettings" (
  "id" TEXT NOT NULL,
  "workspaceName" TEXT NOT NULL DEFAULT 'Private Macro Desk',
  "language" TEXT NOT NULL DEFAULT 'en',
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Zurich',
  "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
  "theme" TEXT NOT NULL DEFAULT 'dark',
  "accentColor" TEXT NOT NULL DEFAULT 'green',
  "fontSize" TEXT NOT NULL DEFAULT 'normal',
  "density" TEXT NOT NULL DEFAULT 'compact',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceSettings_pkey" PRIMARY KEY ("id")
);
