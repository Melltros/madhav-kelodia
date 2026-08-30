import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const ip =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        'unknown';

      const record = {
        id,
        ...body,
        ip,
        receivedAt: new Date().toISOString(),
      };

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        await put(`locations/${id}.json`, JSON.stringify(record), {
          access: 'private',
          addRandomSuffix: false,
        });
      } else {
        console.log('[location]', JSON.stringify(record));
      }

      return res.status(200).json({ ok: true, id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save location' });
    }
  }

  if (req.method === 'GET') {
    const { key } = req.query;
    if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(200).json([]);
    }

    try {
      const { blobs } = await list({ prefix: 'locations/' });
      const locations = await Promise.all(
        blobs.map(async (blob) => {
          const response = await fetch(blob.url);
          return response.json();
        })
      );

      locations.sort(
        (a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)
      );

      return res.status(200).json(locations);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to load locations' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
