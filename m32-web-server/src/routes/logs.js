const express = require('express');
const router = express.Router();
const logStore = require('../logStore');

// GET recent log entries
router.get('/', (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    res.json(logStore.getEntries(limit));
});

// SSE stream for real-time log updates
router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send existing recent entries on connect
    for (const entry of logStore.getEntries(50)) {
        res.write(`data: ${JSON.stringify(entry)}\n\n`);
    }

    const removeClient = logStore.addSSEClient(res);
    req.on('close', removeClient);
});

module.exports = router;
