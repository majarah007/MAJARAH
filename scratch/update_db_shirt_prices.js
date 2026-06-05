const newUrl = "https://nojnqefgbpyibuhduxdx.supabase.co";
const newKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vam5xZWZnYnB5aWJ1aGR1eGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDE4MTIsImV4cCI6MjA5NjE3NzgxMn0.lguSZ6IU4jQmJYKXMf0vD7Qy14j-8cjcUgDWgK8TyoM";

async function updateProductPrices() {
  try {
    // 1. Fetch current products
    const res = await fetch(`${newUrl}/rest/v1/products?select=*`, {
      headers: {
        'apikey': newKey,
        'Authorization': `Bearer ${newKey}`
      }
    });
    
    if (res.ok) {
      const products = await res.json();
      console.log('Current products:', products.map(p => ({ id: p.id, name: p.name, price: p.price })));
      
      // 2. Update each product price to 450
      for (const p of products) {
        const updateRes = await fetch(`${newUrl}/rest/v1/products?id=eq.${p.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': newKey,
            'Authorization': `Bearer ${newKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ price: 450 })
        });
        
        if (updateRes.ok) {
          console.log(`Updated product ${p.name} (ID: ${p.id}) price to 450 EGP.`);
        } else {
          console.error(`Failed to update product ${p.name}:`, updateRes.status, await updateRes.text());
        }
      }
    } else {
      console.error('Failed to fetch products:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

updateProductPrices();
