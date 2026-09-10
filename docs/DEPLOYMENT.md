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

## 8. Student Google OAuth Setup (NextAuth)

### Required Environment Variables

```
GOOGLE_CLIENT_ID=         # Google OAuth 2.0 Client ID
GOOGLE_CLIENT_SECRET=     # Google OAuth 2.0 Client Secret
NEXTAUTH_SECRET=          # Random 32+ character string (e.g., openssl rand -base64 32)
NEXTAUTH_URL=             # Canonical app URL (e.g. http://localhost:3000 or https://examtwister.com)
```

### Google Cloud Console Setup Guide

1. **Create/Select Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Click the project dropdown at the top and select **New Project** (e.g. "ExamTwister").
2. **Configure OAuth Consent Screen**:
   - Navigate to **APIs & Services** > **OAuth consent screen**.
   - Select User Type: **External**, then click **Create**.
   - Fill in App Information:
     - **App name**: `Rajasthan Exam Twister`
     - **User support email**: Your admin/support email
     - **Developer contact email**: Your developer email
   - Under **Scopes**, add `openid`, `.../auth/userinfo.email`, and `.../auth/userinfo.profile`.
   - Save and proceed. (Publish the app or add test users during development).
3. **Create OAuth 2.0 Client Credentials**:
   - Go to **APIs & Services** > **Credentials**.
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `ExamTwister Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `https://examtwister.com` (and your Vercel production/preview domains)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (local)
     - `https://examtwister.com/api/auth/callback/google` (production)
   - Click **Create**.
4. **Copy Secrets**:
   - Copy **Client ID** and set as `GOOGLE_CLIENT_ID`.
   - Copy **Client Secret** and set as `GOOGLE_CLIENT_SECRET`.

