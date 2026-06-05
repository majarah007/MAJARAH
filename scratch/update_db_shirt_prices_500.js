const newUrl = "https://nojnqefgbpyibuhduxdx.supabase.co";
const newKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vam5xZWZnYnB5aWJ1aGR1eGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDE4MTIsImV4cCI6MjA5NjE3NzgxMn0.lguSZ6IU4jQmJYKXMf0vD7Qy14j-8cjcUgDWgK8TyoM";

async function updateProductPrices() {
  try {
    const res = await fetch(`${newUrl}/rest/v1/products?select=*`, {
      headers: {
        'apikey': newKey,
        'Authorization': `Bearer ${newKey}`
      }
    });
    
    if (res.ok) {
      const products = await res.json();
      for (const p of products) {
        const updateRes = await fetch(`${newUrl}/rest/v1/products?id=eq.${p.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': newKey,
            'Authorization': `Bearer ${newKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ price: 500 })
        });
        
        if (updateRes.ok) {
          console.log(`Updated product ${p.name} (ID: ${p.id}) price to 500 EGP.`);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

updateProductPrices();
