// Vercel Serverless Function: Real-time multi-device Sandbox State Sync
// Enables seamless cross-device deposit and withdraw sync between Laptop and Mobile phone

// Global in-memory cache for warm container instances
const memoryDb = new Map();

// Helper to sanitize address key
function cleanKey(addr) {
  if (!addr) return '';
  return String(addr).toLowerCase().trim();
}

export default async function handler(req, res) {
  // Universal CORS headers for seamless cross-device communication
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const address = cleanKey(body?.address);
    const state = body?.state;

    if (address && state) {
      memoryDb.set(address, state);
      // Attempt resilient cloud KV backup for cross-region serverless instances
      try {
        fetch(`https://kv.val.town/v1?key=kv_${address}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        }).catch(() => {});
      } catch {}
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: true, address }));
  }

  if (req.method === 'GET') {
    // Parse address from query (?address=0x...) or path
    let address = req.query?.address || req.query?.id;
    if (!address && req.url) {
      const parts = req.url.split('?')[0].split('/').filter(Boolean);
      if (parts.length > 1) {
        address = parts[parts.length - 1];
      }
    }
    address = cleanKey(address);

    res.setHeader('Content-Type', 'application/json');

    // 1. Check in-memory DB
    if (address && memoryDb.has(address)) {
      res.statusCode = 200;
      return res.end(JSON.stringify(memoryDb.get(address)));
    }

    // 2. Check cloud backup if memory is cold
    if (address) {
      try {
        const cloudRes = await fetch(`https://kv.val.town/v1?key=kv_${address}`);
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData) {
            memoryDb.set(address, cloudData);
            res.statusCode = 200;
            return res.end(JSON.stringify(cloudData));
          }
        }
      } catch {}
    }

    res.statusCode = 200;
    return res.end(JSON.stringify(null));
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ error: 'Method not allowed' }));
}
