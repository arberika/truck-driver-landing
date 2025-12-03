// Vercel Serverless Function: /api/analytics.js
// Сохраните этот файл как: /Users/erika/Downloads/truck-driver-landing/ru/api/analytics.js

import { MongoClient } from 'mongodb';

// MongoDB Connection String - замените на ваш
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/';
const DB_NAME = 'truck_driver_analytics';
const COLLECTION_NAME = 'events';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedClient = client;
  return client;
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
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Add server-side metadata
    const event = {
      ...req.body,
      server_timestamp: new Date().toISOString(),
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
    };

    // Insert event
    const result = await collection.insertOne(event);

    // Send success response
    res.status(200).json({
      success: true,
      id: result.insertedId
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
