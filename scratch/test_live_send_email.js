async function testLiveSendEmail() {
  const dummyData = {
    email: 'test@example.com',
    name: 'Test Customer',
    orderId: '12345',
    productName: 'Onyx Graphic Tee',
    size: 'M',
    subtotal: '520',
    shipping: '30',
    total: '550',
    address: '123 Test St',
    phone: '01000000000',
    city: 'Cairo',
    payment: 'COD'
  };

  try {
    const res = await fetch('https://majarah.vercel.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dummyData)
    });
    console.log('STATUS:', res.status);
    console.log('OK:', res.ok);
    const text = await res.text();
    console.log('RESPONSE TEXT:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testLiveSendEmail();
