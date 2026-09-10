# DATABASE.md

MongoDB + Prisma ORM.

## 1. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum ImportJobStatus {
  RUNNING
  COMPLETED
  FAILED
}

enum ImportLogResult {
  SUCCESS
  DUPLICATE
  FAILED
}

model Admin {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Blog {
  id              String        @id @default(auto()) @map("_id") @db.ObjectId
  title           String
  slug            String        @unique
  excerpt         String?
  content         String        // sanitized HTML
  coverImageId    String?       @db.ObjectId
  coverImage      Media?        @relation("BlogCover", fields: [coverImageId], references: [id])
  categoryId      String?       @db.ObjectId
  category        Category?     @relation(fields: [categoryId], references: [id])
  tagIds          String[]      @db.ObjectId
  tags            Tag[]         @relation("BlogTags", fields: [tagIds], references: [id])
  status          ContentStatus @default(DRAFT)
  metaTitle       String?
  metaDescription String?
  canonicalUrl    String?
  readingTime     Int?          // minutes, computed on save
  featured        Boolean       @default(false)
  author          String?
  publishedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([status, publishedAt])
  @@index([categoryId])
}

model Note {
  id            String        @id @default(auto()) @map("_id") @db.ObjectId
  title         String
  slug          String        @unique
  subject       String?
  content       String        // sanitized HTML
  categoryId    String?       @db.ObjectId
  category      Category?     @relation(fields: [categoryId], references: [id])
  tagIds        String[]      @db.ObjectId
  tags          Tag[]         @relation("NoteTags", fields: [tagIds], references: [id])
  imageIds      String[]      @db.ObjectId
  images        Media[]       @relation("NoteImages", fields: [imageIds], references: [id])
  pdfMediaId    String?       @db.ObjectId
  pdfMedia      Media?        @relation("NotePdf", fields: [pdfMediaId], references: [id])
  source        String?
  status        ContentStatus @default(DRAFT)
  publishedAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([status, publishedAt])
  @@index([categoryId])
}

model Category {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String   @unique
  slug      String   @unique
  blogs     Blog[]
  notes     Note[]
  createdAt DateTime @default(now())
}

model Tag {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String   @unique
  slug      String   @unique
  blogIds   String[] @db.ObjectId
  blogs     Blog[]   @relation("BlogTags", fields: [blogIds], references: [id])
  noteIds   String[] @db.ObjectId
  notes     Note[]   @relation("NoteTags", fields: [noteIds], references: [id])
  createdAt DateTime @default(now())
}

model Media {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  url          String
  altText      String?
  caption      String?
  width        Int?
  height       Int?
  fileSize     Int?     // bytes
  mimeType     String
  order        Int?     // for ordered image sets within a note
  createdAt    DateTime @default(now())

  blogCovers   Blog[]   @relation("BlogCover")
  noteImageIds String[] @db.ObjectId
  noteImages   Note[]   @relation("NoteImages", fields: [noteImageIds], references: [id])
  notePdfs     Note[]   @relation("NotePdf")
}

model ImportJob {
  id           String          @id @default(auto()) @map("_id") @db.ObjectId
  status       ImportJobStatus @default(RUNNING)
  totalFiles   Int
  successCount Int             @default(0)
  duplicateCount Int           @default(0)
  failedCount  Int             @default(0)
  isDryRun     Boolean         @default(false)
  logs         ImportLog[]
  createdAt    DateTime        @default(now())
  completedAt  DateTime?
}

model ImportLog {
  id            String          @id @default(auto()) @map("_id") @db.ObjectId
  importJobId   String          @db.ObjectId
  importJob     ImportJob       @relation(fields: [importJobId], references: [id])
  fileName      String
  result        ImportLogResult
  reason        String?
  createdNoteId String?
  createdAt     DateTime        @default(now())

  @@index([importJobId])
}

model Settings {
  id            String   @id @default("singleton") @map("_id")
  siteTitle     String   @default("Rajasthan Exam Twister")
  siteTagline   String?
  contactEmail  String?
  updatedAt     DateTime @updatedAt
}
```

## 2. Relationships

- `Blog` and `Note` each optionally reference one `Category` (many-to-one) and many `Tag`s (many-to-many via `tagIds`).
- `Note` references many `Media` images (many-to-many via `imageIds`) plus at most one optional PDF attachment (`pdfMediaId`).
- `Blog` has at most one cover image (`coverImageId`).
- `ImportJob` has many `ImportLog` documents (one-to-many).

## 3. Slug Uniqueness & Duplicate Protection

- `slug` is `@unique` on both `Blog` and `Note` at the DB level — the app generates a URL-safe slug from the title (`slugify`) and appends `-2`, `-3`, … on collision.
- During HTML import, duplicate detection compares: (a) generated slug collision, and (b) a content hash (SHA-256 of sanitized body) against existing `Note.content` hashes stored alongside the row. For v1 with moderate volume, slug + fuzzy title match is sufficient and fast.

## 4. Indexes & Search

- Compound index `Blog(status, publishedAt)` and `Note(status, publishedAt)` — for fast "list published, newest first" queries.
- `Blog(categoryId)` and `Note(categoryId)` — for category filtering.
- MongoDB text search indexes (`$text`) on `Blog` (title, excerpt, content) and `Note` (title, subject, content) for full-text search capability.

## 5. Why No Version History (v1)

A single admin, draft-before-publish workflow, and confirmation dialogs on destructive actions cover the realistic risk (accidental overwrite) without the complexity of a `BlogRevision`/`NoteRevision` collection. Revisit if a second editor joins.
