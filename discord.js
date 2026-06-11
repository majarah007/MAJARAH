
async function sendOrderToDiscord(order) {
  const WEBHOOK_URL = 'https://discord.com/api/webhooks/1514721625206165578/9z2Lh7Ufp6d_AU3TDJbFfLsbXtPw-cRb9FKKhKurfz9z31_eKGbFRDorRtQGBkoZYmKW';
  
  const embed = {
    username: 'Majarah Orders',
    avatar_url: 'https://majarah.vercel.app/logo.png',
    embeds: [{
      title: '🛍️ NEW ORDER — MAJARAH',
      color: 0xffffff,
      fields: [
        { name: '👤 Name', value: order.name || 'N/A', inline: true },
        { name: '📞 Phone', value: order.phone || 'N/A', inline: true },
        { name: '🏙️ Governorate', value: order.governorate || 'N/A', inline: true },
        { name: '🏠 Address', value: order.address || 'N/A', inline: true },
        { name: '🏢 Apartment', value: order.apartment || 'N/A', inline: true },
        { name: '👕 Product', value: order.productName || 'N/A', inline: true },
        { name: '📐 Size', value: order.size || 'N/A', inline: true },
        { name: '💰 Total', value: `EGP ${order.total || 'N/A'}`, inline: true },
        { name: '📦 Status', value: '🟡 Pending', inline: true },
        { name: '🕐 Time', value: new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' }), inline: false },
      ],
      footer: { text: 'Majarah Storefront • Cairo, Egypt' },
      thumbnail: { url: order.productImage || '' }
    }]
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed)
    });
  } catch (err) {
    console.error('Discord webhook failed:', err);
  }
}
