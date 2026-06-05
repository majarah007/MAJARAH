module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { email } = req.body || {};
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  const sbUrl = process.env.SUPABASE_URL || 'https://nojnqefgbpyibuhduxdx.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vam5xZWZnYnB5aWJ1aGR1eGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDE4MTIsImV4cCI6MjA5NjE3NzgxMn0.lguSZ6IU4jQmJYKXMf0vD7Qy14j-8cjcUgDWgK8TyoM';

  if (!sbKey) {
    res.status(500).json({ error: 'Supabase credentials are not configured on the server.' });
    return;
  }

  try {
    // 1. Fetch current prelaunch_emails from settings
    const getUrl = `${sbUrl.replace(/\/+$/, '')}/rest/v1/settings?key=eq.prelaunch_emails`;
    const getRes = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!getRes.ok) {
      res.status(getRes.status).json({ error: 'Failed to retrieve settings.' });
      return;
    }

    const data = await getRes.json();
    let emails = [];
    let hasRow = false;

    if (data && data.length > 0) {
      hasRow = true;
      try {
        emails = JSON.parse(data[0].value);
        if (!Array.isArray(emails)) emails = [];
      } catch (e) {
        emails = [];
      }
    }

    // Append if new
    const cleanedEmail = email.trim().toLowerCase();
    if (!emails.includes(cleanedEmail)) {
      emails.push(cleanedEmail);
    } else {
      res.status(200).json({ message: 'Email already registered.' });
      return;
    }

    const updatedValue = JSON.stringify(emails);
    let saveRes;

    if (hasRow) {
      // PATCH existing row
      const patchUrl = `${sbUrl.replace(/\/+$/, '')}/rest/v1/settings?key=eq.prelaunch_emails`;
      saveRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ value: updatedValue })
      });
    } else {
      // POST new row
      const postUrl = `${sbUrl.replace(/\/+$/, '')}/rest/v1/settings`;
      saveRes = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: 'prelaunch_emails', value: updatedValue })
      });
    }

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      res.status(saveRes.status).send(errText);
      return;
    }

    res.status(200).json({ success: true, message: 'Email registered successfully!' });
  } catch (error) {
    console.error('Error registering pre-launch email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
