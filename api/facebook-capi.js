// Facebook Conversions API (CAPI) Endpoint
// Vercel Serverless Function для отправки событий в Facebook с сервера

import crypto from 'crypto';

const FACEBOOK_API_VERSION = 'v21.0';
const FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || '3789700971281396';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FACEBOOK_TEST_EVENT_CODE = process.env.FACEBOOK_TEST_EVENT_CODE; // Optional для тестирования

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate access token
  if (!FACEBOOK_ACCESS_TOKEN) {
    console.error('Facebook Access Token not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const {
      event_name,
      event_id,
      event_data = {},
      user_data = {},
      utm = {}
    } = req.body;

    // Validate required fields
    if (!event_name || !event_id) {
      return res.status(400).json({
        error: 'Missing required fields: event_name, event_id'
      });
    }

    // Get client IP
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] ||
                     req.headers['x-real-ip'] ||
                     req.socket.remoteAddress;

    // Get user agent
    const userAgent = req.headers['user-agent'];

    // Hash email and phone if provided
    const hashedEmail = user_data.email ? hashSHA256(user_data.email.toLowerCase().trim()) : null;
    const hashedPhone = user_data.phone ? hashSHA256(user_data.phone.replace(/\D/g, '')) : null;

    // Build Facebook CAPI event payload
    const event = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id, // Same event_id as browser pixel for deduplication
      action_source: 'website',
      event_source_url: event_data.page_url || req.headers.referer,
      user_data: {
        client_ip_address: clientIp,
        client_user_agent: userAgent,
        ...(hashedEmail && { em: hashedEmail }),
        ...(hashedPhone && { ph: hashedPhone }),
        ...(user_data.fbc && { fbc: user_data.fbc }), // Facebook click ID from cookie
        ...(user_data.fbp && { fbp: user_data.fbp }), // Facebook browser ID from cookie
        ...(user_data.country && { country: hashSHA256(user_data.country) }),
        ...(user_data.city && { ct: hashSHA256(user_data.city) }),
      },
      custom_data: {
        ...event_data,
        ...utm, // Include UTM parameters
      }
    };

    // Build Facebook API URL
    const apiUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${FACEBOOK_PIXEL_ID}/events`;

    // Prepare request body
    const requestBody = {
      data: [event],
      ...(FACEBOOK_TEST_EVENT_CODE && { test_event_code: FACEBOOK_TEST_EVENT_CODE }),
    };

    // Log request (for debugging)
    console.log('Sending Facebook CAPI event:', {
      event_name,
      event_id,
      client_ip: clientIp,
      has_email: !!hashedEmail,
      has_phone: !!hashedPhone,
    });

    // Send to Facebook
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestBody,
        access_token: FACEBOOK_ACCESS_TOKEN,
      }),
    });

    const result = await response.json();

    // Check Facebook response
    if (!response.ok || result.error) {
      console.error('Facebook CAPI Error:', result);
      return res.status(response.status || 500).json({
        error: 'Facebook API error',
        details: result,
      });
    }

    // Log success
    console.log('Facebook CAPI Success:', {
      event_name,
      event_id,
      events_received: result.events_received,
      fbtrace_id: result.fbtrace_id,
    });

    // Return success
    return res.status(200).json({
      success: true,
      events_received: result.events_received,
      fbtrace_id: result.fbtrace_id,
      event_id,
    });

  } catch (error) {
    console.error('Facebook CAPI handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// Helper: SHA256 hash for PII
function hashSHA256(input) {
  if (!input) return null;
  return crypto.createHash('sha256').update(input).digest('hex');
}
