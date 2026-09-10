# DEPLOYMENT.md

## 1. Topology

| Component | Provider | Tier |
|---|---|---|
| App (Next.js) | Vercel | Free/Hobby for v1, upgrade to Pro if traffic/build minutes need it |
| Database | MongoDB Atlas (managed MongoDB) | Free tier (M0 cluster) sufficient for v1 content volume |
| Media storage | Cloudinary or ImageKit | Free tier sufficient for v1 (generous image bandwidth/storage) |

## 2. Environment Variables

```
DATABASE_URL=            # MongoDB connection string (e.g. mongodb+srv://user:pass@cluster.mongodb.net/dbname)
JWT_SECRET=               # long random string
ADMIN_SEED_EMAIL=         # used only by the seed script
ADMIN_SEED_PASSWORD=      # used only by the seed script, never logged
MEDIA_PROVIDER=cloudinary # or "imagekit"
CLOUDINARY_URL=           # or IMAGEKIT_* equivalents
NEXT_PUBLIC_SITE_URL=     # for canonical URLs, OG tags, sitemap
```

All set as Vercel project environment variables (Production/Preview/Development scoped separately). Never committed to the repo.

## 3. Database Synchronization

- `prisma db push` synchronizes Prisma schema with MongoDB collections and indexes.
- `prisma generate` generates the Prisma Client.

## 4. Production Build

- `next build` must pass with zero type errors before any deploy (enforced by Batch 8's acceptance criteria and, ideally, a CI check on the git provider before merging to the deploy branch).

## 5. Backups

- MongoDB Atlas provides automated backups and point-in-time recovery on standard clusters (verify current retention at signup time). Cloudinary/ImageKit assets are the durable copy of media; no separate backup needed for those beyond the provider's own durability guarantees.

## 6. Logging & Monitoring

- Vercel's built-in request/function logs are sufficient for v1.
- Application-level errors (e.g. failed imports, auth failures) are logged with enough context to debug but never include secrets, passwords, or full JWTs.
- No dedicated APM/error-tracking service (e.g. Sentry) required for v1 given the scale — noted as a reasonable future addition, not a v1 requirement.

## 7. Cost Separation

**Free/low-cost v1:** Vercel Hobby, MongoDB Atlas M0 free tier, Cloudinary/ImageKit free tier, no paid search or APM.

**Optional future paid services (not needed for v1):** Vercel Pro (traffic growth), paid MongoDB Atlas tier (storage/RAM limits), dedicated error tracking, a background job queue service (only if bulk import volume demands it — see README Open Questions), CDN/edge caching upgrades.
