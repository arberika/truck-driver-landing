// Vercel Serverless Function: /api/analytics.js
// Аналитика с отправкой в Telegram и Facebook Conversions API

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// Facebook Conversions API Configuration
const FB_PIXEL_ID = process.env.FB_PIXEL_ID || '3789700971281396'; // Browser Pixel ID
const FB_DATASET_ID = process.env.FB_DATASET_ID || '678938088055473'; // Dataset ID for CAPI
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || '';
const FB_TEST_EVENT_CODE = process.env.FB_TEST_EVENT_CODE || '';

// Important events to send to Telegram
const IMPORTANT_EVENTS = [
  'button_click',
  'discount_button_clicked',
  'discount_click',
  'exit_intent'
];

async function sendToTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram not configured, skipping notification');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Telegram send error:', error);
  }
}

function formatEventMessage(event) {
  const timestamp = new Date(event.timestamp).toLocaleString('ru-RU', { timeZone: 'Europe/Kiev' });
  let message = `🔔 <b>Новое событие на лендинге</b>\n\n`;
  message += `📊 <b>Событие:</b> ${event.event_name}\n`;
  message += `⏰ <b>Время:</b> ${timestamp}\n`;
  message += `🌐 <b>URL:</b> ${event.page?.url || 'N/A'}\n`;
  message += `👤 <b>User ID:</b> ${event.user_id?.substring(0, 20)}...\n`;

  // UTM parameters
  if (event.utm) {
    const utm = event.utm;
    if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
      message += `\n🎯 <b>UTM метки:</b>\n`;
      if (utm.utm_source) message += `- Source: ${utm.utm_source}\n`;
      if (utm.utm_medium) message += `- Medium: ${utm.utm_medium}\n`;
      if (utm.utm_campaign) message += `- Campaign: ${utm.utm_campaign}\n`;
      if (utm.utm_term) message += `- Term: ${utm.utm_term}\n`;
      if (utm.utm_content) message += `- Content: ${utm.utm_content}\n`;
      if (utm.fbclid) message += `- FB Click ID: ${utm.fbclid.substring(0, 20)}...\n`;
      if (utm.gclid) message += `- Google Click ID: ${utm.gclid.substring(0, 20)}...\n`;
    }
  }

  if (event.event_data) {
    if (event.event_data.button_text) {
      message += `🔘 <b>Кнопка:</b> ${event.event_data.button_text}\n`;
    }
    if (event.event_data.href) {
      message += `🔗 <b>Ссылка:</b> ${event.event_data.href}\n`;
    }
    if (event.event_data.platform) {
      message += `📱 <b>Платформа:</b> ${event.event_data.platform}\n`;
    }
    if (event.event_data.time_spent) {
      message += `⏱ <b>Время на сайте:</b> ${event.event_data.time_spent}с\n`;
    }
    if (event.event_data.scroll_depth) {
      message += `📜 <b>Прокрутка:</b> ${event.event_data.scroll_depth.toFixed(0)}%\n`;
    }
  }

  if (event.device) {
    message += `\n📱 <b>Устройство:</b>\n`;
    message += `- Язык: ${event.device.language}\n`;
    message += `- Экран: ${event.device.screen_width}x${event.device.screen_height}\n`;
    if (event.device.is_mobile !== undefined) {
      message += `- Мобильное: ${event.device.is_mobile ? 'Да' : 'Нет'}\n`;
    }
    if (event.device.connection && event.device.connection !== 'unknown') {
      message += `- Соединение: ${event.device.connection}\n`;
    }
  }

  return message;
}

// Send event to Facebook Conversions API
async function sendToFacebookCAPI(event) {
  if (!FB_ACCESS_TOKEN) {
    console.log('Facebook CAPI not configured, skipping');
    return;
  }

  try {
    // Map our event names to Facebook standard events
    const eventMapping = {
      'page_view': 'PageView',
      'button_click': 'ViewContent',
      'discount_click': 'InitiateCheckout',
      'discount_button_clicked': 'InitiateCheckout',
      'form_submit': 'Lead',
      'video_play': 'ViewContent',
      'exit_intent': 'ViewContent'
    };

    const fbEventName = eventMapping[event.event_name] || 'CustomEvent';

    // Generate event_id for deduplication (same as browser pixel)
    const eventId = event.event_id || `${event.user_id}_${event.event_name}_${Date.now()}`;

    // Hash email if present (for user matching)
    const userData = {};
    if (event.ip_address && event.ip_address !== 'unknown') {
      userData.client_ip_address = event.ip_address;
    }
    if (event.user_agent && event.user_agent !== 'unknown') {
      userData.client_user_agent = event.user_agent;
    }
    if (event.utm?.fbclid) {
      userData.fbc = `fb.1.${Date.now()}.${event.utm.fbclid}`;
    }
    if (event.utm?.fbp) {
      userData.fbp = event.utm.fbp;
    }

    // Build custom data
    const customData = {};
    if (event.page?.url) {
      customData.content_name = event.page.title || event.page.url;
      customData.content_category = 'truck-driver-landing';
    }
    if (event.event_data?.button_text) {
      customData.content_ids = [event.event_data.button_text];
    }
    if (event.utm?.utm_source) {
      customData.source = event.utm.utm_source;
    }

    // Build the payload
    const payload = {
      data: [{
        event_name: fbEventName,
        event_time: Math.floor(new Date(event.timestamp || Date.now()).getTime() / 1000),
        event_id: eventId,
        event_source_url: event.page?.url || 'https://ce.woweri.com',
        action_source: 'website',
        user_data: userData,
        custom_data: customData
      }]
    };

    // Add test event code if configured
    if (FB_TEST_EVENT_CODE) {
      payload.test_event_code = FB_TEST_EVENT_CODE;
    }

    // Send to Facebook (using Dataset ID for CAPI)
    const url = `https://graph.facebook.com/v18.0/${FB_DATASET_ID}/events?access_token=${FB_ACCESS_TOKEN}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Facebook CAPI Error:', result);
    } else {
      console.log('Facebook CAPI Success:', {
        event: fbEventName,
        events_received: result.events_received,
        fbtrace_id: result.fbtrace_id
      });
    }

    return result;

  } catch (error) {
    console.error('Facebook CAPI send error:', error);
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Add server-side metadata
    const event = {
      ...req.body,
      server_timestamp: new Date().toISOString(),
      ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
    };

    // Log event (visible in Vercel logs)
    console.log('Analytics Event:', {
      event_name: event.event_name,
      user_id: event.user_id,
      timestamp: event.server_timestamp
    });

    // Send important events to Telegram
    if (IMPORTANT_EVENTS.includes(event.event_name)) {
      const message = formatEventMessage(event);
      await sendToTelegram(message);
    }

    // Send ALL events to Facebook Conversions API
    const fbResult = await sendToFacebookCAPI(event);

    // Send success response
    res.status(200).json({
      success: true,
      event_name: event.event_name,
      timestamp: event.server_timestamp
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
