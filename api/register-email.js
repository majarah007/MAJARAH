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

  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!sbUrl || !sbKey) {
    console.error('Critical Error: Supabase environment variables (URL or Service Role Key) are not defined.');
    res.status(500).json({ error: 'Server configuration error.' });
    return;
  }

  // Normalize URL to handle formats both with and without /rest/v1/
  let normalizedUrl = sbUrl.replace(/\/+$/, '');
  if (!normalizedUrl.endsWith('/rest/v1')) {
    normalizedUrl += '/rest/v1';
  }

  try {
    // 1. Fetch current prelaunch_emails from settings
    const getUrl = `${normalizedUrl}/settings?key=eq.prelaunch_emails`;
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
      const patchUrl = `${normalizedUrl}/settings?key=eq.prelaunch_emails`;
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
      const postUrl = `${normalizedUrl}/settings`;
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
