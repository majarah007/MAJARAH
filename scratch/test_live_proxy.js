async function testLiveProxy() {
  try {
    const res = await fetch('https://majarah.vercel.app/api/proxy?table=settings');
    console.log('STATUS:', res.status);
    console.log('OK:', res.ok);
    console.log('HEADERS:', Object.fromEntries(res.headers.entries()));
    const data = await res.json();
    console.log('DATA KEYS:', data.map(item => item.key));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testLiveProxy();
