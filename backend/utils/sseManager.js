/**
 * sseManager.js — Centralized SSE (Server-Sent Events) Manager
 *
 * Singleton module. Every controller imports this and calls broadcast()
 * after any mutation. The frontend has ONE EventSource at /api/events
 * that receives all events and invalidates the correct React Query cache.
 *
 * Event types:
 *   'hero-slides'  → hero slide create/update/delete
 *   'categories'   → category create/update/delete
 *   'products'     → product create/update/delete
 */

let clients = [];

/**
 * Register a new SSE client connection.
 * Called by GET /api/events
 */
const addClient = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx proxy buffering
  res.flushHeaders();

  // Send an initial heartbeat so browser confirms connection
  res.write(`event: connected\ndata: {"status":"ok","t":${Date.now()}}\n\n`);
  if (typeof res.flush === 'function') {
    res.flush();
  }

  const clientId = Date.now() + Math.random();
  clients.push({ id: clientId, res });
  console.log(`[SSE] Client connected. Total clients: ${clients.length}`);

  // Clean up when browser tab is closed or navigates away
  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
    console.log(`[SSE] Client disconnected. Total clients: ${clients.length}`);
  });
};

/**
 * Broadcast an event to ALL connected browser tabs.
 * @param {string} type  - e.g. 'categories', 'products', 'hero-slides'
 * @param {object} [payload] - optional extra data (not required by frontend)
 */
const broadcast = (type, payload = {}) => {
  const data = JSON.stringify({ type, t: Date.now(), ...payload });
  const message = `event: update\ndata: ${data}\n\n`;

  console.log(`[SSE] Broadcasting event: "${type}" to ${clients.length} clients`);

  clients = clients.filter(client => {
    try {
      client.res.write(message);
      if (typeof client.res.flush === 'function') {
        client.res.flush();
      }
      return true; // keep alive clients
    } catch (_) {
      return false; // remove dead/disconnected clients
    }
  });
};

// Send keep-alive comment ping every 20 seconds to prevent connection drops by proxies/browsers
setInterval(() => {
  clients = clients.filter(client => {
    try {
      client.res.write(':\n\n'); // SSE comment heartbeat
      if (typeof client.res.flush === 'function') {
        client.res.flush();
      }
      return true;
    } catch (_) {
      return false;
    }
  });
}, 20000);

module.exports = { addClient, broadcast };
