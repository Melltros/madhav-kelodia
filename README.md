# Madhav Kelodia Portfolio

Portfolio site with visitor GPS location tracking (Vercel).

## Location tracking

When someone visits your site, the browser asks for **location permission**. If they allow it, their exact GPS coordinates and address are saved. If they deny it, an approximate location from their IP is stored instead.

### View locations (admin)

Open **`/admin`** on your deployed site (e.g. `https://your-site.vercel.app/admin`).

Enter the same value you set for `ADMIN_SECRET` in Vercel.

You'll see a map and list of every visit with coordinates, address, accuracy, and time.

## Vercel setup

1. Push this repo to GitHub and deploy on Vercel (or redeploy if already connected).

2. In **Vercel → Project → Settings → Environment Variables**, add:

   | Name | Value |
   |------|--------|
   | `ADMIN_SECRET` | A strong password only you know (for `/admin`) |
   | `BLOB_READ_WRITE_TOKEN` | Create in Vercel → Storage → Blob → Connect to project |

3. Redeploy after adding env vars.

4. Visit your live site once and **Allow** location when prompted.

5. Open `/admin` and sign in with `ADMIN_SECRET` to see the pin.

## Notes

- GPS only works on **HTTPS** (Vercel provides this).
- Browsers require user consent for precise location.
- Add a privacy notice on your site if you collect location data (recommended for GDPR/local laws).
- Location is sent once per browser tab session (`sessionStorage`).

## Local dev

```bash
npm install
npx vercel dev
```

Blob storage and the API route work fully only with Vercel env vars configured.
