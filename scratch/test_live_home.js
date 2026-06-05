async function testLiveHome() {
  try {
    const res = await fetch('https://majarah.vercel.app/');
    console.log('STATUS:', res.status);
    const text = await res.text();
    console.log('LENGTH:', text.length);
    console.log('START:', text.slice(0, 500));
    console.log('END (script tags):', text.slice(-500));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testLiveHome();
