// Lead Submission API - Sends to AmoCRM and Facebook CAPI
// Vercel Serverless Function

export default async function handler(req, res) {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      name,
      phone,
      whatsapp,
      email,
      package_type,
      comments,
      // Tracking data
      utm = {},
      page_url,
      site_language,
      user_id,
      session_id,
      fbp,
      fbc,
    } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        error: 'Missing required fields: name, phone'
      });
    }

    // Get client IP and user agent
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] ||
                     req.headers['x-real-ip'] ||
                     req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // 1. Send to Facebook CAPI
    const capiEventId = `${user_id}_Lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const capiPayload = {
      event_name: 'Lead',
      event_id: capiEventId,
      event_data: {
        content_name: 'Driver C+E Application',
        content_category: 'Application Form',
        ...(package_type && { content_type: package_type }),
        value: package_type === 'premium' ? 500 : 300,
        currency: 'EUR',
        page_url,
        site_language,
      },
      user_data: {
        email,
        phone,
        country: site_language?.toUpperCase(),
        fbp,
        fbc,
      },
      utm,
    };

    // Call our CAPI endpoint
    const capiResponse = await fetch(`${getBaseUrl(req)}/api/facebook-capi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(capiPayload),
    });

    const capiResult = await capiResponse.json();
    console.log('CAPI Response:', capiResult);

    // 2. Send lead to AmoCRM (если настроено)
    let amocrmResult = null;
    const AMOCRM_SUBDOMAIN = process.env.AMOCRM_SUBDOMAIN;
    const AMOCRM_API_KEY = process.env.AMOCRM_API_KEY;

    if (AMOCRM_SUBDOMAIN && AMOCRM_API_KEY) {
      try {
        const amocrmPayload = {
          name: `Заявка от ${name}`,
          custom_fields_values: [
            { field_id: 'PHONE', values: [{ value: phone }] },
            ...(whatsapp ? [{ field_id: 'WHATSAPP', values: [{ value: whatsapp }] }] : []),
            ...(email ? [{ field_id: 'EMAIL', values: [{ value: email }] }] : []),
            ...(package_type ? [{ field_id: 'PACKAGE', values: [{ value: package_type }] }] : []),
            ...(comments ? [{ field_id: 'COMMENTS', values: [{ value: comments }] }] : []),
            { field_id: 'UTM_SOURCE', values: [{ value: utm.utm_source || '' }] },
            { field_id: 'UTM_CAMPAIGN', values: [{ value: utm.utm_campaign || '' }] },
          ],
        };

        const amocrmResponse = await fetch(
          `https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AMOCRM_API_KEY}`,
            },
            body: JSON.stringify([amocrmPayload]),
          }
        );

        amocrmResult = await amocrmResponse.json();
        console.log('AmoCRM Response:', amocrmResult);
      } catch (amocrmError) {
        console.error('AmoCRM Error:', amocrmError);
        // Don't fail the whole request if AmoCRM fails
      }
    }

    // 3. Send Telegram notification
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        const telegramMessage = `
🚨 *Новая заявка водителя C\\+E*

👤 *Имя:* ${name}
📱 *Телефон:* ${phone}
${whatsapp ? `💬 *WhatsApp:* ${whatsapp}` : ''}
${email ? `📧 *Email:* ${email}` : ''}
${package_type ? `📦 *Пакет:* ${package_type}` : ''}
${comments ? `💭 *Комментарий:* ${comments}` : ''}

🌍 *Язык сайта:* ${site_language || 'ru'}
📊 *UTM:*
  \\- Source: ${utm.utm_source || 'direct'}
  \\- Campaign: ${utm.utm_campaign || '\\-'}
  \\- Medium: ${utm.utm_medium || '\\-'}

🔗 *Страница:* ${page_url}
⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} МСК
        `.trim();

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: telegramMessage,
            parse_mode: 'MarkdownV2',
          }),
        });
      } catch (telegramError) {
        console.error('Telegram Error:', telegramError);
      }
    }

    // Return success
    return res.status(200).json({
      success: true,
      lead_id: amocrmResult?._embedded?.leads?.[0]?.id || null,
      fb_event_id: capiEventId,
      message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
    });

  } catch (error) {
    console.error('Lead submission error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// Helper: Get base URL
function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}
