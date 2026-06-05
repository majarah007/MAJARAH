async function testApiKey() {
  const apiKey = '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';
  try {
    const res = await fetch('https://api.brevo.com/v3/account', {
      headers: {
        'accept': 'application/json',
        'api-key': apiKey
      }
    });
    console.log('STATUS:', res.status);
    const text = await res.text();
    console.log('RESPONSE:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

testApiKey();
