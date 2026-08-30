const { put, list } = require('@vercel/blob');

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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const blobReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (req.method === 'POST') {
    if (!blobReady) {
      return res.status(503).json({
        error: 'Storage not configured',
        message: 'Add Vercel Blob storage and redeploy. Locations cannot be saved yet.',
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

    if (!blobReady) {
      return res.status(200).json({
        locations: [],
        blobConfigured: false,
        message: 'BLOB_READ_WRITE_TOKEN is missing. Connect Blob in Vercel → Storage, then redeploy.',
      });
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
