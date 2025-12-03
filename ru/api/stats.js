// Vercel Serverless Function: /api/stats.js
// Получение статистики из localStorage

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return simple stats endpoint
    res.status(200).json({
      success: true,
      message: 'Analytics endpoint active',
      timestamp: new Date().toISOString(),
      endpoints: {
        track: '/api/analytics (POST)',
        stats: '/api/stats (GET)'
      }
    });

  } catch (error) {
    console.error('Stats API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
