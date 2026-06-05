const express = require('express');
const router = express.Router();
const { addClient, broadcast } = require('../utils/sseManager');

/**
 * GET /api/events
 * Public SSE stream — frontend subscribes here once and receives
 * all real-time push notifications for any resource mutation.
 */
router.get('/', addClient);

/**
 * POST /api/events/broadcast
 * Force-trigger a synchronization event across all connected frontend clients.
 * Production utility for manual cache invalidation / synchronization.
 */
router.post('/broadcast', (req, res) => {
  const { type, payload } = req.body;

  if (!type) {
    return res.status(400).json({ success: false, message: 'Event type is required' });
  }

  broadcast(type, payload || {});
  res.status(200).json({ success: true, message: `Event '${type}' broadcasted successfully` });
});

module.exports = router;
