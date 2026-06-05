const crypto = require('crypto');

// Helper to verify JWT token
function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSig) return false;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && Date.now() / 1000 > data.exp) return false;

    return data;
  } catch (e) {
    return false;
  }
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

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
  const jwtSecret = process.env.JWT_SECRET || 'majarah-jwt-super-secret-key-2026';

  // Security Access Control Check
  let isAuthorized = false;

  // 1. GET requests to products, inventory, settings are allowed publicly for the storefront
  const isPublicGet = method === 'GET' && ['products', 'inventory', 'settings'].includes(table);
  
  // 2. POST requests to orders are allowed publicly for storefront checkout
  const isPublicOrderCreate = method === 'POST' && table === 'orders';

  if (isPublicGet || isPublicOrderCreate) {
    isAuthorized = true;
  } else {
    // Admin functions require valid JWT
    const decoded = verifyToken(token, jwtSecret);
    if (decoded) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    res.status(401).json({ error: 'Unauthorized access.' });
    return;
  }

  // Proxy the request to Supabase
  const sbUrl = process.env.SUPABASE_URL || 'https://nojnqefgbpyibuhduxdx.supabase.co';
  // Use service role key on the backend to bypass RLS and perform full CRUD safely
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vam5xZWZnYnB5aWJ1aGR1eGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDE4MTIsImV4cCI6MjA5NjE3NzgxMn0.lguSZ6IU4jQmJYKXMf0vD7Qy14j-8cjcUgDWgK8TyoM';

  if (!sbKey) {
    res.status(500).json({ error: 'Supabase credentials are not configured on the server.' });
    return;
  }

  // Re-assemble the query parameters (e.g. filters, orders, selections)
  const queryParams = new URLSearchParams(req.query);
  queryParams.delete('table'); // Remove proxy's own parameter
  const queryString = queryParams.toString();
  
  const targetUrl = `${sbUrl.replace(/\/+$/, '')}/rest/v1/${table}${queryString ? '?' + queryString : ''}`;

  const headers = {
    'apikey': sbKey,
    'Authorization': `Bearer ${sbKey}`,
    'Content-Type': 'application/json'
  };

  if (method === 'POST' || method === 'PATCH') {
    headers['Prefer'] = 'return=representation';
  }

  const fetchOpts = {
    method,
    headers
  };

  if (method !== 'GET' && method !== 'DELETE' && req.body) {
    fetchOpts.body = JSON.stringify(req.body);
  }

  try {
    const sbResponse = await fetch(targetUrl, fetchOpts);
    
    if (!sbResponse.ok) {
      const errText = await sbResponse.text();
      console.error(`Supabase Proxy Error (${sbResponse.status}):`, errText);
      res.status(sbResponse.status).send(errText);
      return;
    }

    let data = await sbResponse.json();

    // Filter sensitive key/value pairs from settings table if client is a guest (no valid JWT)
    if (table === 'settings' && method === 'GET') {
      const decoded = verifyToken(token, jwtSecret);
      if (!decoded && Array.isArray(data)) {
        data = data.filter(item => !['prelaunch_emails', 'prelaunch_password'].includes(item.key));
      }
    }

    res.status(sbResponse.status).json(data);
  } catch (error) {
    console.error('Proxy fetching error:', error);
    res.status(500).json({ error: 'Internal Server Error while calling database.' });
  }
};
