const { put, list, get } = require('@vercel/blob');

function blobReady() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

async function parseBody(req) {
  if (req.body) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function readPrivateBlob(pathname) {
  const result = await get(pathname, { access: 'private' });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const storageReady = blobReady();

  if (req.method === 'POST') {
    if (!storageReady) {
      return res.status(503).json({
        error: 'Storage not configured',
        message: 'Connect Vercel Blob storage to this project and redeploy.',
      });
    }

    try {
      const body = await parseBody(req);
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

      await put(`locations/${id}.json`, JSON.stringify(record), {
        access: 'private',
        addRandomSuffix: false,
      });

      return res.status(200).json({ ok: true, id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save location', details: err.message });
    }
  }

  if (req.method === 'GET') {
    const { key } = req.query;
    if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!storageReady) {
      return res.status(200).json({
        locations: [],
        blobConfigured: false,
        message: 'Blob storage is not connected. Add Blob in Vercel Storage and redeploy.',
      });
    }

    try {
      const { blobs } = await list({ prefix: 'locations/' });
      const locations = (
        await Promise.all(
          blobs.map((blob) => readPrivateBlob(blob.pathname))
        )
      ).filter(Boolean);

      locations.sort(
        (a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)
      );

      return res.status(200).json({
        locations,
        blobConfigured: true,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to load locations', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
