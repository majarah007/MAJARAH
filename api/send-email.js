
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
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'info@majar.eg';
  const senderName = process.env.BREVO_SENDER_NAME || 'Majarah';

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
        body { font-family: 'DM Mono', monospace; background-color: #000000; color: #ffffff; margin: 0; padding: 0; }
        .wrapper { background-color: #000000; padding: 40px 20px; text-align: center; }
        .container { background-color: #000000; border: 1px solid #222222; border-radius: 8px; max-width: 600px; margin: 0 auto; padding: 40px 30px; text-align: left; }
        .logo { font-size: 26px; font-weight: 800; color: #ccff00; letter-spacing: 2px; text-align: center; margin-bottom: 30px; text-transform: uppercase; }
        .title { font-size: 20px; font-weight: 600; border-bottom: 1px solid #1a1a1a; padding-bottom: 15px; margin-bottom: 25px; text-align: center; color: #ffffff; }
        .greeting { font-size: 14px; line-height: 1.6; color: #cccccc; margin-bottom: 30px; }
        .details-box { background-color: #090909; border: 1px solid #1a1a1a; border-radius: 6px; padding: 20px; margin-bottom: 30px; }
        .details-title { color: #ccff00; font-size: 13px; font-weight: 700; margin-top: 0; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
        .detail-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #1a1a1a; padding: 8px 0; font-size: 13px; color: #bbbbbb; }
        .detail-row:last-child { border-bottom: none; }
        .detail-value { color: #ffffff; font-weight: 500; }
        .total-row { display: flex; justify-content: space-between; padding: 15px 0 0 0; font-size: 15px; font-weight: 600; color: #ccff00; border-top: 1px solid #222222; margin-top: 10px; }
        .footer { font-size: 11px; color: #666666; text-align: center; margin-top: 30px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="logo">Majarah · مَجَرَّة</div>
          <div class="title">Order Confirmed</div>
          
          <div class="greeting">
            Hi ${name || 'Customer'},\n\nThank you for shopping with us! We have received your order details and are preparing it for dispatch. Below is a copy of your receipt.
          </div>
          
          <div class="details-box">
            <div class="details-title">Order Details</div>
            <div class="detail-row">
              <span>Order ID:</span>
              <span class="detail-value">#${orderId}</span>
            </div>
            <div class="detail-row">
              <span>Item:</span>
              <span class="detail-value">${productName}</span>
            </div>
            <div class="detail-row">
              <span>Size:</span>
              <span class="detail-value">${size || '—'}</span>
            </div>
            <div class="detail-row">
              <span>Payment Method:</span>
              <span class="detail-value">${payment || 'COD'}</span>
            </div>
            <div class="detail-row">
              <span>Address:</span>
              <span class="detail-value">${address}</span>
            </div>
            <div class="detail-row">
              <span>Phone:</span>
              <span class="detail-value">${phone}</span>
            </div>
            <div class="detail-row">
              <span>City:</span>
              <span class="detail-value">${city || '—'}</span>
            </div>
            
            <div class="total-row">
              <span>Total Amount:</span>
              <span>${total} EGP</span>
            </div>
          </div>
          
          <div class="footer">
            If you have any questions or would like to modify your order, please reply to this email or contact our support team.<br>
            &copy; 2026 MAJARAH. All rights reserved.
          </div>
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
        subject: `Order Confirmation #${orderId} - MAJARAH`,
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
