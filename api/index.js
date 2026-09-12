export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      res.status(400).json({ error: 'Missing url query parameter' });
      return;
    }

    let target;
    try {
      target = new URL(url);
    } catch {
      res.status(400).json({ error: 'Invalid url' });
      return;
    }

    if (!['http:', 'https:'].includes(target.protocol)) {
      res.status(400).json({ error: 'Only http/https URLs are allowed' });
      return;
    }

    const ua = req.headers['user-agent'] || 'clash-verge/v2.4.3';

    const upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': ua,
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      redirect: 'follow'
    });

    const body = await upstream.arrayBuffer();

    const blockedHeaders = new Set([
      'content-encoding',
      'content-length',
      'transfer-encoding',
      'connection'
    ]);

    upstream.headers.forEach((value, key) => {
      if (!blockedHeaders.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.status).send(Buffer.from(body));
  } catch (err) {
    res.status(500).json({
      error: 'Proxy request failed',
      message: err?.message || String(err)
    });
  }
}
