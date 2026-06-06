const crypto = require('crypto');

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

module.exports = async (req, res) => {
  // Enable CORS
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

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { email, password } = req.body || {};

  const expectedUser = process.env.ADMIN_USER || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'essamhatab999';
  const jwtSecret = process.env.JWT_SECRET || 'majarah-jwt-super-secret-key-2026';

  if (!email || !password) {
    res.status(400).json({ error: 'Email/Username and Password are required.' });
    return;
  }

  // Support both username (admin) and email comparison
  const isUserMatch = email.trim().toLowerCase() === expectedUser.toLowerCase() || email.trim().toLowerCase() === 'admin';
  const isPassMatch = password === expectedPass;

  if (isUserMatch && isPassMatch) {
    // Generate JWT header & payload
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64url(
      JSON.stringify({
        user: expectedUser,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours expiry
      })
    );

    // Sign token
    const signature = crypto
      .createHmac('sha256', jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const token = `${header}.${payload}.${signature}`;

    res.status(200).json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials. Try again.' });
  }
};
