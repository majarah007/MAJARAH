module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Use environment variable if available, otherwise hardcode for now
  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1514721625206165578/9z2Lh7Ufp6d_AU3TDJbFfLsbXtPw-cRb9FKKhKurfz9z31_eKGbFRDorRtQGBkoZYmKW';

  try {
    const discordRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord Proxy Error:", discordRes.status, errText);
      res.status(discordRes.status).json({ error: 'Discord API Error', details: errText });
      return;
    }

    res.status(200).json({ success: true });
  } catch (e) {
    console.error("Discord Proxy Exception:", e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
