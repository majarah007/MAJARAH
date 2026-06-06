const crypto = require('crypto');

// Helper to verify JWT token
function verifyToken(token, secret) {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSig) return false;

    let base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Payload.length % 4) {
      base64Payload += '=';
    }
    const data = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
    if (data.exp && Date.now() / 1000 > data.exp) return false;

    return data;
  } catch (e) {
    return false;
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Prefer'
  );
  // FORCE NO CACHE
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { table } = req.query;
  if (!table) {
    res.status(400).json({ error: 'Missing table parameter.' });
    return;
  }

  const method = req.method;
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  const jwtSecret = 'majarah-jwt-super-secret-key-2026';

  let isAuthorized = false;
  const isPublicGet = method === 'GET' && ['products', 'inventory', 'settings', 'site_config'].includes(table);
  const isPublicOrderCreate = method === 'POST' && table === 'orders';

  if (isPublicGet || isPublicOrderCreate) {
    isAuthorized = true;
  } else {
    const decoded = verifyToken(token, jwtSecret);
    if (decoded) isAuthorized = true;
  }

  if (!isAuthorized) {
    res.status(401).json({ error: 'Unauthorized access.' });
    return;
  }

  // WHATWG URL API (Fixes Deprecation Warning)
  // FALLBACK: Hardcoded for MAJARAH to bypass Vercel Env Var injection failure
  const baseUrl = 'https://nojnqefgbpyibuhduxdx.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vam5xZWZnYnB5aWJ1aGR1eGR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYwMTgxMiwiZXhwIjoyMDk2MTc3ODEyfQ.fB-B0lYw-D6_7v7t1Y-X2s4Jm5w9e_aT8M9wX-y0w4k';

  // Debugging log to confirm it's using the hardcoded keys
  console.log('DEBUG: Using hardcoded Supabase keys');

  const targetUrl = new URL(`${baseUrl.replace(/\/+$/, '')}/rest/v1/${table}`);
  
  // Copy all query params except 'table' and 't'
  Object.keys(req.query).forEach(key => {
      if (key !== 'table' && key !== 't') {
          targetUrl.searchParams.append(key, req.query[key]);
      }
  });

  const headers = {
    'apikey': sbKey,
    'Authorization': `Bearer ${sbKey}`,
    'Content-Type': 'application/json',
    'Prefer': req.headers['prefer'] || 'return=representation'
  };

  try {
    const sbResponse = await fetch(targetUrl.toString(), {
      method: method,
      headers: headers,
      body: (method === 'POST' || method === 'PATCH') ? JSON.stringify(req.body) : undefined
    });

    const rawText = await sbResponse.text();
    let data = {};
    if (rawText && rawText.trim() !== '') {
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            console.warn('Proxy warning: Supabase returned non-JSON body on success', rawText);
        }
    }

    if (table === 'settings' && method === 'GET') {
      const decoded = verifyToken(token, jwtSecret);
      if (!decoded && Array.isArray(data)) {
        data = data.filter(item => !['prelaunch_emails'].includes(item.key));
      }
    }

    res.status(sbResponse.status).json(data);
  } catch (error) {
    console.error('Proxy fetching error:', error);
    res.status(500).json({ error: 'Internal Server Error while calling database.' });
  }
};
