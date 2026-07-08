
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { email, name, orderId, productName, size, subtotal, shipping, total, address, phone, city, payment } = req.body || {};

  if (!email) {
    res.status(400).json({ error: 'Customer email is required.' });
    return;
  }

  const brevoApiKey = process.env.BREVO_API_KEY || '';
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'majarrah007@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'Majarrah';

  if (!brevoApiKey) {
    res.status(500).json({ error: 'Brevo API key is not configured on the Vercel server.' });
    return;
  }

  // Construct structured HTML content for the confirmation email
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation #${orderId}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 0; }
        .wrapper { background-color: #000000; padding: 40px 20px; }
        .container { background-color: #000000; max-width: 550px; margin: 0 auto; padding: 20px 10px; }
        .logo { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: 6px; text-align: center; text-transform: uppercase; margin-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .sublogo { font-size: 12px; color: #888888; text-align: center; letter-spacing: 2px; margin-bottom: 24px; }
        .divider { border-bottom: 1px solid #1c1c1c; margin: 24px 0; }
        .dotted-divider { border-bottom: 1px dotted #2d2d2d; margin: 16px 0; }
        .greeting-title { font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
        .greeting-desc { font-size: 13px; line-height: 1.6; color: #aaaaaa; margin-bottom: 24px; }
        .details-box { background-color: #080808; border: 1px solid #1c1c1c; border-radius: 6px; padding: 24px; margin-bottom: 24px; }
        .detail-row { margin-bottom: 12px; font-size: 11px; letter-spacing: 1px; color: #555555; font-weight: 700; text-transform: uppercase; }
        .detail-value { color: #ffffff; font-weight: 700; letter-spacing: 0px; text-transform: none; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .ledger-row { font-size: 13px; color: #888888; margin-bottom: 8px; }
        .total-row { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 8px; }
        .manifest-title { font-size: 11px; font-weight: 700; color: #555555; letter-spacing: 1.5px; margin-bottom: 12px; text-transform: uppercase; }
        .manifest-row { font-size: 13px; color: #888888; margin-bottom: 6px; line-height: 1.5; }
        .manifest-value { color: #cccccc; }
        .footer-text { font-size: 9px; color: #444444; text-align: center; letter-spacing: 1.5px; margin-bottom: 8px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="logo">MAJARRAH</div>
          <div class="sublogo">مَجَرَّة</div>
          <div class="divider"></div>
          
          <div class="greeting-title">Hi ${name || 'Customer'},</div>
          <div class="greeting-desc">
            Thank you for your order! We are currently processing your pieces. Below is your official receipt.
          </div>
          
          <div class="details-box">
            <div class="detail-row">ORDER REFERENCE: <span class="detail-value">#${orderId}</span></div>
            <div class="detail-row">GARMENT: <span class="detail-value">${productName} (Size: ${size || '—'})</span></div>
            <div class="detail-row">PAYMENT TYPE: <span class="detail-value">${payment || 'COD'}</span></div>
            <div class="detail-row">PHONE NUMBER: <span class="detail-value">${phone}</span></div>
            
            <div class="divider" style="margin: 16px 0; border-bottom: 1px solid #1c1c1c;"></div>
            
            <div class="ledger-row">Subtotal: ${subtotal} EGP</div>
            <div class="ledger-row">Shipping Fee: ${shipping} EGP</div>
            
            <div class="dotted-divider"></div>
            
            <div class="total-row">Total: ${total} EGP</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="manifest-title">DELIVERY MANIFEST</div>
          <div class="manifest-row"><strong>Recipient:</strong> <span class="manifest-value">${name || ''}</span></div>
          <div class="manifest-row"><strong>Address:</strong> <span class="manifest-value">${address}</span></div>
          <div class="manifest-row"><strong>City/Governorate:</strong> <span class="manifest-value">${city || ''}, Egypt</span></div>
          
          <div class="divider"></div>
          
          <div class="footer-text">HOME DELIVERY · ALL EGYPT GOVERNORATES 🚚</div>
          <div class="footer-text" style="color: #333333;">&copy; 2026 MAJARRAH · مَجَرَّة</div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email, name: name || 'Customer' }],
        subject: `Order Confirmation #${orderId} - MAJARRAH`,
        htmlContent
      })
    });

    if (!brevoResponse.ok) {
      const errText = await brevoResponse.text();
      console.error(`Brevo SMTP Error (${brevoResponse.status}):`, errText);
      res.status(brevoResponse.status).send(errText);
      return;
    }

    const data = await brevoResponse.json();
    res.status(200).json({ success: true, messageId: data.messageId });
  } catch (error) {
    console.error('Brevo communication error:', error);
    res.status(500).json({ error: 'Internal Server Error while sending email.' });
  }
};
